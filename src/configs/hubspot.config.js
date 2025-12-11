import { createClient } from "@mohammadsaddam-dev/hubspot-toolkit";
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://api.hubapi.com/",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
  },
});

const hubspotClient = createClient({
  apiKey: process.env.HUBSPOT_API_KEY, // or ACCESS TOKEN
  accessToken: process.env.HUBSPOT_ACCESS_TOKEN,
});

// export { hubspotClient };

export { axiosInstance, hubspotClient };
