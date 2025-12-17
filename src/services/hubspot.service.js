import { logger, axiosInstance } from "../index.js";

/**
 * Create a HubSpot contact using a raw payload
 * @param {Object} payload - Contact properties (email, firstname, lastname, etc.)
 * @returns {Object|null} HubSpot contact response
 */
async function createHubspotContact(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid payload: expected an object");
  }

  //   const hubspotAxios = await getHubspotClient();

  try {
    const response = await axiosInstance.post("/crm/v3/objects/contacts", {
      properties: payload,
    });

    return response.data;
  } catch (error) {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.message || error.message || "Unknown error";

    logger.error("❌ Failed to create HubSpot contact", {
      status,
      message,
      payload,
    });

    throw error;
  }
}

export { createHubspotContact };
