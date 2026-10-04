import {
    GoogleGenAI,
} from "@google/genai";

import type {
    MenuItem,
} from "./dining.js";

/* ============================================ */
/* GEMINI                                       */
/* ============================================ */

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing from backend/.env"
  );
}

const ai =
  new GoogleGenAI({
    apiKey:
      GEMINI_API_KEY,
  });

const GEMINI_MODEL =
  process.env.GEMINI_MODEL ??
  "gemini-3.8-flash";

  /* ============================================ */
/* CONVERSATIONAL MAIZE COACH                   */
/* ============================================ */

export interface ConversationContext {
  userProfile: {
    calorieGoal?: number;

    allergies?: string[];

    foodPreferences?: string[];

    healthConsiderations?: string[];
  };

  caloriesConsumedToday?: number;

  nutritionConsumedToday?: {
    proteinG?: number;

    carbsG?: number;

    fiberG?: number;

    ironPercent?: number;

    vitaminAPercent?: number;

    vitaminCPercent?: number;

    sodiumMg?: number;

    sugarG?: number;
  };

  preferredDiningHall?: string;

  menuItems?: MenuItem[];
}

export async function answerUserMessage({
  message,
  context,
}: {
  message: string;

  context:
    ConversationContext;
}) {

  const safeMenu =
    context.menuItems
      ? context.menuItems.filter(
          (item) => {
            const allergies =
              context
                .userProfile
                .allergies ??
              [];

            return !hasAllergenConflict(
              item,
              allergies
            );
          }
        )
      : [];

  const systemInstruction = `
You are Maize, a friendly University of Michigan dining and nutrition assistant.

Speak naturally, like a helpful coach texting a student.

You help with:
- Michigan Dining meal suggestions
- calorie goals
- protein and carbohydrate goals
- iron, calcium, vitamins A and C
- sodium, sugar and cholesterol awareness
- dietary preferences
- dining hall choices
- lower-carbon food choices
- explaining the user's progress today

IMPORTANT RULES:

1. Never recommend a food that conflicts with the user's known allergies.
2. When Michigan Dining menu data is supplied, only claim an item is currently available if it appears in that menu data.
3. Prefer Carbon Footprint Low foods when they also fit the user's nutritional needs.
4. Carbon Footprint Medium foods are acceptable when they improve the nutritional fit.
5. Prefer High-carbon foods only when there is a meaningful nutritional reason and better low/medium choices are unavailable.
6. Never invent exact CO2 emissions. Michigan Dining only supplies Low, Medium, or High carbon categories.
7. Do not invent nutrition values.
8. Be concise enough to work naturally over iMessage.
9. If the user asks for a recommendation, give specific foods when current menu information is available.
10. If current menu information is unavailable, say so rather than pretending an item is currently being served.
11. Do not make diagnoses or claim to treat health conditions.
12. Remember the user's goals and what they have already eaten when that information is supplied.
`;

  const chat =
    ai.chats.create({
      model:
        GEMINI_MODEL,

      config: {
        systemInstruction,

        temperature:
          0.6,
      },
    });

  const contextMessage = `
CURRENT USER CONTEXT

Profile:
${JSON.stringify(
  context.userProfile,
  null,
  2
)}

Calories consumed today:
${context.caloriesConsumedToday ?? "unknown"}

Nutrition consumed today:
${JSON.stringify(
  context.nutritionConsumedToday ?? {},
  null,
  2
)}

Preferred dining hall:
${context.preferredDiningHall ?? "not specified"}

SAFE CURRENT MENU ITEMS:
${JSON.stringify(
  safeMenu.map(
    (item) => ({
      name:
        item.name,

      meal:
        item.meal,

      calories:
        item.calories,

      proteinG:
        item.proteinG,

      carbsG:
        item.carbsG,

      ironPercent:
        item.ironPercent,

      vitaminAPercent:
        item.vitaminAPercent,

      vitaminCPercent:
        item.vitaminCPercent,

      sodiumMg:
        item.sodiumMg,

      sugarG:
        item.sugarG,

      traits:
        item.traits,
    })
  ),
  null,
  2
)}

USER MESSAGE:
${message}
`;

  const response =
    await chat.sendMessage({
      message:
        contextMessage,
    });

  return (
    response.text ??
    "I couldn't generate a response."
  );
}

/* ============================================ */
/* TYPES                                        */
/* ============================================ */

export type MealSlot =
  | "breakfast"
  | "lunch"
  | "dinner";

export type CarbonLevel =
  | "low"
  | "medium"
  | "high"
  | "unknown";

export interface NutritionTargets {
  calories?: number;

  proteinG?: number;

  carbsG?: number;

  fiberG?: number;

  ironPercent?: number;

  calciumPercent?: number;

  vitaminAPercent?: number;

  vitaminCPercent?: number;

  maxSodiumMg?: number;

  maxSugarG?: number;

  maxCholesterolMg?: number;
}

export interface NutritionTotals {
  calories: number;

  proteinG: number;

  carbsG: number;

  fiberG: number;

  ironPercent: number;

  calciumPercent: number;

  vitaminAPercent: number;

  vitaminCPercent: number;

  sodiumMg: number;

  sugarG: number;

  cholesterolMg: number;
}

export interface CoachProfile {
  calorieGoal: number;

  allergies: string[];

  foodPreferences?: string[];

  healthConsiderations?: string[];

  nutritionTargets?: NutritionTargets;
}

export interface RecommendedItem {
  name: string;

  servings: number;

  reason: string;

  carbonLevel: CarbonLevel;

  nutrition: NutritionTotals;
}

export interface MealRecommendation {
  meal: MealSlot;

  hall: string;

  items: RecommendedItem[];

  totals: NutritionTotals;

  carbonLevel: CarbonLevel;

  reason: string;

  message: string;
}

interface GeminiChoice {
  items: {
    name: string;

    servings: number;

    reason: string;
  }[];

  reason: string;
}

/* ============================================ */
/* EMPTY NUTRITION                              */
/* ============================================ */

function emptyNutrition():
  NutritionTotals {
  return {
    calories: 0,

    proteinG: 0,

    carbsG: 0,

    fiberG: 0,

    ironPercent: 0,

    calciumPercent: 0,

    vitaminAPercent: 0,

    vitaminCPercent: 0,

    sodiumMg: 0,

    sugarG: 0,

    cholesterolMg: 0,
  };
}

/* ============================================ */
/* NUTRITION                                    */
/* ============================================ */

function nutritionForItem(
  item: MenuItem,
  servings = 1
): NutritionTotals {
  return {
    calories:
      (item.calories ?? 0) *
      servings,

    proteinG:
      (item.proteinG ?? 0) *
      servings,

    carbsG:
      (item.carbsG ?? 0) *
      servings,

    fiberG:
      /*
       * Add fiberG to MenuItem if
       * you have not already done so.
       */
      ((item as MenuItem & {
        fiberG?: number;
      }).fiberG ?? 0) *
      servings,

    ironPercent:
      (item.ironPercent ?? 0) *
      servings,

    calciumPercent:
      (item.calciumPercent ?? 0) *
      servings,

    vitaminAPercent:
      (item.vitaminAPercent ?? 0) *
      servings,

    vitaminCPercent:
      (item.vitaminCPercent ?? 0) *
      servings,

    sodiumMg:
      (item.sodiumMg ?? 0) *
      servings,

    sugarG:
      (item.sugarG ?? 0) *
      servings,

    cholesterolMg:
      (item.cholesterolMg ?? 0) *
      servings,
  };
}

function addNutrition(
  a: NutritionTotals,
  b: NutritionTotals
): NutritionTotals {
  return {
    calories:
      a.calories +
      b.calories,

    proteinG:
      a.proteinG +
      b.proteinG,

    carbsG:
      a.carbsG +
      b.carbsG,

    fiberG:
      a.fiberG +
      b.fiberG,

    ironPercent:
      a.ironPercent +
      b.ironPercent,

    calciumPercent:
      a.calciumPercent +
      b.calciumPercent,

    vitaminAPercent:
      a.vitaminAPercent +
      b.vitaminAPercent,

    vitaminCPercent:
      a.vitaminCPercent +
      b.vitaminCPercent,

    sodiumMg:
      a.sodiumMg +
      b.sodiumMg,

    sugarG:
      a.sugarG +
      b.sugarG,

    cholesterolMg:
      a.cholesterolMg +
      b.cholesterolMg,
  };
}

/* ============================================ */
/* CARBON                                       */
/* ============================================ */

export function getCarbonLevel(
  item: MenuItem
): CarbonLevel {
  const traits =
    item.traits.map(
      (trait) =>
        trait.toLowerCase()
    );

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint low"
        )
    )
  ) {
    return "low";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint medium"
        )
    )
  ) {
    return "medium";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint high"
        )
    )
  ) {
    return "high";
  }

  return "unknown";
}

/*
 * Conservative daily summary:
 *
 * Any High -> High
 * otherwise any Medium -> Medium
 * otherwise Low if all known foods are Low
 *
 * This is NOT kilograms of CO2.
 * It is based only on Michigan Dining's
 * categorical labels.
 */
export function combineCarbonLevels(
  levels: CarbonLevel[]
): CarbonLevel {
  if (
    levels.includes("high")
  ) {
    return "high";
  }

  if (
    levels.includes("medium")
  ) {
    return "medium";
  }

  if (
    levels.includes("low")
  ) {
    return "low";
  }

  return "unknown";
}

/* ============================================ */
/* SAFETY FILTER                                */
/* ============================================ */

function normalize(
  value: string
) {
  return value
    .trim()
    .toLowerCase();
}

function hasAllergenConflict(
  item: MenuItem,
  allergies: string[]
) {
  const itemAllergens =
    item.allergens.map(
      normalize
    );

  return allergies.some(
    (allergy) => {
      const normalized =
        normalize(allergy);

      return itemAllergens.some(
        (itemAllergen) =>
          itemAllergen.includes(
            normalized
          ) ||
          normalized.includes(
            itemAllergen
          )
      );
    }
  );
}

/* ============================================ */
/* DIET FILTER                                  */
/* ============================================ */

function matchesDiet(
  item: MenuItem,
  preferences: string[]
) {
  const traits =
    item.traits.map(
      normalize
    );

  for (
    const preference
    of preferences
  ) {
    const normalized =
      normalize(preference);

    if (
      normalized ===
      "vegan"
    ) {
      if (
        !traits.some(
          (trait) =>
            trait.includes(
              "vegan"
            )
        )
      ) {
        return false;
      }
    }

    if (
      normalized ===
      "vegetarian"
    ) {
      if (
        !traits.some(
          (trait) =>
            trait.includes(
              "vegetarian"
            ) ||
            trait.includes(
              "vegan"
            )
        )
      ) {
        return false;
      }
    }

    if (
      normalized ===
      "halal"
    ) {
      if (
        !traits.some(
          (trait) =>
            trait.includes(
              "halal"
            )
        )
      ) {
        return false;
      }
    }

    if (
      normalized ===
      "gluten-free" ||
      normalized ===
      "gluten free"
    ) {
      if (
        !traits.some(
          (trait) =>
            trait.includes(
              "gluten free"
            ) ||
            trait.includes(
              "gluten-free"
            )
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

/* ============================================ */
/* REMAINING TARGETS                            */
/* ============================================ */

function positiveRemaining(
  target:
    number | undefined,

  consumed:
    number
) {
  if (
    target === undefined
  ) {
    return undefined;
  }

  return Math.max(
    target - consumed,
    0
  );
}

function remainingTargets(
  profile: CoachProfile,
  consumed: NutritionTotals
) {
  const targets =
    profile.nutritionTargets ??
    {};

  return {
    calories:
      positiveRemaining(
        targets.calories ??
          profile.calorieGoal,

        consumed.calories
      ),

    proteinG:
      positiveRemaining(
        targets.proteinG,

        consumed.proteinG
      ),

    carbsG:
      positiveRemaining(
        targets.carbsG,

        consumed.carbsG
      ),

    fiberG:
      positiveRemaining(
        targets.fiberG,

        consumed.fiberG
      ),

    ironPercent:
      positiveRemaining(
        targets.ironPercent,

        consumed.ironPercent
      ),

    calciumPercent:
      positiveRemaining(
        targets.calciumPercent,

        consumed.calciumPercent
      ),

    vitaminAPercent:
      positiveRemaining(
        targets.vitaminAPercent,

        consumed.vitaminAPercent
      ),

    vitaminCPercent:
      positiveRemaining(
        targets.vitaminCPercent,

        consumed.vitaminCPercent
      ),

    sodiumRemainingMg:
      positiveRemaining(
        targets.maxSodiumMg,

        consumed.sodiumMg
      ),

    sugarRemainingG:
      positiveRemaining(
        targets.maxSugarG,

        consumed.sugarG
      ),

    cholesterolRemainingMg:
      positiveRemaining(
        targets.maxCholesterolMg,

        consumed.cholesterolMg
      ),
  };
}

/* ============================================ */
/* GEMINI RECOMMENDATION                        */
/* ============================================ */

export async function recommendMeal({
  meal,
  hall,
  menuItems,
  profile,
  consumedToday,
}: {
  meal: MealSlot;

  hall: string;

  menuItems: MenuItem[];

  profile: CoachProfile;

  consumedToday:
    NutritionTotals;
}): Promise<
  MealRecommendation
> {
  /*
   * IMPORTANT:
   *
   * Allergens and diet restrictions are
   * filtered BEFORE Gemini sees the foods.
   *
   * Never make Gemini responsible for
   * allergen safety.
   */

  const safeItems =
    menuItems.filter(
      (item) => {
        const correctMeal =
          item.meal
            .toLowerCase()
            .includes(
              meal
            );

        if (
          !correctMeal
        ) {
          return false;
        }

        if (
          hasAllergenConflict(
            item,
            profile.allergies
          )
        ) {
          return false;
        }

        if (
          !matchesDiet(
            item,
            profile.foodPreferences ??
              []
          )
        ) {
          return false;
        }

        return true;
      }
    );

  if (
    safeItems.length ===
    0
  ) {
    throw new Error(
      `No safe ${meal} items were found at ${hall}.`
    );
  }

  /*
   * Put Low carbon items first.
   *
   * Gemini can still choose Medium if
   * nutrition needs make it meaningfully
   * better.
   *
   * High is considered last.
   */
  const carbonOrder:
    Record<
      CarbonLevel,
      number
    > = {
      low: 0,
      medium: 1,
      unknown: 2,
      high: 3,
    };

  const candidates =
    [...safeItems]
      .sort(
        (a, b) =>
          carbonOrder[
            getCarbonLevel(
              a
            )
          ] -
          carbonOrder[
            getCarbonLevel(
              b
            )
          ]
      )
      /*
       * Avoid sending hundreds of foods
       * into the model.
       */
      .slice(
        0,
        60
      );

  const remaining =
    remainingTargets(
      profile,
      consumedToday
    );

  const geminiCandidates =
    candidates.map(
      (item) => ({
        name:
          item.name,

        meal:
          item.meal,

        calories:
          item.calories ??
          null,

        proteinG:
          item.proteinG ??
          null,

        carbsG:
          item.carbsG ??
          null,

        fiberG:
          (
            item as MenuItem & {
              fiberG?: number;
            }
          ).fiberG ??
          null,

        ironPercent:
          item.ironPercent ??
          null,

        calciumPercent:
          item.calciumPercent ??
          null,

        vitaminAPercent:
          item.vitaminAPercent ??
          null,

        vitaminCPercent:
          item.vitaminCPercent ??
          null,

        sodiumMg:
          item.sodiumMg ??
          null,

        sugarG:
          item.sugarG ??
          null,

        cholesterolMg:
          item.cholesterolMg ??
          null,

        carbon:
          getCarbonLevel(
            item
          ),

        traits:
          item.traits,
      })
    );

  const prompt = `
You are the meal-selection engine for Maize, a University of Michigan dining assistant.

Choose a practical ${meal} from the REAL Michigan Dining items provided below.

DINING HALL:
${hall}

USER DIET PREFERENCES:
${JSON.stringify(profile.foodPreferences ?? [])}

USER HEALTH / NUTRITION CONTEXT:
${JSON.stringify(profile.healthConsiderations ?? [])}

NUTRITION ALREADY CONSUMED TODAY:
${JSON.stringify(consumedToday)}

REMAINING DAILY NEEDS / LIMITS:
${JSON.stringify(remaining)}

AVAILABLE SAFE MENU ITEMS:
${JSON.stringify(geminiCandidates)}

RULES:

1. You may ONLY select exact food names from AVAILABLE SAFE MENU ITEMS.
2. Do not invent foods, nutrition values, allergens, traits, or serving sizes.
3. Allergy and dietary safety has already been handled by the backend.
4. Focus primarily on closing the user's remaining calorie and nutrient gaps.
5. Avoid unnecessarily exceeding sodium, sugar, and cholesterol limits when those limits are supplied.
6. Prefer foods marked "low" carbon whenever they can reasonably satisfy the user's nutrition needs.
7. Use "medium" carbon when it creates a meaningfully better nutritional fit.
8. Use "high" carbon only when the nutritional benefit is important and suitable low/medium alternatives are not available.
9. Choose a normal meal-sized combination, not every item on the menu.
10. Do not make medical diagnoses or treatment claims.
11. Return exact menu item names.
`;

  const response =
    await ai.models.generateContent(
      {
        model:
          GEMINI_MODEL,

        contents:
          prompt,

        config: {
          temperature:
            0.2,

          responseMimeType:
            "application/json",

          responseSchema: {
            type:
              "object",

            properties: {
              items: {
                type:
                  "array",

                minItems: 1,

                maxItems: 5,

                items: {
                  type:
                    "object",

                  properties: {
                    name: {
                      type:
                        "string",
                    },

                    servings: {
                      type:
                        "number",
                    },

                    reason: {
                      type:
                        "string",
                    },
                  },

                  required: [
                    "name",
                    "servings",
                    "reason",
                  ],
                },
              },

              reason: {
                type:
                  "string",
              },
            },

            required: [
              "items",
              "reason",
            ],
          },
        },
      }
    );

  const parsed =
    JSON.parse(
      response.text ??
        "{}"
    ) as GeminiChoice;

  /*
   * Gemini output gets validated against
   * the real menu again.
   */
  const itemMap =
    new Map(
      candidates.map(
        (item) => [
          item.name,
          item,
        ]
      )
    );

  const recommendations:
    RecommendedItem[] =
    [];

  for (
    const choice
    of parsed.items ??
    []
  ) {
    const actualItem =
      itemMap.get(
        choice.name
      );

    /*
     * Ignore hallucinated names.
     */
    if (
      !actualItem
    ) {
      continue;
    }

    /*
     * Keep recommendation servings
     * reasonable.
     */
    const servings =
      Math.max(
        1,

        Math.min(
          Math.round(
            choice.servings
          ) || 1,

          3
        )
      );

    recommendations.push(
      {
        name:
          actualItem.name,

        servings,

        reason:
          choice.reason,

        carbonLevel:
          getCarbonLevel(
            actualItem
          ),

        nutrition:
          nutritionForItem(
            actualItem,
            servings
          ),
      }
    );
  }

  if (
    recommendations.length ===
    0
  ) {
    throw new Error(
      "Gemini did not return any valid menu items."
    );
  }

  let totals =
    emptyNutrition();

  for (
    const item
    of recommendations
  ) {
    totals =
      addNutrition(
        totals,
        item.nutrition
      );
  }

  const carbonLevel =
    combineCarbonLevels(
      recommendations.map(
        (item) =>
          item.carbonLevel
      )
    );

  /*
   * Build the notification using REAL
   * server-calculated values rather than
   * asking Gemini to invent totals.
   */
  const foodText =
    recommendations
      .map(
        (item) =>
          `${item.servings}× ${item.name}`
      )
      .join(", ");

  const mealTitle =
    meal
      .charAt(0)
      .toUpperCase() +
    meal.slice(1);

  const message =
    `🍽 ${mealTitle} · ${hall}\n` +
    `${foodText}\n\n` +
    `≈ ${Math.round(
      totals.calories
    )} kcal · ` +
    `${formatNumber(
      totals.proteinG
    )}g protein · ` +
    `${formatNumber(
      totals.carbsG
    )}g carbs\n` +
    `Carbon footprint: ${
      carbonLevel ===
      "unknown"
        ? "not labeled"
        : carbonLevel
            .charAt(0)
            .toUpperCase() +
          carbonLevel.slice(
            1
          )
    }\n\n` +
    parsed.reason;

  return {
    meal,

    hall,

    items:
      recommendations,

    totals,

    carbonLevel,

    reason:
      parsed.reason,

    message,
  };
}

/* ============================================ */
/* DAILY CARBON SUMMARY                         */
/* ============================================ */

export interface LoggedFood {
  item: MenuItem;

  servings: number;
}

export function buildDailySummary({
  foods,
  calorieGoal,
}: {
  foods:
    LoggedFood[];

  calorieGoal:
    number;
}) {
  let totals =
    emptyNutrition();

  const carbonLevels:
    CarbonLevel[] = [];

  let low = 0;

  let medium = 0;

  let high = 0;

  let unknown = 0;

  for (
    const logged
    of foods
  ) {
    totals =
      addNutrition(
        totals,
        nutritionForItem(
          logged.item,
          logged.servings
        )
      );

    const level =
      getCarbonLevel(
        logged.item
      );

    carbonLevels.push(
      level
    );

    if (
      level ===
      "low"
    ) {
      low +=
        logged.servings;
    } else if (
      level ===
      "medium"
    ) {
      medium +=
        logged.servings;
    } else if (
      level ===
      "high"
    ) {
      high +=
        logged.servings;
    } else {
      unknown +=
        logged.servings;
    }
  }

  const overallCarbon =
    combineCarbonLevels(
      carbonLevels
    );

  const carbonText =
    overallCarbon ===
    "unknown"
      ? "not enough labeled data"
      : `${overallCarbon
          .charAt(0)
          .toUpperCase()}${overallCarbon.slice(
          1
        )}`;

  const message =
    `🌙 Today's Maize summary\n\n` +
    `${Math.round(
      totals.calories
    ).toLocaleString()} / ${calorieGoal.toLocaleString()} kcal\n` +
    `${formatNumber(
      totals.proteinG
    )}g protein · ` +
    `${formatNumber(
      totals.carbsG
    )}g carbs\n` +
    `Iron: ${formatNumber(
      totals.ironPercent
    )}% DV · ` +
    `Vitamin A: ${formatNumber(
      totals.vitaminAPercent
    )}% DV · ` +
    `Vitamin C: ${formatNumber(
      totals.vitaminCPercent
    )}% DV\n\n` +
    `Carbon footprint level: ${carbonText}\n` +
    `${low} low · ${medium} medium · ${high} high` +
    (
      unknown > 0
        ? ` · ${unknown} unlabeled`
        : ""
    ) +
    `\n\nCarbon level uses Michigan Dining's Low / Medium / High menu labels, not an estimated CO₂ mass.`;

  return {
    totals,

    carbonLevel:
      overallCarbon,

    counts: {
      low,
      medium,
      high,
      unknown,
    },

    message,
  };
}

function formatNumber(
  value: number
) {
  if (
    Number.isInteger(
      value
    )
  ) {
    return String(
      value
    );
  }

  return value.toFixed(
    1
  );

  
}