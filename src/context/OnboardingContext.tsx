import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";

import { FoodPreference } from "../constants/foodPreferences";
import { CalendarSession } from "../types/CalendarSession";
import {
  FreeTimeBlock,
  Gender,
  UserProfile,
  RecommendationWindow,
  // MealWindows,
} from "../types/UserProfile";


type PlanInfo = {
  recommendationWindows: RecommendationWindow[];
  allowLocationRecommendations: boolean;
};
type BodyInfo = {
  heightFeet: number;
  heightInches: number;
  weightLbs: number;
  age: number;
  gender: Gender;
  healthConsiderations: string[];
  allergies: string[];
};

type GoalsInfo = {
  calorieGoal: number;
  calorieGoalIsCustom: boolean;
  foodPreferences: FoodPreference[];
};

type OnboardingContextType = {
  profile: UserProfile;
  calendarSession: CalendarSession | null;
  lastCalendarPullAt: number | null;

  setPlanInfo: (info: PlanInfo) => void;

  setPhone: (phone: string) => void;
  setBodyInfo: (info: BodyInfo) => void;
  setGoalsInfo: (info: GoalsInfo) => void;
  saveCalendarAvailability: (
    session: CalendarSession,
    freeTimeBlocks: FreeTimeBlock[]
  ) => void;
  saveFreeTimeBlocks: (freeTimeBlocks: FreeTimeBlock[]) => void;
  updateCalendarSession: (session: CalendarSession) => void;
  noteCalendarPull: (pulledAt: number) => void;
  // setMealWindows: (mealWindows: MealWindows) => void;
};

const OnboardingContext = createContext<
  OnboardingContextType | undefined
>(undefined);

function debugFreeTimeBlocks(
  label: string,
  freeTimeBlocks: FreeTimeBlock[]
) {
  console.log("\n=================================");
  console.log(`📅 ${label}`);
  console.log("=================================");

  if (freeTimeBlocks.length === 0) {
    console.log("No free time blocks found.");
    console.log("=================================\n");
    return;
  }

  freeTimeBlocks.forEach((block, index) => {
    const start = new Date(block.start);
    const end = new Date(block.end);

    const startAnnArbor = start.toLocaleString("en-US", {
      timeZone: "America/Detroit",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const endAnnArbor = end.toLocaleString("en-US", {
      timeZone: "America/Detroit",
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    console.log(
      `${index + 1}. ${startAnnArbor} → ${endAnnArbor}`
    );
  });

  console.log(
    `Total free blocks: ${freeTimeBlocks.length}`
  );

  console.log("=================================\n");
}

export function OnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile>({
  phone: "",
  healthConsiderations: [],
  allergies: [],
  foodPreferences: [],
  freeTimeBlocks: [],

  recommendationWindows: [],
  allowLocationRecommendations: true,
});
  const setPlanInfo = useCallback((info: PlanInfo) => {
  setProfile((current) => ({
    ...current,
    ...info,
  }));
}, []);

  const [calendarSession, setCalendarSession] =
    useState<CalendarSession | null>(null);

  const [lastCalendarPullAt, setLastCalendarPullAt] =
    useState<number | null>(null);

  const setPhone = useCallback((phone: string) => {
    setProfile((current) => ({
      ...current,
      phone,
    }));
  }, []);

  const setBodyInfo = useCallback((info: BodyInfo) => {
    setProfile((current) => ({
      ...current,
      ...info,
    }));
  }, []);

  const setGoalsInfo = useCallback((info: GoalsInfo) => {
    setProfile((current) => ({
      ...current,
      ...info,
    }));
  }, []);

  // const setMealWindows = useCallback(
  // (mealWindows: MealWindows) => {
  //   setProfile((current) => ({
  //     ...current,
  //     mealWindows,
  //   }));
  // },
  // []
// );

  const saveCalendarAvailability = useCallback(
  (
    session: CalendarSession,
    freeTimeBlocks: FreeTimeBlock[]
  ) => {
    debugFreeTimeBlocks(
      "FREE TIME FROM GOOGLE CALENDAR",
      freeTimeBlocks
    );

    setCalendarSession(session);
    setLastCalendarPullAt(Date.now());

    setProfile((current) => ({
      ...current,
      googleCalendarConnected: true,
      freeTimeBlocks,
    }));
  },
  []
);

  const saveFreeTimeBlocks = useCallback(
  (freeTimeBlocks: FreeTimeBlock[]) => {
    debugFreeTimeBlocks(
      "UPDATED GOOGLE CALENDAR FREE TIME",
      freeTimeBlocks
    );

    setLastCalendarPullAt(Date.now());

    setProfile((current) => ({
      ...current,
      freeTimeBlocks,
    }));
  },
  []
);

  const updateCalendarSession = useCallback(
    (session: CalendarSession) => {
      setCalendarSession(session);
    },
    []
  );

  const noteCalendarPull = useCallback((pulledAt: number) => {
    setLastCalendarPullAt(pulledAt);
  }, []);

  return (
    <OnboardingContext.Provider
  value={{
    profile,
    calendarSession,
    lastCalendarPullAt,
    setPlanInfo,
    setPhone,
    setBodyInfo,
    setGoalsInfo,
    // setMealWindows,

    saveCalendarAvailability,
    saveFreeTimeBlocks,
    updateCalendarSession,
    noteCalendarPull,
  }}
>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      "useOnboarding must be used inside OnboardingProvider"
    );
  }

  return context;
}
