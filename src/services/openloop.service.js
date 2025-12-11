import { logger } from "../index.js";

import axios from "axios";

async function getFormAnswerGroup(formAnswerGroupId) {
  try {
    if (!formAnswerGroupId) {
      logger.error("formAnswerGroupId missing");
      //   throw new Error("formAnswerGroupId is required");
      return {};
    }

    const body = {
      query: `
        query GetFormAnswerGroup($id: ID!) {
          formAnswerGroup(id: $id) {
            id
            name
            user_id
            locked_at
            created_at
            form_answers {
              label
              displayed_answer
              answer
            }
          }
        }
      `,
      variables: {
        id: formAnswerGroupId,
      },
    };

    logger.info("Sending Healthie GraphQL request", {
      endpoint: process.env.HEALTHIE_GRAPHQL_URL,
      payloadKeys: Object.keys(body),
    });

    const response = await axios.post(
      process.env.HEALTHIE_GRAPHQL_URL || "https://api.gethealthie.com/graphql",
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        timeout: 10000,
      }
    );

    // if (response.data.errors) {
    //   logger.error("Healthie GraphQL errors", {
    //     errors: response.data.errors,
    //     formAnswerGroupId,
    //   });

    //   logger.error(
    //     `Healthie GraphQL error: ${JSON.stringify(response.data.errors)}`
    //   );
    // }

    // logger.info("Healthie FormAnswerGroup fetched successfully", {
    //   formAnswerGroupId,
    // });

    return response.data.data.formAnswerGroup;
  } catch (error) {
    logger.error("Failed to fetch Healthie FormAnswerGroup", {
      message: error.message,
      status: error.response?.status,
      responseData: error.response?.data,
      formAnswerGroupId,
    });
    return {};
    // throw error;
  }
}

export { getFormAnswerGroup };

// You’ll do this:
// await executeWithRetryAndThrottle(() => apiCall(), options);

// ✅ Usage Example (Your Healthie Call)
// import { executeWithRetryAndThrottle } from "./executeWithRetryAndThrottle.js";
// import { getFormAnswerGroup } from "./getFormAnswerGroup.js";

/*
const result = await executeWithRetryAndThrottle(
  () =>
    getFormAnswerGroup({
      token,
      formAnswerGroupId: 5606559,
    }),
  {
    retries: 4,
    context: {
      service: "healthie",
      operation: "GetFormAnswerGroup",
      formAnswerGroupId: 5606559,
    },
  }
);

*/
