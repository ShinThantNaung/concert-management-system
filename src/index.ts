import express, { type Request, type Response } from "express";
import { router } from "./routes.ts";
import dotenv from "dotenv";

dotenv.config();

const port = process.env.PORT || 3000;

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", router);

app.get("/", (req: Request, res: Response) => {
    res.send("API service is healthy and running!");
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});