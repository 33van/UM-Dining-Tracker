export type FreeTimeBlock = {
  start: string;
  end: string;
};

export type RecommendationWindow = {
  start: string;
  end: string;
};

export type UserProfile = {
  phone: string;

  heightFeet?: number;
  heightInches?: number;
  weightLbs?: number;
  age?: number;
  gender?: string;

  healthConsiderations: string[];
  allergies: string[];

  calorieGoal?: number;
  calorieGoalIsCustom?: boolean;
  foodPreferences: string[];

  googleCalendarConnected?: boolean;
  freeTimeBlocks: FreeTimeBlock[];

  recommendationWindows: RecommendationWindow[];
  allowLocationRecommendations: boolean;
};