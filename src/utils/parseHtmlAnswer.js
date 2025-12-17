import { JSDOM } from "jsdom";
import { normalizeKey } from "./normalizeKey.js";

function parseHtmlAnswer(html) {
  if (!html || typeof html !== "string" || !html.includes("<")) {
    return {};
  }

  const dom = new JSDOM(html);
  const document = dom.window.document;

  const result = {};

  document.querySelectorAll("div").forEach((div) => {
    const labelEl = div.querySelector("b");
    if (!labelEl) return;

    const key = normalizeKey(labelEl.textContent);
    let value = null;

    const p = div.querySelector("p");
    if (p) {
      value = p.textContent.trim() || null;
    } else {
      const lis = div.querySelectorAll("ul li");
      if (lis.length) {
        value = Array.from(lis).map((li) => li.textContent.trim());
      }
    }

    result[key] = value;
  });

  return result;
}

export { parseHtmlAnswer };
