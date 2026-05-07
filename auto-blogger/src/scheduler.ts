export function buildRandomDailySchedule(
  dailyArticles: number,
  windowStartMinutes: number,
  windowEndMinutes: number,
  minGapMinutes: number,
  maxGapMinutes: number
): number[] {
  const safeCount = Math.max(1, dailyArticles);
  const schedule: number[] = [];
  const initialJitter = Math.floor(Math.random() * 30);
  let current = windowStartMinutes + initialJitter;

  for (let i = 0; i < safeCount; i++) {
    if (current >= windowEndMinutes) break;
    schedule.push(current);
    const gap = minGapMinutes + Math.floor(Math.random() * (maxGapMinutes - minGapMinutes + 1));
    current += gap;
  }

  return schedule;
}

export function getMinutesInTimezone(tz: string, date: Date): number {
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: tz,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")!.value, 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")!.value, 10);
  return hour * 60 + minute;
}

export function minutesUntilSlot(slotMinutes: number, now: Date, timezone: string): number {
  return slotMinutes - getMinutesInTimezone(timezone, now);
}

export function msUntilNextWindowStart(windowStartMinutes: number, timezone: string): number {
  const now = new Date();

  // Get today's date in the target timezone
  const todayInTz = now.toLocaleDateString("en-CA", { timeZone: timezone });
  const [yr, mo, dy] = todayInTz.split("-").map(Number);

  // Estimate the TZ offset using noon UTC tomorrow (avoids DST midnight edge cases)
  const tomorrowNoonUTC = new Date(Date.UTC(yr, mo - 1, dy + 1, 12, 0, 0));
  const tomorrowNoonTzMinutes = getMinutesInTimezone(timezone, tomorrowNoonUTC);
  const offsetMinutes = tomorrowNoonTzMinutes - 12 * 60;

  // Tomorrow midnight in the TZ as a UTC timestamp
  const tomorrowMidnightUTC = Date.UTC(yr, mo - 1, dy + 1, 0, 0, 0) - offsetMinutes * 60 * 1000;
  const targetUTC = tomorrowMidnightUTC + windowStartMinutes * 60 * 1000;

  return Math.max(0, targetUTC - now.getTime());
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
