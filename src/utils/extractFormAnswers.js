import { coerceValue, parseHtmlAnswer, normalizeKey } from "../index.js";

function extractFormAnswers(formAnswerGroup) {
  const output = {};

  for (const item of formAnswerGroup.form_answers ?? []) {
    const key = normalizeKey(item.label);
    const rawAnswer = item.answer;

    // HTML block (Patient Intake style)
    if (typeof rawAnswer === "string" && rawAnswer.includes("<")) {
      const parsed = parseHtmlAnswer(rawAnswer);

      for (const [k, v] of Object.entries(parsed)) {
        output[k] = Array.isArray(v) ? v : coerceValue(v);
      }
      continue;
    }

    // Plain answers
    output[key] = coerceValue(rawAnswer);
  }

  return output;
}

export { extractFormAnswers };
