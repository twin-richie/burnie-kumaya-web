export function parseDateOnly(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatDisplayDate(date: string | undefined, fallback = "—") {
  if (!date) return fallback;
  return parseDateOnly(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", timeZone: "UTC" });
}
