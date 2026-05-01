export function buildRandomDailySchedule(
  dailyArticles: number,
  minGapMinutes: number
): number[] {
  const minutesInDay = 24 * 60;
  const safeCount = Math.max(1, dailyArticles);
  const bucketSize = Math.floor(minutesInDay / safeCount);
  const schedule: number[] = [];

  for (let i = 0; i < safeCount; i++) {
    const bucketStart = i * bucketSize;
    const bucketEnd = i === safeCount - 1 ? minutesInDay - 1 : (i + 1) * bucketSize - 1;
    const spread = Math.max(1, bucketEnd - bucketStart);
    const jitter = Math.floor(Math.random() * spread);
    schedule.push(bucketStart + jitter);
  }

  schedule.sort((a, b) => a - b);

  for (let i = 1; i < schedule.length; i++) {
    if (schedule[i] - schedule[i - 1] < minGapMinutes) {
      schedule[i] = Math.min(minutesInDay - 1, schedule[i - 1] + minGapMinutes);
    }
  }

  return schedule;
}

export function minutesUntilSlot(slotMinutes: number, now: Date): number {
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return slotMinutes - currentMinutes;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
