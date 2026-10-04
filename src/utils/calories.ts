import type { Gender } from "../types/UserProfile";

const POUNDS_PER_KILOGRAM = 0.45359237;
const CENTIMETERS_PER_INCH = 2.54;

type CalorieInput = {
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  age?: number;
  gender?: Gender;
};

/**
 * Mifflin-St Jeor basal metabolic rate, in calories per day.
 * Non-binary and "Prefer not to say" use the average of the
 * woman and man results.
 */
export function recommendedDailyCalories(
  profile: CalorieInput
): number | null {
  const {
    heightFeet,
    heightInches,
    weightLbs,
    age,
    gender,
  } = profile;

  if (
    heightFeet == null ||
    heightInches == null ||
    weightLbs == null ||
    age == null ||
    gender == null ||
    heightFeet <= 0 ||
    weightLbs <= 0 ||
    age <= 0
  ) {
    return null;
  }

  const heightCm =
    (heightFeet * 12 + heightInches) * CENTIMETERS_PER_INCH;
  const weightKg = weightLbs * POUNDS_PER_KILOGRAM;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;

  const woman = base - 161;
  const man = base + 5;

  if (gender === "Woman") {
    return Math.round(woman);
  }

  if (gender === "Man") {
    return Math.round(man);
  }

  return Math.round((woman + man) / 2);
}

export function formatCalories(calories: number): string {
  return calories.toLocaleString("en-US");
}
