export type Gender =
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer not to say";

export type UserProfile = {
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
  foodPreferences: string[];

  // Integrations
  googleCalendarConnected?: boolean;
};