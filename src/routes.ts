import {getConcerts, getConcertByName, getConcertById, createReservation, createPurchase} from "./services.ts";
import { Router } from "express";
import { asyncWrap } from "./middleware/asyncWrap.ts";
import { validateReservation } from "./middleware/validateReservation.ts";

const router = Router();

router.get("/concerts", asyncWrap(getConcerts));
router.get("/concerts/:id", asyncWrap(getConcertById));
router.get("/concerts/name/:name", asyncWrap(getConcertByName));
router.post("/reserve", validateReservation, asyncWrap(createReservation));
router.post("/purchase", validateReservation, asyncWrap(createPurchase));

export { router };