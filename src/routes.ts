import {getConcerts, getConcertByName, getConcertById, createReservation, createPurchase} from "./services.ts";
import { Router } from "express";
import { asyncWrap } from "./middleware/asyncWrap.ts";
import { validate } from "./middleware/validate.ts";
import { createPurchaseSchema, createReservationSchema } from "./schema.ts";
import { reserveLimiter } from "./rateLimiter.ts";

const router = Router();

router.get("/concerts", asyncWrap(getConcerts));
router.get("/concerts/:id", asyncWrap(getConcertById));
router.get("/concerts/name/:name", asyncWrap(getConcertByName));
router.post("/reserve", validate(createReservationSchema), asyncWrap(createReservation), reserveLimiter);
router.post("/purchase", validate(createPurchaseSchema), asyncWrap(createPurchase), reserveLimiter);

export { router };