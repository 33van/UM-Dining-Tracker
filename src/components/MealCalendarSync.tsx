import { useEffect, useRef } from "react";

import { AppState } from "react-native";

import { useOnboarding } from "../context/OnboardingContext";
import {
  ensureFreshSession,
  loadUpcomingFreeBlocks,
} from "../services/googleCalendar";
import { msUntilNextCalendarPull } from "../utils/mealRefresh";

/**
 * While the calendar is connected, refresh free time 30 minutes
 * before each meal. If the app returns to the foreground inside
 * that window, the refresh runs then.
 */
export function MealCalendarSync() {
  const {
    profile,
    calendarSession,
    lastCalendarPullAt,
    saveFreeTimeBlocks,
    updateCalendarSession,
    noteCalendarPull,
  } = useOnboarding();

  const sessionRef = useRef(calendarSession);
  sessionRef.current = calendarSession;

  const lastPullRef = useRef(lastCalendarPullAt);
  lastPullRef.current = lastCalendarPullAt;

  const calendarConnected =
    profile.googleCalendarConnected === true && calendarSession != null;

  useEffect(() => {
    if (!calendarConnected) {
      return;
    }

    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let failures = 0;

    function schedule(delay: number) {
      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(() => {
        void run();
      }, delay);
    }

    async function run() {
      if (cancelled) {
        return;
      }

      if (timeout) {
        clearTimeout(timeout);
        timeout = undefined;
      }

      const wait = msUntilNextCalendarPull(
        new Date(),
        lastPullRef.current
      );

      if (wait > 0) {
        schedule(wait);
        return;
      }

      const session = sessionRef.current;

      if (!session) {
        return;
      }

      try {
        const fresh = await ensureFreshSession(session);

        if (cancelled) {
          return;
        }

        if (fresh.accessToken !== session.accessToken) {
          updateCalendarSession(fresh);
          sessionRef.current = fresh;
        }

        const blocks = await loadUpcomingFreeBlocks(fresh.accessToken);

        if (cancelled) {
          return;
        }

        failures = 0;
        saveFreeTimeBlocks(blocks);
      } catch {
        if (cancelled) {
          return;
        }

        failures += 1;

        if (failures < 3) {
          schedule(60_000);
          return;
        }

        noteCalendarPull(Date.now());
      }
    }

    void run();

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        void run();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [
    calendarConnected,
    lastCalendarPullAt,
    noteCalendarPull,
    saveFreeTimeBlocks,
    updateCalendarSession,
  ]);

  return null;
}
