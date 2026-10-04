import { GoogleGenAI } from "@google/genai";
import type { MenuItem } from "./dining.js";
import type {
  UserProfile,
} from "../types/UserProfile.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Add it to backend/.env"
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

export interface CurrentNutrition {
  caloriesConsumed: number;
  calorieGoal: number;

  nutrients: Record<
    string,
    number | null | undefined
  >;
}

export interface UserPreferences {
  allergies: string[];

  diet:
    | "none"
    | "vegetarian"
    | "vegan"
    | "pescatarian";

  calorieTarget?: number;
  proteinTargetG?: number;

  preferredTraits?: string[];
}

export interface MealRecommendation {
  name: string;
  meal: string;
  mealTime: string;

  calories: number | null;
  proteinG: number | null;

  reason: string;
}

const recommendationSchema = {
  type: "object",

  properties: {
    recommendations: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
          },

          meal: {
            type: "string",
          },

          mealTime: {
            type: "string",
          },

          calories: {
            type: ["number", "null"],
          },

          proteinG: {
            type: ["number", "null"],
          },

          reason: {
            type: "string",
          },
        },

        required: [
          "name",
          "meal",
          "mealTime",
          "calories",
          "proteinG",
          "reason",
        ],
      },
    },
  },

  required: ["recommendations"],
};

export async function recommendMeals(
  preferences: UserPreferences,
  menu: MenuItem[]
): Promise<MealRecommendation[]> {
  const prompt = `
You are helping a University of Michigan student choose food
from today's dining hall menu.

USER PREFERENCES:
${JSON.stringify(preferences, null, 2)}

AVAILABLE MENU ITEMS:
${JSON.stringify(menu, null, 2)}

Rules:
- Only recommend foods from AVAILABLE MENU ITEMS.
- Do not invent foods.
- Rank foods based on the user's nutrition goals and preferences.
- Prefer foods that help the user meet their calorie and protein goals.
- Consider traits such as vegan, vegetarian, gluten free, halal, etc.
- Return at most 3 recommendations.
- Keep each explanation short and practical.
`;

  const interaction = await ai.interactions.create({
    model: "gemini-3.8-flash",

    input: prompt,

    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: recommendationSchema,
    },
  });

  const parsed = JSON.parse(
    interaction.output_text ?? "{}"
  );

  return parsed.recommendations ?? [];
}
const nextMealSchema = {
  type: "object",

  properties: {
    items: {
      type: "array",

      items: {
        type: "object",

        properties: {
          name: {
            type: "string",
          },

          servings: {
            type: "number",
          },
        },

        required: [
          "name",
          "servings",
        ],
      },
    },

    reason: {
      type: "string",
    },
  },

  required: [
    "items",
    "reason",
  ],
};
export async function recommendNextMeal(
  profile: UserProfile,
  currentNutrition: CurrentNutrition,
  menu: MenuItem[]
) {
  const remainingCalories =
    Math.max(
      currentNutrition.calorieGoal -
        currentNutrition.caloriesConsumed,
      0
    );

  const prompt = `
You are Maize, a University of Michigan
dining recommendation assistant.

Your job is to choose the user's NEXT MEAL
from the provided Michigan Dining menu.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

NUTRITION CONSUMED TODAY:
${JSON.stringify(currentNutrition, null, 2)}

REMAINING DAILY CALORIES:
${remainingCalories}

AVAILABLE MENU ITEMS:
${JSON.stringify(menu, null, 2)}

IMPORTANT RULES:

1. FOOD SAFETY
Never recommend a food that conflicts with
the user's allergies, dietary restrictions,
health considerations, or food preferences.

2. NUTRITION
Choose a combination of foods that helps
the user move toward their remaining daily
calorie and nutrient targets.

Consider calories, protein, carbohydrates,
fiber, fat, sodium, sugar, vitamins, and
minerals when that information is available.

Do not greatly overshoot the user's
remaining calorie target.

3. CARBON FOOTPRINT
Among nutritionally appropriate foods,
strongly prefer foods whose traits contain:

"carbon footprint low"

Use foods labeled:

"carbon footprint medium"

only when they meaningfully improve the
nutritional quality of the meal.

Avoid:

"carbon footprint high"

unless there is no reasonable lower-carbon
combination that satisfies the user's
dietary and nutritional needs.

4. REAL MENU ITEMS ONLY
You MUST only recommend foods appearing
in AVAILABLE MENU ITEMS.

The returned "name" MUST EXACTLY match
the item's "name" from AVAILABLE MENU ITEMS.

Do not rename foods.
Do not invent foods.

5. SERVINGS
Recommend a reasonable number of servings.

Use whole-number servings of at least 1.

6. MEAL SIZE
Return between 1 and 4 foods that together
form one sensible next meal.

Return a short reason explaining why this
combination fits the user's nutrition and
sustainability goals.
`;

  const interaction =
    await ai.interactions.create({
      model: "gemini-3.8-flash",

      input: prompt,

      response_format: {
        type: "text",
        mime_type:
          "application/json",
        schema:
          nextMealSchema,
      },
    });

  const parsed =
    JSON.parse(
      interaction.output_text ??
        "{}"
    );

  return {
    items:
      Array.isArray(parsed.items)
        ? parsed.items
        : [],

    reason:
      typeof parsed.reason ===
      "string"
        ? parsed.reason
        : "",
  };
}

// import type {
//   UserProfile,
// } from "../types/UserProfile.js";


export async function askGemini(
  message: string,
  profile: UserProfile
): Promise<string> {
  const prompt = `
You are Maize, a friendly University of Michigan dining assistant.

You are chatting with the user through iMessage.

Keep responses concise and conversational because they are being sent as text messages.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

USER MESSAGE:
${message}

Instructions:
- Answer the user's question directly.
- Use the user's profile when relevant.
- - The user's listed allergies are HARD RESTRICTIONS.
- NEVER recommend, suggest, or positively mention a food that contains or may contain one of the user's allergens.
- Check every food suggestion against the user's allergies before responding.
- Respect all dietary preferences.
- Consider health considerations when relevant.
- Consider the user's calorie goal when discussing food.
- If you are uncertain whether a food conflicts with an allergy, do not recommend it.
- If the question is unrelated to food or nutrition, you can still answer conversationally.
- Do not mention that you are Gemini.
- You are Maize.
`;

  const models = [
    "gemini-3.8-flash",
  ];

  let lastError: unknown;

  for (const model of models) {
    for (
      let attempt = 1;
      attempt <= 2;
      attempt++
    ) {
      try {
        console.log(
          `Gemini: ${model}, attempt ${attempt}`
        );

        const response =
          await ai.models.generateContent({
            model,
            contents: prompt,
          });

        const reply =
          response.text?.trim();

        if (reply) {
          return reply;
        }

        throw new Error(
          "Gemini returned an empty response."
        );
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini ${model} attempt ${attempt} failed:`,
          error
        );

        if (attempt < 2) {
          await new Promise(
            (resolve) =>
              setTimeout(
                resolve,
                1000
              )
          );
        }
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "Gemini is temporarily unavailable."
      );
}