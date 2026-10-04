import * as cheerio from "cheerio";

const BASE_URL =
  "https://dining.umich.edu/menus-locations/dining-halls";

const CACHE_TTL_MS = 15 * 60 * 1000;

interface CacheEntry {
  expiresAt: number;
  data: MenuItem[];
}

export const DINING_HALLS = {
  bursley: "Bursley",
  "east-quad": "East Quad",
  markley: "Markley",
  "mosher-jordan": "Mosher-Jordan",
  "north-quad": "North Quad",
  "south-quad": "South Quad",
  "twigs-at-oxford": "Twigs at Oxford",
  "wolverine-village-dining-hall": "Wolverine Village",
} as const;

export type DiningHallSlug =
  keyof typeof DINING_HALLS;


const menuCache = new Map<string, CacheEntry>();

export interface MenuItem {
  meal: string;
  mealTime: string;

  name: string;

  calories?: number | undefined;

  totalFatG?: number | undefined;
  saturatedFatG?: number | undefined;
  transFatG?: number | undefined;

  proteinG?: number | undefined;
  sugarG?: number | undefined;
  cholesterolMg?: number | undefined;
  sodiumMg?: number | undefined;
  carbsG?: number | undefined;

  calciumPercent?: number | undefined;
  ironPercent?: number | undefined;
  vitaminAPercent?: number | undefined;
  vitaminCPercent?: number | undefined;

  allergens: string[];
  traits: string[];
}

/*
  Example:
  "Calories 183" -> 183
  "Total Fat 3g" -> 3
  "Sodium 113mg" -> 113
*/
function getNumber(text: string): number | undefined {
  const match = text.match(/[\d.]+/);

  if (!match) {
    return undefined;
  }

  return Number(match[0]);
}

/*
  Gets nutrition values from the first column.

  Example:
  <td><strong>Protein</strong> 6g</td>

  returns:
  6
*/
function getNutritionValue(
  $nutrition: cheerio.Cheerio<any>,
  label: string
): number | undefined {
  let result: number | undefined;

  $nutrition
    .find("table.nutrition-facts tr")
    .each((_, row) => {
      const firstCell = cheerio
        .load(row)("td")
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (firstCell.startsWith(label)) {
        const valueText = firstCell
          .replace(label, "")
          .trim();

        result = getNumber(valueText);
      }
    });

  return result;
}

/*
  Vitamin A, Vitamin C, Calcium and Iron
  are given as % Daily Value in the UMich HTML.

  Example:

  <td>Iron</td>
  <td>11%</td>

  returns:
  11
*/
function getMicronutrientPercent(
  $nutrition: cheerio.Cheerio<any>,
  label: string
): number | undefined {
  let result: number | undefined;

  $nutrition
    .find("table.nutrition-facts tr")
    .each((_, row) => {
      const $row = cheerio.load(row);

      const cells = $row("td");

      const name = cells
        .first()
        .text()
        .replace(/\s+/g, " ")
        .trim();

      if (name === label) {
        const value = cells
          .eq(1)
          .text()
          .replace(/\s+/g, " ")
          .trim();

        result = getNumber(value);
      }
    });

  return result;
}

export async function getDiningMenu(
  hall: DiningHallSlug,
  date: string
): Promise<MenuItem[]> {
  const url =
    `${BASE_URL}/${hall}/?menuDate=${encodeURIComponent(date)}`;

    const cacheKey = `${hall}:${date}`;

    const cached = menuCache.get(cacheKey);

    if (
    cached &&
    Date.now() < cached.expiresAt
    ) {
    console.log(
        `Returning cached menu for ${hall} ${date}`
    );

    return cached.data;
    }

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Michigan Dining request failed: ${response.status}`
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const mealTimes: Record<string, string> = {};

  $(".calhours li").each((_, element) => {
    const mealName = $(element)
      .find(".calhours-title")
      .text()
      .replace(/\s+/g, " ")
      .trim();

    const mealTime = $(element)
      .find(".calhours-times")
      .text()
      .replace(/\u00a0/g, " ")
      .replace(/\u2011/g, "-")
      .replace(/\s+/g, " ")
      .trim();

    if (mealName) {
      mealTimes[mealName] = mealTime;
    }
  });

  const items: MenuItem[] = [];

  $("#mdining-items > h3").each(
    (_, mealHeading) => {
      const meal = $(mealHeading)
        .text()
        .replace(/\s+/g, " ")
        .trim();

      const mealTime =
        mealTimes[meal] ?? "";

      const courses = $(mealHeading).next(
        ".courses"
      );

      courses
        .find(".courses_wrapper > li")
        .each((_, courseElement) => {
          $(courseElement)
            .find("ul.items")
            .first()
            .children("li")
            .each((_, itemElement) => {
              const $item = $(itemElement);

              const name = $item
                .find(".item-name")
                .first()
                .text()
                .trim();

              if (!name) {
                return;
              }

              const traits = $item
                .find("ul.traits li")
                .map((_, trait) => {
                  return (
                    $(trait)
                      .attr("title")
                      ?.trim() ||
                    $(trait).text().trim()
                  );
                })
                .get();

              const $nutrition =
                $item.next(".nutrition");

              const allergens = $nutrition
                .find(".allergens li")
                .map((_, allergen) =>
                  $(allergen)
                    .text()
                    .trim()
                )
                .get();

              const menuItem: MenuItem = {
                meal,
                mealTime,

                name,

                calories:
                  getNutritionValue(
                    $nutrition,
                    "Calories"
                  ),

                totalFatG:
                  getNutritionValue(
                    $nutrition,
                    "Total Fat"
                  ),

                saturatedFatG:
                  getNutritionValue(
                    $nutrition,
                    "Saturated Fat"
                  ),

                transFatG:
                  getNutritionValue(
                    $nutrition,
                    "Trans Fat"
                  ),

                proteinG:
                  getNutritionValue(
                    $nutrition,
                    "Protein"
                  ),

                sugarG:
                  getNutritionValue(
                    $nutrition,
                    "Sugars"
                  ),

                cholesterolMg:
                  getNutritionValue(
                    $nutrition,
                    "Cholesterol"
                  ),

                sodiumMg:
                  getNutritionValue(
                    $nutrition,
                    "Sodium"
                  ),

                carbsG:
                  getNutritionValue(
                    $nutrition,
                    "Total Carbohydrate"
                  ),

                calciumPercent:
                  getMicronutrientPercent(
                    $nutrition,
                    "Calcium"
                  ),

                ironPercent:
                  getMicronutrientPercent(
                    $nutrition,
                    "Iron"
                  ),

                vitaminAPercent:
                  getMicronutrientPercent(
                    $nutrition,
                    "Vitamin A"
                  ),

                vitaminCPercent:
                  getMicronutrientPercent(
                    $nutrition,
                    "Vitamin C"
                  ),

                allergens,
                traits,
              };

              items.push(menuItem);
            });
        });
    }
  );

  menuCache.set(cacheKey, {
    data: items,
    expiresAt:
        Date.now() + CACHE_TTL_MS,
});

  return items;
}