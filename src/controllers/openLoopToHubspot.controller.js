import {
  logger,
  getFormAnswerGroup,
  extractFormAnswers,
  hubspotmapper,
  getHubspotClient,
  createHubspotContact,
} from "../index.js";

async function syncToHubspot() {
  if (process.env.NODE_ENV !== "development") return;

  try {
    const fromAnswer = await getFormAnswerGroup(56815705);
    // logger.info(`fromAnswer: ${JSON.stringify(fromAnswer)}`);

    let normalized = extractFormAnswers(fromAnswer);
    // logger.info(`Normalized : ${JSON.stringify(normalized)}`);
    console.log("Normalized Answers :", normalized);

    normalized = hubspotmapper(normalized, 56815705);

    console.log("Normalized Mapping :", normalized);

    const client = await getHubspotClient();

    // const contact = await client.contacts.getAllContacts(); // [info] 17/12/2025, 1:35:39 pm - Contacts: 2933

    // logger.info(`Contacts: ${JSON.stringify(contact.length)}`);

    // Sync as a hubspot contact

    // const contact = await client.contacts.createContact({
    //   email: normalized.email,
    //   firstname: normalized.first_name,
    //   firstname: normalized.last_name,
    // });

    // const contact = await createHubspotContact(normalized);

    try {
      const contact = await client.contacts.upsertContactByEmail(
        normalized.email,
        normalized
      );
      logger.info(`Contact created: ${JSON.stringify(contact, null, 2)}`);
    } catch (error) {
      logger.error("Hubspot Contact sync failed:", error);
    }
  } catch (error) {
    logger.error("Hubspot sync failed:", error);
  }
}

export default syncToHubspot;
