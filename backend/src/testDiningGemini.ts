import "dotenv/config";

import "dotenv/config";

import {
  GoogleGenAI,
} from "@google/genai";

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error(
    "GEMINI_API_KEY is missing from backend/.env"
  );
}

export const ai =
  new GoogleGenAI({
    apiKey: GEMINI_API_KEY,
  });

export const GEMINI_MODEL =
  process.env.GEMINI_MODEL ??
  "gemini-3.8-flash";

/*
 * This should point to the backend
 * that is already running.
 */
const API_URL =
  "http://localhost:3000";

/*
 * Keep this aligned with the object
 * returned by your Cheerio dining parser.
 */
type MenuItem = {
  meal: string;

  mealTime: string;

  name: string;

  calories?: number;

  totalFatG?: number;

  saturatedFatG?: number;

  transFatG?: number;

  proteinG?: number;

  sugarG?: number;

  cholesterolMg?: number;

  sodiumMg?: number;

  carbsG?: number;

  fiberG?: number;

  calciumPercent?: number;

  ironPercent?: number;

  vitaminAPercent?: number;

  vitaminCPercent?: number;

  allergens: string[];

  traits: string[];
};

/* ============================================ */
/* DATE                                         */
/* ============================================ */

function getTodayString() {
  const now =
    new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/* ============================================ */
/* CARBON                                       */
/* ============================================ */

function getCarbonLevel(
  item: MenuItem
) {
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
    return "LOW";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint medium"
        )
    )
  ) {
    return "MEDIUM";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint high"
        )
    )
  ) {
    return "HIGH";
  }

  return "UNKNOWN";
}

/* ============================================ */
/* TEST                                         */
/* ============================================ */

async function testDiningGemini() {
  try {
    const date =
      getTodayString();

    const hall =
      "south-quad";

    /*
     * ----------------------------------------
     * STEP 1
     *
     * Call your REAL Express dining route.
     *
     * That route should internally run
     * your Cheerio parser.
     * ----------------------------------------
     */

    const url =
      `${API_URL}/api/dining/menu?hall=${hall}&date=${date}`;

    console.log(
      "\n=============================="
    );

    console.log(
      "1. FETCHING CHEERIO MENU"
    );

    console.log(
      "=============================="
    );

    console.log(
      url
    );

    const response =
      await fetch(url);

    const rawResponse =
      await response.text();

    if (
      !response.ok
    ) {
      console.error(
        "DINING ROUTE FAILED:"
      );

      console.error(
        rawResponse
      );

      return;
    }

    let data:
      unknown;

    try {
      data =
        JSON.parse(
          rawResponse
        );
    } catch {
      console.error(
        "DINING ROUTE RETURNED NON-JSON:"
      );

      console.error(
        rawResponse
      );

      return;
    }

    /*
     * Supports both:
     *
     * res.json(items)
     *
     * and:
     *
     * res.json({
     *   items
     * })
     */

    let menuItems:
      MenuItem[] = [];

    if (
      Array.isArray(data)
    ) {
      menuItems =
        data as MenuItem[];
    } else if (
      typeof data ===
        "object" &&
      data !== null &&
      "items" in data
    ) {
      const maybeItems =
        (
          data as {
            items?: unknown;
          }
        ).items;

      if (
        Array.isArray(
          maybeItems
        )
      ) {
        menuItems =
          maybeItems as MenuItem[];
      }
    }

    /*
     * ----------------------------------------
     * STEP 2
     *
     * Prove Cheerio actually parsed data.
     * ----------------------------------------
     */

    console.log(
      "\n=============================="
    );

    console.log(
      "2. CHEERIO RESULT"
    );

    console.log(
      "=============================="
    );

    console.log(
      "Items parsed:",
      menuItems.length
    );

    if (
      menuItems.length ===
      0
    ) {
      console.log(
        "No menu items were parsed."
      );

      return;
    }

    /*
     * Print several REAL parsed foods.
     */
    for (
      const item
      of menuItems.slice(
        0,
        10
      )
    ) {
      console.log(
        "\n-----------------------"
      );

      console.log(
        "NAME:",
        item.name
      );

      console.log(
        "MEAL:",
        item.meal
      );

      console.log(
        "CALORIES:",
        item.calories
      );

      console.log(
        "PROTEIN:",
        item.proteinG
      );

      console.log(
        "IRON:",
        item.ironPercent
      );

      console.log(
        "CARBON:",
        getCarbonLevel(
          item
        )
      );

      console.log(
        "TRAITS:",
        item.traits
      );

      console.log(
        "ALLERGENS:",
        item.allergens
      );
    }

    /*
     * ----------------------------------------
     * STEP 3
     *
     * Find lunch items.
     * ----------------------------------------
     */

    const lunchItems =
      menuItems.filter(
        (item) =>
          item.meal
            .toLowerCase()
            .includes(
              "lunch"
            )
      );

    console.log(
      "\n=============================="
    );

    console.log(
      "3. LUNCH ITEMS"
    );

    console.log(
      "=============================="
    );

    console.log(
      "Lunch items:",
      lunchItems.length
    );

    /*
     * We don't need to send the entire
     * dining hall to Gemini for this test.
     *
     * 30 real items is plenty.
     */
    const candidates =
      lunchItems
        .slice(
          0,
          30
        )
        .map(
          (item) => ({
            name:
              item.name,

            calories:
              item.calories ??
              null,

            proteinG:
              item.proteinG ??
              null,

            carbsG:
              item.carbsG ??
              null,

            ironPercent:
              item.ironPercent ??
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

            carbon:
              getCarbonLevel(
                item
              ),

            traits:
              item.traits,
          })
        );

    console.log(
      "\nDATA BEING SENT TO GEMINI:"
    );

    console.log(
      JSON.stringify(
        candidates,
        null,
        2
      )
    );

    /*
     * ----------------------------------------
     * STEP 4
     *
     * Give Gemini an explicit nutrition
     * problem to solve using ONLY the
     * Cheerio data.
     * ----------------------------------------
     */

    const prompt = `
You are testing the Maize University of Michigan dining assistant.

A student needs a lunch recommendation.

USER NEEDS:
- approximately 700 calories remaining for lunch
- needs more protein
- needs more iron
- prefers low-carbon food choices

IMPORTANT:

You may ONLY recommend food names from the PARSED MENU below.

Do not invent any food.

Prefer:
1. foods that help protein needs
2. foods that help iron needs
3. Carbon Footprint Low over Medium
4. avoid Carbon Footprint High when suitable alternatives exist

PARSED MENU FROM CHEERIO:

${JSON.stringify(
  candidates,
  null,
  2
)}

Give me:
- 1 to 4 exact menu item names
- why you selected each item
- approximate calories using ONLY supplied data
- carbon classification
`;

    console.log(
      "\n=============================="
    );

    console.log(
      "4. ASKING GEMINI"
    );

    console.log(
      "=============================="
    );

    const geminiResponse =
      await ai.models.generateContent(
        {
          model:
            GEMINI_MODEL,

          contents:
            prompt,
        }
      );

    const answer =
      geminiResponse.text ??
      "";

    console.log(
      "\n=============================="
    );

    console.log(
      "5. GEMINI ANSWER"
    );

    console.log(
      "=============================="
    );

    console.log(
      answer
    );

    /*
     * ----------------------------------------
     * STEP 5
     *
     * Print low-carbon foods from Cheerio
     * separately.
     *
     * This lets you visually compare whether
     * Gemini actually favored them.
     * ----------------------------------------
     */

    const lowCarbonItems =
      candidates.filter(
        (item) =>
          item.carbon ===
          "LOW"
      );

    console.log(
      "\n=============================="
    );

    console.log(
      "6. LOW-CARBON OPTIONS CHEERIO FOUND"
    );

    console.log(
      "=============================="
    );

    for (
      const item
      of lowCarbonItems
    ) {
      console.log(
        `- ${item.name} | ${item.calories ?? "?"} kcal | ${item.proteinG ?? "?"}g protein | ${item.ironPercent ?? "?"}% iron`
      );
    }

    console.log(
      "\n=============================="
    );

    console.log(
      "TEST COMPLETE"
    );

    console.log(
      "==============================\n"
    );
  } catch (
    error
  ) {
    console.error(
      "DINING + GEMINI TEST FAILED:",
      error
    );
  }
}

testDiningGemini();