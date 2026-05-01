import type { Request, Response } from "express";
import { AppDataSource } from "./config.ts";
import { Ticket } from "./entity/Ticket.ts";
import { User } from "./entity/User.ts";
import { In, LessThanOrEqual, MoreThan } from "typeorm";
import { HttpError } from "./errors/HttpError.ts";

let dataSourceInit: Promise<void> | null = null;

const ensureDataSource = async (): Promise<void> => {
  if (AppDataSource.isInitialized) {
    return;
  }

  if (!dataSourceInit) {
    dataSourceInit = AppDataSource.initialize().then(async () => {
      await AppDataSource.runMigrations();
      return undefined;
    });
  }

  await dataSourceInit;
};

const releaseExpiredReservations = async (): Promise<void> => {
  const now = new Date();

  await AppDataSource.transaction(async (manager) => {
    const userRepo = manager.getRepository(User);
    const expiredReservations = await userRepo.find({
      where: { status: "PENDING", reservationExpiresAt: LessThanOrEqual(now) },
    });

    if (expiredReservations.length === 0) {
      return;
    }

    const ticketCounts = new Map<number, number>();
    for (const reservation of expiredReservations) {
      const current = ticketCounts.get(reservation.reservedConcertId) ?? 0;
      ticketCounts.set(
        reservation.reservedConcertId,
        current + (reservation.quantity ?? 1),
      );
    }

    const ticketRepo = manager.getRepository(Ticket);
    const concertIds = Array.from(ticketCounts.keys());
    const concerts = await ticketRepo.find({
      where: { concertId: In(concertIds) },
    });

    for (const concert of concerts) {
      concert.stock += ticketCounts.get(concert.concertId) ?? 0;
    }

    await ticketRepo.save(concerts);
    await userRepo.delete(
      expiredReservations.map((reservation) => reservation.userId),
    );
  });
};

export const getConcerts = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  await ensureDataSource();
  const concerts = await AppDataSource.getRepository(Ticket).find();

  res.json(concerts);
};

export const getConcertById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await ensureDataSource();
  const concertId = Number(req.params.id);

  if (!Number.isFinite(concertId)) {
    throw new HttpError(400, "Invalid concert id.");
  }

  const concert = await AppDataSource.getRepository(Ticket).findOne({
    where: { concertId },
  });

  if (!concert) {
    throw new HttpError(404, "Concert not found.");
  }

  res.json(concert);
};

export const getConcertByName = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await ensureDataSource();
  const rawName = req.params.name;
  const concertName = Array.isArray(rawName)
    ? rawName.join(" ").trim()
    : rawName?.trim();

  if (!concertName) {
    throw new HttpError(400, "Concert name is required.");
  }

  const concert = await AppDataSource.getRepository(Ticket).findOne({
    where: { concertName },
  });

  if (!concert) {
    throw new HttpError(404, "Concert not found.");
  }

  res.json(concert);
};

export const createReservation = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await ensureDataSource();
  await releaseExpiredReservations();
  const userId = Number(req.body?.userId);
  const concertId = Number(req.body?.concertId);
  const quantity = Number(req.body?.quantity ?? 1);

  if (!Number.isFinite(userId) || !Number.isFinite(concertId)) {
    throw new HttpError(400, "userId and concertId are required.");
  }

  if (
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    !Number.isInteger(quantity)
  ) {
    throw new HttpError(400, "quantity must be a positive integer.");
  }

  if (!quantity) {
    throw new HttpError(400, "quantity must be at least 1.");
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const ticketRepo = queryRunner.manager.getRepository(Ticket);
    const userRepo = queryRunner.manager.getRepository(User);

    const existingPending = await userRepo.find({
      where: { userId, reservedConcertId: concertId, status: "PENDING" },
    });

    if (existingPending.length > 0) {
      throw new HttpError(
        409,
        "User already has a pending reservation for this concert.",
      );
    }

    const existingCompleted = await userRepo.find({
      where: { userId, reservedConcertId: concertId, status: "COMPLETED" },
    });

    if (existingCompleted.length > 0) {
      throw new HttpError(
        409,
        "User already purchased a ticket for this concert.",
      );
    }
    const decrementResult = await ticketRepo
      .createQueryBuilder()
      .update(Ticket)
      .set({ stock: () => `"stock" - ${quantity}` })
      .where("concertId = :concertId", { concertId })
      .andWhere("stock >= :quantity", { quantity })
      .execute();

    if (!decrementResult.affected) {
      const exists = await ticketRepo.exists({ where: { concertId } });
      throw new HttpError(
        exists ? 409 : 404,
        exists ? "Concert is sold out." : "Concert not found.",
      );
    }

    const concert = await ticketRepo.findOne({ where: { concertId } });
    if (!concert) {
      throw new HttpError(404, "Concert not found.");
    }

    const reservation = userRepo.create({
      userId,
      reservedConcertId: concertId,
      ticket: concert,
      status: "PENDING",
      isReserved: true,
      reservationExpiresAt: expiresAt,
      quantity,
    });

    const saved = await userRepo.save(reservation);
    await queryRunner.commitTransaction();
    res.status(201).json(saved);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    if (!res.headersSent) {
      if (error instanceof HttpError) {
        res.status(error.status).json({
          error: error.code ?? `ERR_${error.status}`,
          message: error.message,
        });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_ERROR", message: "Internal Server Error" });
      }
      return;
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
};

export const createPurchase = async (
  req: Request,
  res: Response,
): Promise<void> => {
  await ensureDataSource();
  await releaseExpiredReservations();
  const userId = Number(req.body?.userId);
  const concertId = Number(req.body?.concertId);
  const quantity = Number(req.body?.quantity ?? 1);

  if (!Number.isFinite(userId) || !Number.isFinite(concertId)) {
    throw new HttpError(400, "userId and concertId are required.");
  }

  if (
    !Number.isFinite(quantity) ||
    quantity < 1 ||
    !Number.isInteger(quantity)
  ) {
    throw new HttpError(400, "quantity must be a positive integer.");
  }

  const now = new Date();
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    const userRepo = queryRunner.manager.getRepository(User);
    const ticketRepo = queryRunner.manager.getRepository(Ticket);
    const existingPurchase = await userRepo.find({
      where: { userId, reservedConcertId: concertId, status: "COMPLETED" },
    });

    if (existingPurchase.length > 0) {
      throw new HttpError(409, "Purchase already completed.");
    }
    const reservation = await userRepo.findOne({
      where: {
        userId,
        reservedConcertId: concertId,
        status: "PENDING",
        reservationExpiresAt: MoreThan(now),
      },
    });

    if (reservation) {
      reservation.status = "COMPLETED";
      reservation.reservationExpiresAt = null;

      const saved = await userRepo.save(reservation);
      await queryRunner.commitTransaction();
      res.status(201).json(saved);
      return;
    }

    const decrementResult = await ticketRepo
      .createQueryBuilder()
      .update(Ticket)
      .set({ stock: () => `"stock" - ${quantity}` })
      .where("concertId = :concertId", { concertId })
      .andWhere("stock >= :quantity", { quantity })
      .execute();

    if (!decrementResult.affected) {
      const exists = await ticketRepo.exists({ where: { concertId } });
      throw new HttpError(
        exists ? 409 : 404,
        exists ? "Concert is sold out." : "Concert not found.",
      );
    }

    const concert = await ticketRepo.findOne({ where: { concertId } });
    if (!concert) {
      throw new HttpError(404, "Concert not found.");
    }

    const purchase = userRepo.create({
      userId,
      reservedConcertId: concertId,
      ticket: concert,
      status: "COMPLETED",
      isReserved: true,
      quantity,
    });

    const saved = await userRepo.save(purchase);
    await queryRunner.commitTransaction();
    res.status(201).json(saved);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    if (!res.headersSent) {
      if (error instanceof HttpError) {
        res.status(error.status).json({
          error: error.code ?? `ERR_${error.status}`,
          message: error.message,
        });
      } else {
        res
          .status(500)
          .json({ error: "INTERNAL_ERROR", message: "Internal Server Error" });
      }
      return;
    }
    throw error;
  } finally {
    await queryRunner.release();
  }
};
