export type Meal = {
  id: "breakfast" | "lunch" | "dinner";
  hour: number;
  minute: number;
};

/**
 * Local start time of each meal. Calendar availability is refreshed
 * 30 minutes before each of these times.
 */
export const MEALS: Meal[] = [
  { id: "breakfast", hour: 7, minute: 0 }, //CHANGE THeSE BASED ON USER's PREFERENCE
  { id: "lunch", hour: 11, minute: 0 },
  { id: "dinner", hour: 17, minute: 0 },
];

export const CALENDAR_REFRESH_LEAD_MS = 30 * 60 * 1000;
