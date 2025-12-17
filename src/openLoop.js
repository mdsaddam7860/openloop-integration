import "dotenv/config";
// import dotenv from "dotenv";
// dotenv.config();
import { app } from "./app.js";
import { syncToHubspot, logger } from "./index.js";
import { getHubspotClient, hubspotClient } from "./configs/hubspot.config.js";

async function serverInit() {
  try {
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, async () => {
      logger.info(`Server running on PORT:${PORT}`);
    });

    AsyncInit();
  } catch (error) {
    logger.error("Server initialization failed:", error);
  }
}

serverInit();
// syncToHubspot();

async function AsyncInit() {
  try {
    await hubspotClient;
  } catch (error) {
    logger.error("Server initialization failed:", error);
  }
}
