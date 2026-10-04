import { GoogleGenAI } from "@google/genai";
import type { MenuItem } from "./dining.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Add it to backend/.env"
  );
}

const ai = new GoogleGenAI({
  apiKey,
});

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