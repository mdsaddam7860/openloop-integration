/*
Use when:
You want strict data integrity
Empty strings are allowed
Minimal cleaning
No nested cleanup needed

*/
function cleanProps(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== undefined && value !== null
    )
  );
}

/*
Use when:
API rejects empty strings
You store user input
Cleaner JSON required
*/
function cleanPropsExtended(obj = {}) {
  return Object.fromEntries(
    Object.entries(obj).filter(
      ([_, value]) => value !== undefined && value !== null && value !== ""
    )
  );
}

/*
Use when:
You sanitize user data deeply
Large nested forms
Big JSON API payloads
ElasticSearch / MongoDB
Removes nested nulls, empty arrays, empty objects.
*/
function cleanPropsDeep(obj = {}) {
  if (Array.isArray(obj)) {
    return obj
      .map(cleanProps)
      .filter(
        (v) =>
          v !== undefined &&
          v !== null &&
          v !== "" &&
          JSON.stringify(v) !== "{}"
      );
  }

  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj)
        .map(([k, v]) => [k, cleanProps(v)])
        .filter(
          ([_, v]) =>
            v !== undefined &&
            v !== null &&
            v !== "" &&
            (typeof v !== "object" || JSON.stringify(v) !== "{}")
        )
    );
  }

  return obj;
}
function mapArrayToFlatString(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  return arr.filter(Boolean).map(String).join(",");
}
function hubspotmapper(data, resourceId) {
  const buildRequest = {
    sourceid: resourceId,
    firstname: data.first_name,
    lastname: data.last_name,
    email: data.email,
    what_is_your_weight_in_pounds_: data.weight,
    height: data.height,
    gender: data.gender,
    date_of_birth: data.date_of_birth,
    bmi: data.bmi,
    state: data.state,
    // phone: data.phone,
    eligible_for_medical_weight_loss: data.basic_mwl_eligibility,
    full_name: data.shipping_name,

    top_wellness_goal_: data.sync_visit_reason, // Enum field
    picture_of_your_current_glp1_medication_pen_or_vial: data.product_image,

    more_about_your_health_: mapArrayToFlatString(
      data.medical_lifestyle_factors
    ),

    do_these_apply_to_you: mapArrayToFlatString(
      data.other_exclusion_conditions
    ),
    symptoms_: mapArrayToFlatString(data.medical_exclusion_criteria),
    choose_your_treatment_plan_: data.product_name,

    // TODO: Update didnt work throwing 400
    // jc_incoming_sms_count: data.consent_tc, // throwing 400
    //formulation_options_ : data.product_id
    // TODO: Update didnt work throwing 400

    // throwing 400
    // formulation_options: data.product_id, // recommended_products

    // Did not find any match
    // age: data.age,
    // sync_visit: data.sync_visit,
    // prior_weight_loss_meds_use: data.prior_weight_loss_meds_use,
    // weight_related_comorbidity: data.weight_related_comorbidity,

    // price_id: data.price_id, // recommended_products
    // price: data.price,
    // price_currency: data.price_currency,
    // payment_completed: data.payment_completed,
    // height_feet: data.height_feet,
    // comorbidity_required: data.comorbidity_required,
    // consent: data.consent,
    // stripe_subscription_id: data.stripe_subscription_id,

    // choose_your_treatment_plan: data.product_name, // throwing error // TODO remove
    /* Hubspot Contact sync failed1: Property values were not valid: [{"isValid":false,"message":"Weekly Dual Power Personalized Tirzepatide (GLP-1/GIP) Injection was not one of the allowed options: [Weekly Dual Power (GLP-1 / GIP Injection - Tirzepatide), Zepbound (Tirzepatide), Daily Reset (GLP-1 Oral - Semaglutide), Daily Dual Power (GLP-1 / GIP Oral - Tirzepatide), Ozempic (Semaglutide), Weekly Reset - (GLP-1 Injection - Semaglutide)]","error":"INVALID_OPTION","name":"choose_your_treatment_plan"}] */
  };

  //starting_weight_in_pounds

  const cleanBuildRequest = cleanProps(buildRequest);

  return cleanBuildRequest;

  /*

height: data.height_feet

more_about_your_health_: data.medical_lifestyle_factors
 */
}

export { hubspotmapper, cleanProps, cleanPropsExtended, cleanPropsDeep };

/*

| HubSpot Property                                                    | Internal Field               | Notes                                                                      |
| ------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------- |
| `height`                                                            | `height_inches`              | If height is total inches → direct. If in feet → convert. If cm → convert. |
| `eligible_for_medical_weight_loss`                                  | `basic_mwl_eligibility`      | Both describe MWL eligibility status.                                      |
| `symptoms`                                                          | `medical_exclusion_criteria` | Both relate to medical condition disclosures.                              |
| `do_any_of_the_following_apply_to_you`                              | `other_exclusion_conditions` | Same purpose.                                                              |
| `more_about_your_health`                                            | `medical_lifestyle_factors`  | Same semantic area.                                                        |
| `starting_weight_in_pounds`                                         | `prior_weight_loss_meds_use` | ❗ Not a clean match — you may need another field.                          |
| `choose_your_treatment_plan`                                        | `product_name`               | User-selected plan corresponds to product.                                 |
| `formulation_options`                                               | `product_id`                 | If formulation variant maps to product variations.                         |
| `recommended_products`                                              | `price_id`                   | If selecting recommended product drives pricing.                           |
| `associatedcompanylastupdated`                                      | `sync_visit`                 | System last-updated time ≠ sync visit — weak link.                         |
| `full_name`                                                         | `shipping_name`              | If you ship under the same name.                                           |
| `picture_of_your_current_glp1_medication_pen_or_vial`               | `product_image`              | Medication image may serve as product image.                               |
| `jc_has_responded`                                                  | `sync_visit_reason`          | Weak match — not equal fields.                                             |
| `jc_call_status_rc`                                                 | `comorbidity_required`       | ❌ completely unrelated.                                                    |
| `are_you_currently_taking_or_have_recently_taken_a_glp1_medication` | `weight_related_comorbidity` | This is about medication, not comorbidity → incorrect.                     |
| `wellness_goals`                                                    | `sync_visit_reason`          | Better than above, still loose.                                            |
| `top_wellness_goal`                                                 | `sync_visit_reason`          | Better semantic match.                                                     |
| `tags`                                                              | `consent`                    | ❌ unrelated — don’t map.                                                   |
| `nimbus_status`                                                     | `payment_completed`          | ❌ do not map unless confirmed.                                             |
| `total_minutes`                                                     | `total_inbound_minutes`      | internal stats → not product fields.                                       |
| `address_line_2`                                                    | `shipping_name`              | ❌ do not map — wrong dimension                                             |


*/
