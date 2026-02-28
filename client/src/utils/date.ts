// Convert a UNIX timestamp (seconds) or ISO string to JS Date
export function toDate(input: number | string | undefined): Date | null {
  if (!input) return null;

  if (typeof input === "number") {
    // Backend sends timestamp in seconds
    return new Date(input * 1000);
  }

  // If input is already a string (ISO), parse it
  const parsed = new Date(input);

  if (isNaN(parsed.getTime())) return null;

  return parsed;
}
