import { Router } from "express";
import {
  recommendMeals,
  recommendNextMeal,
  type UserPreferences,
} from "../services/gemini.js";

import {
    getDiningMenu,
    type DiningHallSlug,
    type MenuItem
} from "../services/dining.js";



const router = Router();

function filterMenu(
  menu: MenuItem[],
  preferences: UserPreferences
): MenuItem[] {
  return menu.filter((item) => {
    const itemAllergens =
      (item.allergens ?? []).map(
        (allergen) =>
          allergen
            .trim()
            .toLowerCase()
      );

    const userAllergies =
      (
        preferences.allergies ??
        []
      ).map(
        (allergy) =>
          allergy
            .trim()
            .toLowerCase()
      );

    /*
     * Remove anything containing one
     * of the user's allergens.
     */
    const hasAllergyConflict =
      userAllergies.some(
        (allergy) =>
          itemAllergens.some(
            (itemAllergen) =>
              itemAllergen.includes(
                allergy
              ) ||
              allergy.includes(
                itemAllergen
              )
          )
      );

    if (hasAllergyConflict) {
      return false;
    }

    const traits =
      (item.traits ?? []).map(
        (trait) =>
          trait
            .trim()
            .toLowerCase()
      );

    /*
     * Vegan
     */
    if (
      preferences.diet ===
        "vegan" &&
      !traits.some(
        (trait) =>
          trait.includes(
            "vegan"
          )
      )
    ) {
      return false;
    }

    /*
     * Vegetarian
     */
    if (
      preferences.diet ===
        "vegetarian" &&
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

    const preferredTraits =
      (
        preferences
          .preferredTraits ??
        []
      ).map(
        (trait) =>
          trait
            .trim()
            .toLowerCase()
      );

    /*
     * Halal
     */
    if (
      preferredTraits.includes(
        "halal"
      ) &&
      !traits.some(
        (trait) =>
          trait.includes(
            "halal"
          )
      )
    ) {
      return false;
    }

    /*
     * Gluten-free
     */
    if (
      preferredTraits.includes(
        "gluten-free"
      ) &&
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

    /*
     * Lactose-free
     */
    if (
      preferredTraits.includes(
        "lactose-free"
      ) &&
      !traits.some(
        (trait) =>
          trait.includes(
            "lactose free"
          ) ||
          trait.includes(
            "lactose-free"
          )
      )
    ) {
      return false;
    }

    return true;
  });
}

function getDietFromProfile(
  foodPreferences: string[] = []
): UserPreferences["diet"] {
  const normalized =
    foodPreferences.map(
      (preference) =>
        preference.toLowerCase()
    );

  if (
    normalized.includes("vegan")
  ) {
    return "vegan";
  }

  if (
    normalized.includes(
      "vegetarian"
    )
  ) {
    return "vegetarian";
  }

  if (
    normalized.includes(
      "pescatarian"
    )
  ) {
    return "pescatarian";
  }

  return "none";
}

router.post("/", async (req, res) => {
  try {
    const {
      hall,
      date,
      preferences,
    } = req.body;

    if (
      typeof hall !== "string" ||
      typeof date !== "string"
    ) {
      return res.status(400).json({
        error: "hall and date are required",
      });
    }

    if (!preferences) {
      return res.status(400).json({
        error: "preferences are required",
      });
    }

    const menu = await getDiningMenu(
      hall as DiningHallSlug,
      date
    );

    const filteredMenu = filterMenu(
      menu,
      preferences
    );

    if (filteredMenu.length === 0) {
      return res.json({
        recommendations: [],
        message:
          "No menu items matched the user's restrictions.",
      });
    }

    const recommendations =
      await recommendMeals(
        preferences,
        filteredMenu
      );

    return res.json({
      hall,
      date,

      totalMenuItems: menu.length,
      eligibleMenuItems:
        filteredMenu.length,

      recommendations,
    });
  } catch (error) {
    console.error(
      "Recommendation error:",
      error
    );

    return res.status(500).json({
      error:
        "Could not generate recommendations",
    });
  }
});

router.post(
  
  "/next-meal",

  
  
  async (req, res) => {
    try {
      const {
        hall,
        date,
        profile,
        currentNutrition,
      } = req.body;

      /*
       * Validate request.
       */
      if (
        typeof hall !== "string" ||
        typeof date !== "string"
      ) {
        return res
          .status(400)
          .json({
            error:
              "hall and date are required",
          });
      }

      if (!profile) {
        return res
          .status(400)
          .json({
            error:
              "profile is required",
          });
      }

      if (!currentNutrition) {
        return res
          .status(400)
          .json({
            error:
              "currentNutrition is required",
          });
      }

      /*
       * Load today's REAL Michigan
       * Dining menu.
       */
      const menu =
        await getDiningMenu(
          hall as DiningHallSlug,
          date
        );
        console.log(
          "Menu loaded:",
          menu.length,
          "items"
        );

      /*
       * Convert UserProfile into the
       * preference structure used by
       * our existing safety filter.
       */
      const preferences:
        UserPreferences = {
          allergies:
            Array.isArray(
              profile.allergies
            )
              ? profile.allergies
              : [],

          diet:
            getDietFromProfile(
              profile.foodPreferences
            ),

          calorieTarget:
            profile.calorieGoal,

          preferredTraits:
            Array.isArray(
              profile.foodPreferences
            )
              ? profile.foodPreferences
              : [],
        };

      /*
       * IMPORTANT:
       *
       * Remove foods that violate
       * allergies/diet BEFORE Gemini
       * ever sees the menu.
       */
      console.log(
  "Filtering menu..."
);

const safeMenu =
  filterMenu(
    menu,
    preferences
  );

console.log(
  "Safe menu:",
  safeMenu.length,
  "items"
);

console.log(
  "Recommendation preferences:",
  preferences
);

      if (
        safeMenu.length === 0
      ) {
        return res.json({
          items: [],

          reason:
            "No foods on today's menu matched your dietary restrictions.",
        });
      }

      /*
       * Give Gemini only foods that
       * already passed our safety
       * filtering.
       */
      console.log(
  "Calling Gemini with",
  safeMenu.length,
  "safe menu items..."
);
      const recommendation =
        await recommendNextMeal(
          profile,
          currentNutrition,
          safeMenu
        );
        console.log(
  "Gemini recommendation returned:",
  recommendation
);
        console.log(
          "Safe menu:",
          safeMenu.length,
          "items"
        );

      /*
       * Defensive check:
       *
       * Gemini is instructed to use
       * exact menu names, but we still
       * verify that every returned food
       * actually exists in safeMenu.
       */
      console.log(
        "Calling Gemini..."
      );
      const validNames =
        new Set(
          safeMenu.map(
            (item) =>
              item.name
                .trim()
                .toLowerCase()
          )
        );
        console.log(
  "Gemini returned:",
  recommendation
);
      const validItems =
        recommendation.items.filter(
          (
            item: {
              name: string;
              servings: number;
            }
          ) =>
            typeof item.name ===
              "string" &&
            validNames.has(
              item.name
                .trim()
                .toLowerCase()
            )
        );

      return res.json({
        hall,
        date,

        totalMenuItems:
          menu.length,

        eligibleMenuItems:
          safeMenu.length,

        items:
          validItems,

        reason:
          recommendation.reason,
      });
    } catch (error) {
      console.error(
        "NEXT MEAL RECOMMENDATION ERROR:",
        error
      );

      return res
        .status(500)
        .json({
          error:
            "Could not recommend your next meal.",
        });
    }
  }
);

export default router;