import { FoodPreference } from "../constants/foodPreferences";
export type Gender =
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer not to say";

export type FreeTimeBlock = {
  start: string;
  end: string;
};

export type UserProfile = {
  // Authentication
  phone: string;

  // Body information
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  age?: number;
  gender?: Gender;

  // Health
  healthConsiderations: string[];
  allergies: string[];

  // Goals
  calorieGoal?: number;
  calorieGoalIsCustom?: boolean;
  foodPreferences: string[];

  mealWindows?: MealWindows;

  googleCalendarConnected?: boolean;
  freeTimeBlocks: FreeTimeBlock[];
};

export type MealTimeWindow = {
  start: string;
  end: string;
};

export type MealWindows = {
  breakfast: MealTimeWindow;
  lunch: MealTimeWindow;
  dinner: MealTimeWindow;
};