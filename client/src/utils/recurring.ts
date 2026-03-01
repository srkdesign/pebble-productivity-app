const patternToUnit: Record<string, string> = {
  daily: "day",
  weekly: "week",
  monthly: "month",
  yearly: "year",
};

export default function formatRecurring(pattern: string, interval?: number) {
  const unit = patternToUnit[pattern] ?? pattern;

  if (interval && interval > 1) return `every ${interval} ${unit}s`;
  if (interval === 1) return `every ${unit}`;

  return `${pattern}`; // fallback for no interval
}
