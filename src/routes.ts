import {getConcerts, getConcertByName, getConcertById,createReservation, createPurchase} from "./services.js"
import { Router } from "express";

const router = Router();

router.get("/concerts", getConcerts);
router.get("/concerts/:id", getConcertById);
router.get("/concerts/name/:name", getConcertByName);
router.post("/reserve", createReservation);
router.post("/purchase", createPurchase);

export { router };