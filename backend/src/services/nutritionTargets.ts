import type {
  UserProfile,
} from "../types/UserProfile.js";


export interface MacroTargets {
  calories: number;

  proteinG: number;
  carbsG: number;
  fatG: number;
}


/*
 * Calculates daily macro targets from the
 * user's profile.
 *
 * This is an estimate for Maize's planning
 * and demo functionality, not a medical
 * prescription.
 */
export function calculateMacroTargets(
  profile: UserProfile
): MacroTargets {
  const {
    weightLbs,
    heightFeet,
    heightInches,
    age,
    gender,
    healthConsiderations = [],
  } = profile;


  /*
   * ------------------------------------------------
   * 1. CALORIE TARGET
   * ------------------------------------------------
   *
   * Prefer the calorie goal already calculated
   * during onboarding.
   */
  const calories =
    profile.calorieGoal ??
    calculateCaloriesFromProfile(
      weightLbs,
      heightFeet,
      heightInches,
      age,
      gender
    );


  /*
   * ------------------------------------------------
   * 2. BASE MACRO DISTRIBUTION
   * ------------------------------------------------
   *
   * Start with:
   *
   * Protein: 25% calories
   * Carbs:   45% calories
   * Fat:     30% calories
   */
  let proteinPercent = 0.25;
  let carbPercent = 0.45;
  let fatPercent = 0.30;


  /*
   * ------------------------------------------------
   * 3. CONDITION-BASED ADJUSTMENTS
   * ------------------------------------------------
   */

  const conditions =
    healthConsiderations.map(
      (condition) =>
        condition
          .trim()
          .toLowerCase()
    );


  /*
   * Example:
   * Diabetes -> somewhat lower carbohydrate
   * allocation.
   */
  if (
    conditions.some(
      (condition) =>
        condition.includes(
          "diabetes"
        )
    )
  ) {
    carbPercent = 0.40;
    proteinPercent = 0.30;
    fatPercent = 0.30;
  }


  /*
   * Vitamin/mineral deficiencies should NOT
   * arbitrarily change macro grams.
   *
   * Those belong in food selection:
   *
   * Vitamin C deficiency
   * Vitamin A deficiency
   * Iron deficiency
   * Calcium deficiency
   *
   * Gemini can favor foods rich in those
   * nutrients separately.
   */


  /*
   * ------------------------------------------------
   * 4. CONVERT CALORIES -> GRAMS
   * ------------------------------------------------
   *
   * Protein = 4 kcal/g
   * Carbs   = 4 kcal/g
   * Fat     = 9 kcal/g
   */

  const proteinG =
    Math.round(
      (
        calories *
        proteinPercent
      ) /
        4
    );

  const carbsG =
    Math.round(
      (
        calories *
        carbPercent
      ) /
        4
    );

  const fatG =
    Math.round(
      (
        calories *
        fatPercent
      ) /
        9
    );


  return {
    calories,

    proteinG,
    carbsG,
    fatG,
  };
}


/*
 * Fallback calorie calculation if the profile
 * doesn't already contain calorieGoal.
 */
function calculateCaloriesFromProfile(
  weightLbs?: number,
  heightFeet?: number,
  heightInches?: number,
  age?: number,
  gender?: string
): number {
  if (
    typeof weightLbs !== "number" ||
    typeof heightFeet !== "number" ||
    typeof heightInches !== "number" ||
    typeof age !== "number"
  ) {
    return 2150;
  }


  const weightKg =
    weightLbs *
    0.453592;


  const heightCm =
    (
      heightFeet * 12 +
      heightInches
    ) *
    2.54;


  let bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * age;


  const normalizedGender =
    gender
      ?.trim()
      .toLowerCase();


  if (
    normalizedGender === "man" ||
    normalizedGender === "male"
  ) {
    bmr += 5;
  } else if (
    normalizedGender === "woman" ||
    normalizedGender === "female"
  ) {
    bmr -= 161;
  }


  /*
   * Current profile does not appear to contain
   * activity level, so use the same moderate
   * baseline as the calorie recommendation.
   */
  return Math.round(
    bmr * 1.55
  );
}