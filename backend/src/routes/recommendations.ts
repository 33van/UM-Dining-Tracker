import { Router } from "express";

import {
    getDiningMenu,
    type DiningHallSlug,
    type MenuItem
} from "../services/dining.js";

import {
    recommendMeals,
    type UserPreferences,
} from "../services/gemini.js";

const router = Router();

function filterMenu(
  menu: MenuItem[],
  preferences: UserPreferences
): MenuItem[] {
  return menu.filter((item) => {

    const itemAllergens = item.allergens.map((a) =>
      a.toLowerCase()
    );

    const hasAllergyConflict =
      preferences.allergies.some((allergy) =>
        itemAllergens.includes(
          allergy.toLowerCase()
        )
      );

    if (hasAllergyConflict) {
      return false;
    }

    const traits = item.traits.map((trait) =>
      trait.toLowerCase()
    );

    if (
      preferences.diet === "vegan" &&
      !traits.includes("vegan")
    ) {
      return false;
    }

    if (
      preferences.diet === "vegetarian" &&
      !(
        traits.includes("vegetarian") ||
        traits.includes("vegan")
      )
    ) {
      return false;
    }

    return true;
  });
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

export default router;