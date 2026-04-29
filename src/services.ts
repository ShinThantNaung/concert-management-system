import type { Request, Response } from "express";
import { AppDataSource } from "./config.js";
import { Ticket } from "./entity/Ticket.js";
import { User } from "./entity/User.js";
import { In, LessThanOrEqual, MoreThan } from "typeorm";

let dataSourceInit: Promise<void> | null = null;

const ensureDataSource = async (): Promise<void> => {
	if (AppDataSource.isInitialized) {
		return;
	}

	if (!dataSourceInit) {
		dataSourceInit = AppDataSource.initialize().then(() => undefined);
	}

	await dataSourceInit;
};

const releaseExpiredReservations = async (): Promise<void> => {
	const now = new Date();

	await AppDataSource.transaction(async (manager) => {
		const userRepo = manager.getRepository(User);
		const expiredReservations = await userRepo.find({
			where: { status: "PENDING", reservationExpiresAt: LessThanOrEqual(now) }
		});

		if (expiredReservations.length === 0) {
			return;
		}

		const ticketCounts = new Map<number, number>();
		for (const reservation of expiredReservations) {
			const current = ticketCounts.get(reservation.reservedConcertId) ?? 0;
			ticketCounts.set(reservation.reservedConcertId, current + 1);
		}

		const ticketRepo = manager.getRepository(Ticket);
		const concertIds = Array.from(ticketCounts.keys());
		const concerts = await ticketRepo.find({ where: { concertId: In(concertIds) } });

		for (const concert of concerts) {
			concert.stock += ticketCounts.get(concert.concertId) ?? 0;
		}

		await ticketRepo.save(concerts);
		await userRepo.delete(expiredReservations.map((reservation) => reservation.userId));
	});
};

export const getConcerts = async (_req: Request, res: Response): Promise<void> => {
	await ensureDataSource();
	const concerts = await AppDataSource.getRepository(Ticket).find();

	res.json(concerts);
};

export const getConcertById = async (req: Request, res: Response): Promise<void> => {
	await ensureDataSource();
	const concertId = Number(req.params.id);

	if (!Number.isFinite(concertId)) {
		res.status(400).json({ message: "Invalid concert id." });
		return;
	}

	const concert = await AppDataSource.getRepository(Ticket).findOne({
		where: { concertId }
	});

	if (!concert) {
		res.status(404).json({ message: "Concert not found." });
		return;
	}

	res.json(concert);
};

export const getConcertByName = async (req: Request, res: Response): Promise<void> => {
	await ensureDataSource();
	const rawName = req.params.name;
	const concertName = Array.isArray(rawName)
		? rawName.join(" ").trim()
		: rawName?.trim();

	if (!concertName) {
		res.status(400).json({ message: "Concert name is required." });
		return;
	}

	const concert = await AppDataSource.getRepository(Ticket).findOne({
		where: { concertName }
	});

	if (!concert) {
		res.status(404).json({ message: "Concert not found." });
		return;
	}

	res.json(concert);
};

export const createReservation = async (req: Request, res: Response): Promise<void> => {
	await ensureDataSource();
	await releaseExpiredReservations();
	const userId = Number(req.body?.userId);
	const concertId = Number(req.body?.concertId);

	if (!Number.isFinite(userId) || !Number.isFinite(concertId)) {
		res.status(400).json({ message: "userId and concertId are required." });
		return;
	}

	const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
	const queryRunner = AppDataSource.createQueryRunner();

	await queryRunner.connect();
	await queryRunner.startTransaction();
	try {
		const ticketRepo = queryRunner.manager.getRepository(Ticket);
		const userRepo = queryRunner.manager.getRepository(User);
		const decrementResult = await ticketRepo
			.createQueryBuilder()
			.update(Ticket)
			.set({ stock: () => '"stock" - 1' })
			.where("concertId = :concertId", { concertId })
			.andWhere("stock > 0")
			.execute();

		if (!decrementResult.affected) {
			const exists = await ticketRepo.exists({ where: { concertId } });
			await queryRunner.rollbackTransaction();
			res.status(exists ? 409 : 404).json({
				message: exists ? "Concert is sold out." : "Concert not found."
			});
			return;
		}

		const concert = await ticketRepo.findOne({ where: { concertId } });
		if (!concert) {
			await queryRunner.rollbackTransaction();
			res.status(404).json({ message: "Concert not found." });
			return;
		}

		const reservation = userRepo.create({
			userId,
			reservedConcertId: concertId,
			ticket: concert,
			status: "PENDING",
			isReserved: true,
			reservationExpiresAt: expiresAt
		});

		const saved = await userRepo.save(reservation);
		await queryRunner.commitTransaction();
		res.status(201).json(saved);
	} catch (error) {
		await queryRunner.rollbackTransaction();
		res.status(500).json({ message: "Failed to create reservation." });
	} finally {
		await queryRunner.release();
	}
};

export const createPurchase = async (req: Request, res: Response): Promise<void> => {
	await ensureDataSource();
	await releaseExpiredReservations();
	const userId = Number(req.body?.userId);
	const concertId = Number(req.body?.concertId);

	if (!Number.isFinite(userId) || !Number.isFinite(concertId)) {
		res.status(400).json({ message: "userId and concertId are required." });
		return;
	}

	const now = new Date();
	const queryRunner = AppDataSource.createQueryRunner();

	await queryRunner.connect();
	await queryRunner.startTransaction();
	try {
		const userRepo = queryRunner.manager.getRepository(User);
		const ticketRepo = queryRunner.manager.getRepository(Ticket);
		const existingPurchase = await userRepo.findOne({
			where: { userId, reservedConcertId: concertId, status: "COMPLETET" }
		});

		if (existingPurchase) {
			await queryRunner.rollbackTransaction();
			res.status(409).json({ message: "Purchase already completed." });
			return;
		}
		const reservation = await userRepo.findOne({
			where: {
				userId,
				reservedConcertId: concertId,
				status: "PENDING",
				reservationExpiresAt: MoreThan(now)
			}
		});

		if (reservation) {
			reservation.status = "COMPLETET";
			reservation.reservationExpiresAt = null;

			const saved = await userRepo.save(reservation);
			await queryRunner.commitTransaction();
			res.status(201).json(saved);
			return;
		}

		const decrementResult = await ticketRepo
			.createQueryBuilder()
			.update(Ticket)
			.set({ stock: () => '"stock" - 1' })
			.where("concertId = :concertId", { concertId })
			.andWhere("stock > 0")
			.execute();

		if (!decrementResult.affected) {
			const exists = await ticketRepo.exists({ where: { concertId } });
			await queryRunner.rollbackTransaction();
			res.status(exists ? 409 : 404).json({
				message: exists ? "Concert is sold out." : "Concert not found."
			});
			return;
		}

		const concert = await ticketRepo.findOne({ where: { concertId } });
		if (!concert) {
			await queryRunner.rollbackTransaction();
			res.status(404).json({ message: "Concert not found." });
			return;
		}

		const purchase = userRepo.create({
			userId,
			reservedConcertId: concertId,
			ticket: concert,
			status: "COMPLETET",
			isReserved: true,
			reservationExpiresAt: null
		});

		const saved = await userRepo.save(purchase);
		await queryRunner.commitTransaction();
		res.status(201).json(saved);
	} catch (error) {
		await queryRunner.rollbackTransaction();
		res.status(500).json({ message: "Failed to create purchase." });
	} finally {
		await queryRunner.release();
	}
};
