export function getNextTriggerTimestamp(timeStr: string, repeatDays: number[]): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();

  if (repeatDays.length === 0) {
    const candidate = new Date(now);
    candidate.setHours(hours, minutes, 0, 0);
    if (candidate <= now) {
      candidate.setDate(candidate.getDate() + 1);
    }
    return candidate.getTime();
  }

  for (let daysAhead = 0; daysAhead < 8; daysAhead++) {
    const candidate = new Date(now);
    candidate.setDate(candidate.getDate() + daysAhead);
    candidate.setHours(hours, minutes, 0, 0);
    if (repeatDays.includes(candidate.getDay()) && candidate > now) {
      return candidate.getTime();
    }
  }

  // fallback: 24h from now
  return now.getTime() + 24 * 60 * 60 * 1000;
}
