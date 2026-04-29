import "reflect-metadata";

process.env.DB_PATH = ":memory:";
process.env.DB_LOGGING = "false";

process.on("uncaughtException", (error) => {
	console.error("Uncaught exception in tests:", error);
});
