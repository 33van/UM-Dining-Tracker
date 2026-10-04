import { Router } from "express";
import { getDiningMenu, type DiningHallSlug } from "../services/dining.js";

const router = Router();

router.get("/menu", async (req, res) => {
  try {
    const hall = req.query.hall;
    const date = req.query.date;

    if (
      typeof hall !== "string" ||
      typeof date !== "string"
    ) {
      return res.status(400).json({
        error: "hall and date are required",
      });
    }

    const menu = await getDiningMenu(
      hall as DiningHallSlug,
      date
    );

    return res.json({
      hall,
      date,
      itemCount: menu.length,
      items: menu,
    });
  } catch (error) {
    console.error("Dining error:", error);

    return res.status(500).json({
      error: "Could not fetch dining menu",
    });
  }
});

export default router;