import {
  CALENDAR_REFRESH_LEAD_MS,
  MEALS,
} from "../constants/meals";

function mealStartOn(day: Date, hour: number, minute: number): number {
  const start = new Date(day);
  start.setHours(hour, minute, 0, 0);
  return start.getTime();
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/**
 * Milliseconds until the next calendar pull.
 * A pull is due 30 minutes before each meal. If that moment has
 * already passed and the meal has not started, the pull is due now
 * unless one already happened for that meal.
 */
export function msUntilNextCalendarPull(
  now: Date,
  lastPullAt: number | null
): number {
  const refreshTimes: number[] = [];

  for (const day of [now, addDays(now, 1), addDays(now, 2)]) {
    for (const meal of MEALS) {
      refreshTimes.push(
        mealStartOn(day, meal.hour, meal.minute) -
          CALENDAR_REFRESH_LEAD_MS
      );
    }
  }

  refreshTimes.sort((a, b) => a - b);
  const nowMs = now.getTime();

  for (const refreshAt of refreshTimes) {
    const mealStart = refreshAt + CALENDAR_REFRESH_LEAD_MS;

    if (nowMs < refreshAt) {
      return refreshAt - nowMs;
    }

    if (nowMs < mealStart) {
      if (lastPullAt == null || lastPullAt < refreshAt) {
        return 0;
      }
    }
  }

  return 60 * 1000;
}
