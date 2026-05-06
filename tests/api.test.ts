import express from "express";
import request from "supertest";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import type { DataSource } from "typeorm";
import type { Ticket } from "../src/entity/Ticket.js";
import type { User } from "../src/entity/User.js";
import type { Request, Response } from "express";

vi.mock("../src/rateLimiter.ts", async () => {
  const rateLimit = (await import("express-rate-limit")).default;

  return {
    reserveLimiter: rateLimit({
      windowMs: 60 * 1000,
      max: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: "RATE_LIMIT_EXCEEDED",
        message: "Too many reservation attempts. Try again later.",
      },
    }),
  };
});

let app: express.Express;
let dataSource: DataSource;
let TicketEntity: typeof Ticket;
let UserEntity: typeof User;
let createReservation: (req: Request, res: Response) => Promise<void>;
let createPurchase: (req: Request, res: Response) => Promise<void>;
let resetRateLimitKey: (key: string) => void;

const seedConcerts = async (): Promise<void> => {
  const ticketRepo = dataSource.getRepository(TicketEntity);
  await ticketRepo.save([
    { concertName: "Rock Fest", stock: 2, category: "general" },
    { concertName: "Jazz Night", stock: 1, category: "VIP" },
  ]);
};

const getConcertByName = async (name: string): Promise<Ticket> => {
  const ticketRepo = dataSource.getRepository(TicketEntity);
  const concert = await ticketRepo.findOne({ where: { concertName: name } });

  if (!concert) {
    throw new Error("Seed concert missing.");
  }

  return concert;
};

const createMockResponse = () => {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return res as unknown as Response & { statusCode: number; body: unknown };
};

beforeAll(async () => {
  const load = async <T>(
    label: string,
    importer: () => Promise<T>,
  ): Promise<T> => {
    try {
      return await importer();
    } catch (error) {
      console.error(`Failed to import ${label}:`, error);
      throw error;
    }
  };

  const configModule = await load("config", () => import("../src/config.ts"));
  const ticketModule = await load(
    "Ticket",
    () => import("../src/entity/Ticket.ts"),
  );
  const userModule = await load("User", () => import("../src/entity/User.ts"));
  const routesModule = await load("routes", () => import("../src/routes.ts"));
  const servicesModule = await load(
    "services",
    () => import("../src/services.ts"),
  );
  const limiterModule = await load(
    "rateLimiter",
    () => import("../src/rateLimiter.ts"),
  );

  dataSource = configModule.AppDataSource;
  TicketEntity = ticketModule.Ticket;
  UserEntity = userModule.User;
  createReservation = servicesModule.createReservation;
  createPurchase = servicesModule.createPurchase;
  resetRateLimitKey = limiterModule.reserveLimiter.resetKey.bind(
    limiterModule.reserveLimiter,
  );

  app = express();
  app.use(express.json());
  app.use("/api", routesModule.router);

  if (!dataSource.isInitialized) {
    try {
      await dataSource.initialize();
    } catch (error) {
      console.error("Failed to initialize data source:", error);
      throw error;
    }
  }

  try {
    await dataSource.synchronize(true);
  } catch (error) {
    console.error("Failed to synchronize test schema:", error);
    throw error;
  }
}, 60000);

beforeEach(async () => {
  await dataSource.getRepository(UserEntity).clear();
  await dataSource.getRepository(TicketEntity).clear();
  await seedConcerts();
});

afterEach(() => {
  vi.restoreAllMocks();
  resetRateLimitKey("::ffff:127.0.0.1");
  resetRateLimitKey("127.0.0.1");
});

afterAll(async () => {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
});

describe("concert APIs", () => {
  it("GET /api/concerts returns all concerts", async () => {
    const response = await request(app).get("/api/concerts");

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it("GET /api/concerts/:id returns a concert", async () => {
    const concert = await getConcertByName("Rock Fest");
    const response = await request(app).get(
      `/api/concerts/${concert.concertId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.concertName).toBe("Rock Fest");
  });

  it("GET /api/concerts/name/:name returns a concert", async () => {
    const response = await request(app).get("/api/concerts/name/Rock%20Fest");

    expect(response.status).toBe(200);
    expect(response.body.concertName).toBe("Rock Fest");
  });
});

describe("reservation and purchase", () => {
  it("POST /api/reserve returns 429 after 5 attempts from same client", async () => {
    const concert = await getConcertByName("Rock Fest");
    const payload = { userId: 101, concertId: concert.concertId };

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const response = await request(app).post("/api/reserve").send(payload);
      expect(response.status).not.toBe(429);
    }

    const limitedResponse = await request(app).post("/api/reserve").send(payload);

    expect(limitedResponse.status).toBe(429);
    expect(limitedResponse.body).toEqual({
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many reservation attempts. Try again later.",
    });
  });

  it("POST /api/reserve decrements stock", async () => {
    const concert = await getConcertByName("Rock Fest");
    const response = await request(app)
      .post("/api/reserve")
      .send({ userId: 1, concertId: concert.concertId });

    expect(response.status).toBe(201);

    const updatedConcert = await getConcertByName("Rock Fest");
    expect(updatedConcert.stock).toBe(1);

    const userRepo = dataSource.getRepository(UserEntity);
    const users = await userRepo.find();
    expect(users).toHaveLength(1);
    const [firstUser] = users;
    if (!firstUser) {
      throw new Error("Expected a reservation user record.");
    }
    expect(firstUser.status).toBe("PENDING");
    expect(firstUser.reservationExpiresAt).not.toBeNull();
  });

  it("POST /api/purchase completes a reservation without extra stock decrement", async () => {
    const concert = await getConcertByName("Rock Fest");
    await request(app)
      .post("/api/reserve")
      .send({ userId: 2, concertId: concert.concertId });

    const purchaseResponse = await request(app)
      .post("/api/purchase")
      .send({ userId: 2, concertId: concert.concertId });

    expect(purchaseResponse.status).toBe(201);

    const updatedConcert = await getConcertByName("Rock Fest");
    expect(updatedConcert.stock).toBe(1);

    const userRepo = dataSource.getRepository(UserEntity);
    const user = await userRepo.findOne({ where: { userId: 2 } });
    expect(user?.status).toBe("COMPLETED");
  });

  it("POST /api/purchase supports direct purchase and decrements stock", async () => {
    const concert = await getConcertByName("Jazz Night");
    const response = await request(app)
      .post("/api/purchase")
      .send({ userId: 3, concertId: concert.concertId });

    expect(response.status).toBe(201);

    const updatedConcert = await getConcertByName("Jazz Night");
    expect(updatedConcert.stock).toBe(0);
  });
});

describe("transaction rollback", () => {
  it("rolls back reservation when repository save throws", async () => {
    const rollbackTransaction = vi.fn();
    const commitTransaction = vi.fn();
    const ticketRepo = {
      createQueryBuilder: vi.fn(() => ({
        update: () => ({
          set: () => ({
            where: () => ({
              andWhere: () => ({
                execute: () => Promise.resolve({ affected: 1 }),
              }),
            }),
          }),
        }),
      })),
      exists: vi.fn().mockResolvedValue(true),
      findOne: vi.fn().mockResolvedValue({ concertId: 1, stock: 1 }),
    };
    const userRepo = {
      find: vi.fn().mockResolvedValue([]),
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const queryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction,
      rollbackTransaction,
      release: vi.fn(),
      manager: {
        getRepository: (entity: unknown) =>
          entity === TicketEntity ? ticketRepo : userRepo,
      },
    };

    const runnerSpy = vi
      .spyOn(dataSource, "createQueryRunner")
      .mockReturnValue(queryRunner as never);

    const req = { body: { userId: 1, concertId: 1 } } as Request;
    const res = createMockResponse();

    await createReservation(req, res);

    expect(rollbackTransaction).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);

    runnerSpy.mockRestore();
  });

  it("rolls back purchase when repository save throws", async () => {
    const rollbackTransaction = vi.fn();
    const commitTransaction = vi.fn();
    const ticketRepo = {
      exists: vi.fn().mockResolvedValue(true),
      findOne: vi.fn().mockResolvedValue({ concertId: 1, stock: 1 }),
      createQueryBuilder: vi.fn(() => ({
        update: () => ({
          set: () => ({
            where: () => ({
              andWhere: () => ({
                execute: () => Promise.resolve({ affected: 1 }),
              }),
            }),
          }),
        }),
      })),
    };
    const userRepo = {
      find: vi.fn().mockResolvedValue([]),
      findOne: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(null),
      create: vi.fn().mockReturnValue({}),
      save: vi.fn().mockRejectedValue(new Error("boom")),
    };
    const queryRunner = {
      connect: vi.fn(),
      startTransaction: vi.fn(),
      commitTransaction,
      rollbackTransaction,
      release: vi.fn(),
      manager: {
        getRepository: (entity: unknown) =>
          entity === TicketEntity ? ticketRepo : userRepo,
      },
    };

    const runnerSpy = vi
      .spyOn(dataSource, "createQueryRunner")
      .mockReturnValue(queryRunner as never);

    const req = { body: { userId: 1, concertId: 1 } } as Request;
    const res = createMockResponse();

    await createPurchase(req, res);

    expect(rollbackTransaction).toHaveBeenCalled();
    expect(res.statusCode).toBe(500);

    runnerSpy.mockRestore();
  });
});
