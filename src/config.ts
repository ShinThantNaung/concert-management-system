import path from "path";
import dotenv from "dotenv";
import { DataSource, type DataSourceOptions } from "typeorm";
import { Ticket } from "./entity/Ticket.ts";
import { User } from "./entity/User.ts";
import { createClient } from "redis";

dotenv.config();

const rootDir = process.cwd();
const isTestEnvironment = Boolean(
  process.env.VITEST || process.env.NODE_ENV === "test",
);

export const appConfig = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? "database.sqlite",
  dbLogging: process.env.DB_LOGGING === "true",
};

export const dataSourceOptions: DataSourceOptions = {
  type: "sqlite",
  database: appConfig.dbPath,
  synchronize: false,
  logging: appConfig.dbLogging,
  entities: [Ticket, User],
  migrations: isTestEnvironment
    ? []
    : [path.join(rootDir, "src/migration/*.{ts,js}")],
};

export const AppDataSource = new DataSource(dataSourceOptions);

