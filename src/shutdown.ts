type ShutdownDeps = {
  server: any;
  dataSource: any;
  redisClient?: any;
};

export function setupGracefulShutdown({
  server,
  dataSource,
  redisClient,
}: ShutdownDeps) {
  let activeRequests = 0;
  let isShuttingDown = false;

  // middleware to track requests
  const trackRequests = (req, res, next) => {
    if (isShuttingDown) {
      return res.status(503).json({ message: "Server shutting down" });
    }

    activeRequests++;
    res.on("finish", () => activeRequests--);
    next();
  };

  const waitForRequestsToFinish = async () => {
    while (activeRequests > 0) {
      console.log(`Waiting: ${activeRequests} active requests`);
      await new Promise((r) => setTimeout(r, 300));
    }
  };

  const shutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`${signal} received`);

    server.close();

    await waitForRequestsToFinish();

    await dataSource.destroy();
    if (redisClient) await redisClient.quit();

    console.log("Shutdown complete");
    process.exit(0);
  };

  ["SIGINT", "SIGTERM", "SIGBREAK"].forEach((s) => process.on(s, shutdown));

  return { trackRequests };
}
