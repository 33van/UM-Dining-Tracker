import type { FreeTimeBlock } from "../types/UserProfile";

export const MIN_FREE_BLOCK_MS = 60 * 60 * 1000;

type BusyInterval = {
  start: string;
  end: string;
};

/**
 * Invert busy intervals into free blocks inside the window.
 * Blocks shorter than one hour are left out entirely.
 */
export function freeBlocksFromBusy(
  windowStart: Date,
  windowEnd: Date,
  busy: BusyInterval[]
): FreeTimeBlock[] {
  const startMs = windowStart.getTime();
  const endMs = windowEnd.getTime();

  if (endMs - startMs < MIN_FREE_BLOCK_MS) {
    return [];
  }

  const clipped = busy
    .map((block) => ({
      start: Math.max(new Date(block.start).getTime(), startMs),
      end: Math.min(new Date(block.end).getTime(), endMs),
    }))
    .filter(
      (block) =>
        Number.isFinite(block.start) &&
        Number.isFinite(block.end) &&
        block.end > block.start
    )
    .sort((a, b) => a.start - b.start);

  const merged: { start: number; end: number }[] = [];

  for (const block of clipped) {
    const last = merged[merged.length - 1];

    if (!last || block.start > last.end) {
      merged.push({ ...block });
      continue;
    }

    last.end = Math.max(last.end, block.end);
  }

  const free: FreeTimeBlock[] = [];
  let cursor = startMs;

  for (const block of merged) {
    if (block.start - cursor >= MIN_FREE_BLOCK_MS) {
      free.push({
        start: new Date(cursor).toISOString(),
        end: new Date(block.start).toISOString(),
      });
    }

    cursor = Math.max(cursor, block.end);
  }

  if (endMs - cursor >= MIN_FREE_BLOCK_MS) {
    free.push({
      start: new Date(cursor).toISOString(),
      end: new Date(endMs).toISOString(),
    });
  }

  return free;
}

export function localTimeOnDate(
  date: Date,
  time: string
): Date {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  const result = new Date(date);

  result.setHours(
    hours,
    minutes,
    0,
    0
  );

  return result;
}

export function endOfLocalDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(24, 0, 0, 0);
  return end;
}
