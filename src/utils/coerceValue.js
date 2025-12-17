function coerceValue(value) {
  if (value === null) return null;

  if (typeof value === "string") {
    if (/^(yes|no)$/i.test(value)) {
      return value.toLowerCase() === "yes";
    }

    if (!isNaN(value) && value.trim() !== "") {
      return Number(value);
    }
  }

  return value;
}

export { coerceValue };
