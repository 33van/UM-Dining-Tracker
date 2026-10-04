import type {
  UserProfile,
} from "../types/UserProfile.js";

import {
  sendIMessage,
} from "./photon.js";


export interface DailyNutrition {
  caloriesConsumed: number;

  proteinG: number;
  carbsG: number;
  fatG: number;

  fiberG: number;
  sugarG: number;

  sodiumMg: number;
  cholesterolMg: number;

  calciumPercent: number;
  ironPercent: number;

  vitaminAPercent: number;
  vitaminCPercent: number;
}


export interface DailyNutrientTargets {
  proteinG: number;
  carbsG: number;
  fiberG: number;

  ironPercent: number;
  vitaminAPercent: number;
  vitaminCPercent: number;

  cholesterolMg: number;
  calciumPercent: number;

  sugarG: number;
  sodiumMg: number;

  totalFatG: number;
}


export async function sendMealReminder(
  profile: UserProfile,
  consumed: DailyNutrition,
  targets: DailyNutrientTargets,
  diningHall: string,
  meal: string
): Promise<void> {

  /*
   * ==========================================
   * REMAINING CALORIES
   * ==========================================
   */

  const calorieTarget =
    profile.calorieGoal ??
    2150;

  const caloriesRemaining =
    Math.max(
      calorieTarget -
        consumed.caloriesConsumed,
      0
    );


  /*
   * ==========================================
   * REMAINING NUTRIENTS
   * ==========================================
   */

  const proteinRemaining =
    Math.max(
      targets.proteinG -
        consumed.proteinG,
      0
    );

  const carbsRemaining =
    Math.max(
      targets.carbsG -
        consumed.carbsG,
      0
    );

  const fatRemaining =
    Math.max(
      targets.totalFatG -
        consumed.fatG,
      0
    );

  const fiberRemaining =
    Math.max(
      targets.fiberG -
        consumed.fiberG,
      0
    );

  const calciumRemaining =
    Math.max(
      targets.calciumPercent -
        consumed.calciumPercent,
      0
    );

  const ironRemaining =
    Math.max(
      targets.ironPercent -
        consumed.ironPercent,
      0
    );

  const vitaminARemaining =
    Math.max(
      targets.vitaminAPercent -
        consumed.vitaminAPercent,
      0
    );

  const vitaminCRemaining =
    Math.max(
      targets.vitaminCPercent -
        consumed.vitaminCPercent,
      0
    );


  /*
   * ==========================================
   * BUILD LIST OF WHAT USER STILL NEEDS
   * ==========================================
   */

  const needs: string[] = [];

  if (proteinRemaining > 0) {
    needs.push(
      `• ${Math.round(
        proteinRemaining
      )}g protein`
    );
  }

  if (carbsRemaining > 0) {
    needs.push(
      `• ${Math.round(
        carbsRemaining
      )}g carbohydrates`
    );
  }

  if (fatRemaining > 0) {
    needs.push(
      `• ${Math.round(
        fatRemaining
      )}g total fat`
    );
  }

  if (fiberRemaining > 0) {
    needs.push(
      `• ${Math.round(
        fiberRemaining
      )}g fiber`
    );
  }

  if (calciumRemaining > 0) {
    needs.push(
      `• ${Math.round(
        calciumRemaining
      )}% calcium`
    );
  }

  if (ironRemaining > 0) {
    needs.push(
      `• ${Math.round(
        ironRemaining
      )}% iron`
    );
  }

  if (vitaminARemaining > 0) {
    needs.push(
      `• ${Math.round(
        vitaminARemaining
      )}% Vitamin A`
    );
  }

  if (vitaminCRemaining > 0) {
    needs.push(
      `• ${Math.round(
        vitaminCRemaining
      )}% Vitamin C`
    );
  }


  /*
   * ==========================================
   * BUILD IMESSAGE
   * ==========================================
   */

  const message =
    `${meal} Reminder!\n\n` +

    `The closest dining hall to you is ${diningHall}.\n\n` +

    `You have ${Math.round(
      caloriesRemaining
    )} calories remaining today.\n\n` +

    `To reach your daily nutrient goals, you should eat:\n\n` +

    (
      needs.length > 0
        ? needs.join("\n")
        : "You've reached your tracked nutrient goals for today!"
    );


  /*
   * ==========================================
   * SEND THROUGH PHOTON
   * ==========================================
   */

  await sendIMessage(
    profile.phone,
    message
  );
}