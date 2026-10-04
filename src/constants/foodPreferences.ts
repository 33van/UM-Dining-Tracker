export const FOOD_PREFERENCES = [
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Halal",
  "Gluten-free",
  "Lactose-free",
] as const;

export type FoodPreference = (typeof FOOD_PREFERENCES)[number];
