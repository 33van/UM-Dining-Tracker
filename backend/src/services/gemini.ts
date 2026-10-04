import { GoogleGenAI } from "@google/genai";
import type { MenuItem } from "./dining.js";
import type { UserProfile } from "../types/UserProfile.js";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error(
    "GEMINI_API_KEY is missing. Add it to backend/.env"
  );
}

const ai = new GoogleGenAI({
  apiKey,
});


/* ==========================================
   EXISTING DINING RECOMMENDATION TYPES
========================================== */

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


/* ==========================================
   EXISTING RECOMMENDATION SCHEMA
========================================== */

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
            type: [
              "number",
              "null",
            ],
          },

          proteinG: {
            type: [
              "number",
              "null",
            ],
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

  required: [
    "recommendations",
  ],
};


/* ==========================================
   DINING HALL MEAL RECOMMENDATIONS
========================================== */

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


  const interaction =
    await ai.interactions.create({
      model:
        "gemini-3.8-flash",

      input:
        prompt,

      response_format: {
        type:
          "text",

        mime_type:
          "application/json",

        schema:
          recommendationSchema,
      },
    });


  const parsed =
    JSON.parse(
      interaction.output_text ??
        "{}"
    );


  return (
    parsed.recommendations ??
    []
  );
}


/* ==========================================
   MAIZE IMESSAGE CONVERSATION
========================================== */

export async function askGemini(
  userMessage: string,
  profile: UserProfile
): Promise<string> {

  const prompt = `
You are Maize, a dining hall assistant for a University of Michigan student.

The student is talking to you through iMessage.

Your job is to help them make practical food and dining decisions based on their personal profile.

USER PROFILE:
${JSON.stringify(profile, null, 2)}

USER MESSAGE:
${userMessage}

Instructions:

- Respond directly to the user's message.
- Keep responses concise because this is an iMessage conversation.
- Be friendly and conversational.
- Use the user's profile when it is relevant.
- Consider their calorie goal.
- Consider their dietary preferences.
- Consider their health considerations.
- Respect every allergy listed in their profile.
- Do not recommend foods containing a listed allergen.
- Do not invent current dining hall menu items.
- Do not claim a dining hall is currently open unless current dining hall information has been provided.
- If you do not have enough information to answer accurately, say so briefly.
- Do not mention that you were given a JSON profile.
- Refer to yourself as Maize when appropriate.

Return only the message that should be sent to the student.
`;


  const interaction =
    await ai.interactions.create({
      model:
        "gemini-3.8-flash",

      input:
        prompt,
    });


  const reply =
    interaction.output_text?.trim();


  if (!reply) {
    return (
      "I'm having trouble coming up with a response right now. Try again in a moment!"
    );
  }


  return reply;
}