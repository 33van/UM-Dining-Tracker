export type Gender =
  | "Woman"
  | "Man"
  | "Non-binary"
  | "Prefer not to say";

export type UserProfile = {
  phone: string;

  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  age?: number;
  gender?: Gender;

  healthConsiderations: string[];
  allergies: string[];

  calorieGoal?: number;
  foodPreferences: string[];
};