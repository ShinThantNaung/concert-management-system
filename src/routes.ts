import {
  getConcerts,
  getConcertByName,
  getConcertById,
  createReservation,
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

/**
 * @swagger
 * /api/concerts:
 *   get:
 *     summary: List all concerts
 *     responses:
 *       200:
 *         description: List of concerts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   concertId:
 *                     type: integer
 *                   concertName:
 *                     type: string
 *                   stock:
 *                     type: integer
 */
router.get("/concerts", asyncWrap(getConcerts));
/**
 * @swagger
 * /api/concerts/{id}:
 *   get:
 *     summary: Get a concert by id
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Concert details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 concertId:
 *                   type: integer
 *                 concertName:
 *                   type: string
 *                 stock:
 *                   type: integer
 *       404:
 *         description: Concert not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get("/concerts/:id", asyncWrap(getConcertById));
/**
 * @swagger
 * /api/concerts/name/{name}:
 *   get:
 *     summary: Get a concert by name
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Concert details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 concertId:
 *                   type: integer
 *                 concertName:
 *                   type: string
 *                 stock:
 *                   type: integer
 *       404:
 *         description: Concert not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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
 * /api/purchase:
 *   post:
 *     summary: Purchase a reserved ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReservationRequest'
 *     responses:
 *       200:
 *         description: Purchase completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReservationResponse'
 *       409:
 *         description: Purchase conflict
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  "/purchase",
  reserveLimiter,
  validate(createPurchaseSchema),
  asyncWrap(createPurchase),
);

export { router };
