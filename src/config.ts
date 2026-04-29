import path from "path";
import dotenv from "dotenv";
import { DataSource, type DataSourceOptions } from "typeorm";

dotenv.config();

const rootDir = process.cwd();

export const appConfig = {
	port: Number(process.env.PORT ?? 3000),
	dbPath: process.env.DB_PATH ?? "database.sqlite",
	dbLogging: process.env.DB_LOGGING === "true"
};

export const dataSourceOptions: DataSourceOptions = {
	type: "sqlite",
	database: appConfig.dbPath,
	synchronize: false,
	logging: appConfig.dbLogging,
	entities: [path.join(rootDir, "src/entity/*.{ts,js}")],
	migrations: [path.join(rootDir, "src/migration/*.{ts,js}")]
};

export const AppDataSource = new DataSource(dataSourceOptions);
