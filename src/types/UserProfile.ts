export type Gender =
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer not to say";

export type UserProfile = {
  // Authentication
  phone: string;

  // Body information
  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  age?: number;
  gender?: Gender;

  // Health / dietary filtering
  healthConsiderations: string[];
  allergies: string[];

  // Goals
  calorieGoal?: number;
  foodPreferences: string[];
};