import dotenv from "dotenv";
dotenv.config();
// import { createClient } from "@mohammadsaddam-dev/hubspot-toolkit";
import axios from "axios";
import { logger } from "../utils/winston.logger.js";

const axiosInstance = axios.create({
  baseURL: "https://api.hubapi.com/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
  },
});

let hubspotClient = null;

// hubspotClient = createClient({
//   apiKey: process.env.HUBSPOT_API_KEY, // or ACCESS TOKEN
//   accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
// });

async function InitializeClient() {
  if (hubspotClient) {
    return hubspotClient;
  }

  if (!process.env.HUBSPOT_ACCESS_TOKEN && !process.env.HUBSPOT_API_KEY) {
    logger.warn(`HUBSPOT_ACCESS_TOKEN or HUBSPOT_API_KEY is required`);
    return;
  }

  hubspotClient = createClient({
    apiKey: process.env.HUBSPOT_API_KEY,
    accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
  });
  logger.info("Hubspot client initialized");
  return hubspotClient;
}

async function getHubspotClient() {
  if (!hubspotClient) {
    hubspotClient = InitializeClient();
  }

  let client = await hubspotClient;
  return client;
}
// const InitializeClient = createClient({
//   apiKey: process.env.HUBSPOT_API_KEY, // or ACCESS TOKEN
//   accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
// });

export { axiosInstance, hubspotClient, getHubspotClient };
