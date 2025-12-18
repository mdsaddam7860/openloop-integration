import "dotenv/config";
// import dotenv from "dotenv";
// dotenv.config();
import { app } from "./app.js";
import { logger, syncToHubspot } from "./index.js";
import { hubspotClient } from "./configs/hubspot.config.js";

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
syncToHubspot();

async function AsyncInit() {
  try {
    await hubspotClient;
  } catch (error) {
    logger.error("Server initialization failed:", error);
  }
}
