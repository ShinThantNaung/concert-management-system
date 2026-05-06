import {
  getConcerts,
  getConcertByName,
  getConcertById,
  createReservation,
  createReservationByP,
  createPurchase,
} from "./services.ts";
import { Router } from "express";
import { asyncWrap } from "./middleware/asyncWrap.ts";
import { validate } from "./middleware/validate.ts";
import { createPurchaseSchema, createReservationSchema } from "./schema.ts";
import { reserveLimiter } from "./rateLimiter.ts";

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReservationRequest:
 *       type: object
 *       required:
 *         - userId
 *         - concertId
 *       properties:
 *         userId:
 *           type: integer
 *         concertId:
 *           type: integer
 *         quantity:
 *           type: integer
 *           default: 1
 *     ReservationResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: integer
 *         concertId:
 *           type: integer
 *         status:
 *           type: string
 *           enum:
 *             - PENDING
 *             - COMPLETED
 *         isReserved:
 *           type: boolean
 *         quantity:
 *           type: integer
 *         reservationExpiresAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *         message:
 *           type: string
 */

router.get("/concerts", asyncWrap(getConcerts));
router.get("/concerts/:id", asyncWrap(getConcertById));
router.get("/concerts/name/:name", asyncWrap(getConcertByName));
/**
 * @swagger
 * /api/reserve:
 *   post:
 *     summary: Create a reservation (optimistic lock)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       200:
 *         description: Reservation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       409:
 *         description: Reservation conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reserve",
  reserveLimiter,
  validate(createReservationSchema),
  asyncWrap(createReservation),
);
/**
 * @swagger
 * /api/reserve-p:
 *   post:
 *     summary: Create a reservation (pessimistic lock)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       200:
 *         description: Reservation created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       409:
 *         description: Reservation conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/reserve-p",
  reserveLimiter,
  validate(createReservationSchema),
  asyncWrap(createReservationByP),
);
router.post(
  "/purchase",
  reserveLimiter,
  validate(createPurchaseSchema),
  asyncWrap(createPurchase),
);

export { router };
