import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

<<<<<<< HEAD
import {
  loadProfile,
} from "../services/session";
=======
import AsyncStorage from "@react-native-async-storage/async-storage";
>>>>>>> origin/main

import { FoodPreference } from "../constants/foodPreferences";

import { CalendarSession } from "../types/CalendarSession";

import {
  FreeTimeBlock,
  Gender,
  RecommendationWindow,
  UserProfile,
} from "../types/UserProfile";

/* ============================================ */
/* LOCAL STORAGE KEYS                           */
/* ============================================ */

const PROFILE_STORAGE_KEY =
  "@maize/user-profile";

const LAST_CALENDAR_PULL_KEY =
  "@maize/last-calendar-pull";

const ONBOARDING_COMPLETE_KEY =
  "@maize/onboarding-complete";

/* ============================================ */
/* TYPES                                        */
/* ============================================ */

type PlanInfo = {
  recommendationWindows:
    RecommendationWindow[];

  allowLocationRecommendations:
    boolean;
};

type BodyInfo = {
  heightFeet: number;

  heightInches: number;

  weightLbs: number;

  age: number;

  gender: Gender;

  healthConsiderations:
    string[];

  allergies:
    string[];
};

type GoalsInfo = {
  calorieGoal: number;

  calorieGoalIsCustom:
    boolean;

  foodPreferences:
    FoodPreference[];
};

type OnboardingContextType = {
<<<<<<< HEAD
  profile: UserProfile;
  calendarSession: CalendarSession | null;
  lastCalendarPullAt: number | null;
  sessionLoading: boolean;
=======
  profile:
    UserProfile;
>>>>>>> origin/main

  /*
   * False while AsyncStorage is restoring
   * the saved profile.
   */
  hydrated:
    boolean;

  calendarSession:
    CalendarSession | null;

  lastCalendarPullAt:
    number | null;

  setPlanInfo:
    (info: PlanInfo) => void;

  setPhone:
    (phone: string) => void;

  setBodyInfo:
    (info: BodyInfo) => void;

  setGoalsInfo:
    (info: GoalsInfo) => void;

  /*
   * Useful for your Profile page.
   *
   * This lets you update any UserProfile
   * property without needing a separate
   * setter for every field.
   */
  updateProfile:
    (
      info:
        Partial<UserProfile>
    ) => void;

  saveCalendarAvailability: (
    session:
      CalendarSession,

    freeTimeBlocks:
      FreeTimeBlock[]
  ) => void;

  saveFreeTimeBlocks:
    (
      freeTimeBlocks:
        FreeTimeBlock[]
    ) => void;

  updateCalendarSession:
    (
      session:
        CalendarSession
    ) => void;

  noteCalendarPull:
    (
      pulledAt:
        number
    ) => void;

  /*
   * Call this after "Build my plan"
   * succeeds.
   */
  markOnboardingComplete:
    () => Promise<void>;

  /*
   * Useful later for logout/reset.
   */
  clearLocalProfile:
    () => Promise<void>;
};

/* ============================================ */
/* DEFAULT PROFILE                              */
/* ============================================ */

const DEFAULT_PROFILE:
  UserProfile = {
  phone: "",

  healthConsiderations:
    [],

  allergies:
    [],

  foodPreferences:
    [],

  freeTimeBlocks:
    [],

  recommendationWindows:
    [],

  allowLocationRecommendations:
    true,
};

/* ============================================ */
/* CONTEXT                                      */
/* ============================================ */

const OnboardingContext =
  createContext<
    OnboardingContextType | undefined
  >(undefined);

/* ============================================ */
/* DEBUG CALENDAR                               */
/* ============================================ */

function debugFreeTimeBlocks(
  label:
    string,

  freeTimeBlocks:
    FreeTimeBlock[]
) {
  console.log(
    "\n================================="
  );

  console.log(
    `📅 ${label}`
  );

  console.log(
    "================================="
  );

  if (
    freeTimeBlocks.length ===
    0
  ) {
    console.log(
      "No free time blocks found."
    );

    console.log(
      "=================================\n"
    );

    return;
  }

  freeTimeBlocks.forEach(
    (
      block,
      index
    ) => {
      const start =
        new Date(
          block.start
        );

      const end =
        new Date(
          block.end
        );

      const startAnnArbor =
        start.toLocaleString(
          "en-US",
          {
            timeZone:
              "America/Detroit",

            weekday:
              "short",

            month:
              "short",

            day:
              "numeric",

            hour:
              "numeric",

            minute:
              "2-digit",

            hour12:
              true,
          }
        );

      const endAnnArbor =
        end.toLocaleString(
          "en-US",
          {
            timeZone:
              "America/Detroit",

            weekday:
              "short",

            month:
              "short",

            day:
              "numeric",

            hour:
              "numeric",

            minute:
              "2-digit",

            hour12:
              true,
          }
        );

      console.log(
        `${index + 1}. ${startAnnArbor} → ${endAnnArbor}`
      );
    }
  );

  console.log(
    `Total free blocks: ${freeTimeBlocks.length}`
  );

  console.log(
    "=================================\n"
  );
}

/* ============================================ */
/* PROVIDER                                     */
/* ============================================ */

export function OnboardingProvider({
  children,
}: {
  children:
    ReactNode;
}) {
<<<<<<< HEAD
  const [profile, setProfile] = useState<UserProfile>({
  phone: "",
  healthConsiderations: [],
  allergies: [],
  foodPreferences: [],
  freeTimeBlocks: [],

  recommendationWindows: [],
  allowLocationRecommendations: true,
  
});
  const [sessionLoading, setSessionLoading] =
  useState(true);
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

  useEffect(() => {
  async function restoreProfile() {
    try {
      const savedProfile =
        await loadProfile();

      if (savedProfile) {
        console.log(
          "RESTORED USER PROFILE:"
        );

        console.log(
          JSON.stringify(
            savedProfile,
            null,
            2
          )
        );

        setProfile(savedProfile);
      }
    } catch (error) {
      console.error(
        "FAILED TO RESTORE PROFILE:",
        error
      );
    } finally {
      setSessionLoading(false);
    }
  }

  void restoreProfile();
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
=======
  const [
    profile,
    setProfile,
  ] =
    useState<UserProfile>(
      DEFAULT_PROFILE
>>>>>>> origin/main
    );

  /*
   * Prevents the initial empty profile
   * from overwriting saved data before
   * AsyncStorage finishes loading.
   */
  const [
    hydrated,
    setHydrated,
  ] =
    useState(false);

  const [
    calendarSession,
    setCalendarSession,
  ] =
    useState<
      CalendarSession | null
    >(null);

  const [
    lastCalendarPullAt,
    setLastCalendarPullAt,
  ] =
    useState<
      number | null
    >(null);

  /* ========================================== */
  /* RESTORE LOCAL DATA                         */
  /* ========================================== */

  useEffect(() => {
    async function restoreLocalData() {
      try {
        console.log(
          "RESTORING MAIZE PROFILE..."
        );

        const [
          savedProfile,
          savedCalendarPull,
        ] =
          await Promise.all([
            AsyncStorage.getItem(
              PROFILE_STORAGE_KEY
            ),

            AsyncStorage.getItem(
              LAST_CALENDAR_PULL_KEY
            ),
          ]);

        if (
          savedProfile
        ) {
          const parsedProfile =
            JSON.parse(
              savedProfile
            ) as UserProfile;

          /*
           * Merge with defaults so newly-added
           * UserProfile properties still have
           * sensible values.
           */
          const restoredProfile:
            UserProfile = {
            ...DEFAULT_PROFILE,

            ...parsedProfile,

            healthConsiderations:
              parsedProfile
                .healthConsiderations ??
              [],

            allergies:
              parsedProfile
                .allergies ??
              [],

            foodPreferences:
              parsedProfile
                .foodPreferences ??
              [],

            freeTimeBlocks:
              parsedProfile
                .freeTimeBlocks ??
              [],

            recommendationWindows:
              parsedProfile
                .recommendationWindows ??
              [],

            allowLocationRecommendations:
              parsedProfile
                .allowLocationRecommendations ??
              true,
          };

          setProfile(
            restoredProfile
          );

          console.log(
            "✅ PROFILE RESTORED"
          );

          console.log(
            JSON.stringify(
              restoredProfile,
              null,
              2
            )
          );
        } else {
          console.log(
            "No saved profile found."
          );
        }

        if (
          savedCalendarPull
        ) {
          const parsed =
            Number(
              savedCalendarPull
            );

          if (
            !Number.isNaN(
              parsed
            )
          ) {
            setLastCalendarPullAt(
              parsed
            );
          }
        }
      } catch (
        error
      ) {
        console.error(
          "PROFILE RESTORE ERROR:",
          error
        );
      } finally {
        /*
         * Only start automatic saving
         * after restore has completed.
         */
        setHydrated(
          true
        );
      }
    }

    restoreLocalData();
  }, []);

  /* ========================================== */
  /* AUTOMATIC PROFILE SAVE                     */
  /* ========================================== */

  useEffect(() => {
    if (
      !hydrated
    ) {
      return;
    }

    async function persistProfile() {
      try {
        await AsyncStorage.setItem(
          PROFILE_STORAGE_KEY,

          JSON.stringify(
            profile
          )
        );

        console.log(
          "💾 MAIZE PROFILE SAVED LOCALLY"
        );
      } catch (
        error
      ) {
        console.error(
          "PROFILE SAVE ERROR:",
          error
        );
      }
    }

    persistProfile();
  }, [
    profile,
    hydrated,
  ]);

  /* ========================================== */
  /* AUTOMATIC CALENDAR PULL SAVE               */
  /* ========================================== */

  useEffect(() => {
    if (
      !hydrated
    ) {
      return;
    }

    async function persistLastPull() {
      try {
        if (
          lastCalendarPullAt ===
          null
        ) {
          await AsyncStorage.removeItem(
            LAST_CALENDAR_PULL_KEY
          );

          return;
        }

        await AsyncStorage.setItem(
          LAST_CALENDAR_PULL_KEY,

          String(
            lastCalendarPullAt
          )
        );
      } catch (
        error
      ) {
        console.error(
          "CALENDAR PULL SAVE ERROR:",
          error
        );
      }
    }

    persistLastPull();
  }, [
    lastCalendarPullAt,
    hydrated,
  ]);

  /* ========================================== */
  /* GENERIC PROFILE UPDATE                     */
  /* ========================================== */

  const updateProfile =
    useCallback(
      (
        info:
          Partial<UserProfile>
      ) => {
        setProfile(
          (current) => ({
            ...current,
            ...info,
          })
        );
      },
      []
    );

  /* ========================================== */
  /* PHONE                                      */
  /* ========================================== */

  const setPhone =
    useCallback(
      (
        phone:
          string
      ) => {
        setProfile(
          (current) => ({
            ...current,

            phone,
          })
        );
      },
      []
    );

  /* ========================================== */
  /* BODY INFORMATION                           */
  /* ========================================== */

  const setBodyInfo =
    useCallback(
      (
        info:
          BodyInfo
      ) => {
        setProfile(
          (current) => ({
            ...current,

            ...info,
          })
        );
      },
      []
    );

  /* ========================================== */
  /* GOALS                                      */
  /* ========================================== */

  const setGoalsInfo =
    useCallback(
      (
        info:
          GoalsInfo
      ) => {
        setProfile(
          (current) => ({
            ...current,

            ...info,
          })
        );
      },
      []
    );

  /* ========================================== */
  /* PLAN                                       */
  /* ========================================== */

  const setPlanInfo =
    useCallback(
      (
        info:
          PlanInfo
      ) => {
        setProfile(
          (current) => ({
            ...current,

            ...info,
          })
        );
      },
      []
    );

  /* ========================================== */
  /* GOOGLE CALENDAR                            */
  /* ========================================== */

  const saveCalendarAvailability =
    useCallback(
      (
        session:
          CalendarSession,

        freeTimeBlocks:
          FreeTimeBlock[]
      ) => {
        debugFreeTimeBlocks(
          "FREE TIME FROM GOOGLE CALENDAR",

          freeTimeBlocks
        );

        /*
         * Keep the OAuth/session object in memory.
         *
         * Do NOT put access tokens into
         * AsyncStorage.
         */
        setCalendarSession(
          session
        );

        setLastCalendarPullAt(
          Date.now()
        );

        /*
         * The useful calendar-derived data IS
         * stored in profile, therefore it gets
         * persisted automatically.
         */
        setProfile(
          (current) => ({
            ...current,

            googleCalendarConnected:
              true,

            freeTimeBlocks,
          })
        );
      },
      []
    );

  const saveFreeTimeBlocks =
    useCallback(
      (
        freeTimeBlocks:
          FreeTimeBlock[]
      ) => {
        debugFreeTimeBlocks(
          "UPDATED GOOGLE CALENDAR FREE TIME",

          freeTimeBlocks
        );

        setLastCalendarPullAt(
          Date.now()
        );

        setProfile(
          (current) => ({
            ...current,

            freeTimeBlocks,
          })
        );
      },
      []
    );

  const updateCalendarSession =
    useCallback(
      (
        session:
          CalendarSession
      ) => {
        /*
         * Keep authentication tokens in memory.
         *
         * If you later need persistent Google
         * login, use expo-secure-store instead
         * of AsyncStorage.
         */
        setCalendarSession(
          session
        );
      },
      []
    );

  const noteCalendarPull =
    useCallback(
      (
        pulledAt:
          number
      ) => {
        setLastCalendarPullAt(
          pulledAt
        );
      },
      []
    );

  /* ========================================== */
  /* ONBOARDING COMPLETE                        */
  /* ========================================== */

  const markOnboardingComplete =
    useCallback(
      async () => {
        try {
          await AsyncStorage.setItem(
            ONBOARDING_COMPLETE_KEY,
            "true"
          );

          /*
           * Explicitly persist the current
           * profile too.
           */
          await AsyncStorage.setItem(
            PROFILE_STORAGE_KEY,

            JSON.stringify(
              profile
            )
          );

          console.log(
            "✅ ONBOARDING MARKED COMPLETE"
          );
        } catch (
          error
        ) {
          console.error(
            "ONBOARDING SAVE ERROR:",
            error
          );
        }
      },
      [
        profile,
      ]
    );

  /* ========================================== */
  /* CLEAR LOCAL PROFILE                        */
  /* ========================================== */

  const clearLocalProfile =
    useCallback(
      async () => {
        try {
          await AsyncStorage.multiRemove([
            PROFILE_STORAGE_KEY,

            LAST_CALENDAR_PULL_KEY,

            ONBOARDING_COMPLETE_KEY,
          ]);

          setProfile(
            DEFAULT_PROFILE
          );

          setCalendarSession(
            null
          );

          setLastCalendarPullAt(
            null
          );

          console.log(
            "LOCAL MAIZE PROFILE CLEARED"
          );
        } catch (
          error
        ) {
          console.error(
            "PROFILE CLEAR ERROR:",
            error
          );
        }
      },
      []
    );

  /* ========================================== */
  /* PROVIDER                                   */
  /* ========================================== */

  return (
    <OnboardingContext.Provider
<<<<<<< HEAD
  value={{
    profile,
    sessionLoading,

    calendarSession,
    lastCalendarPullAt,

    setPhone,
    setBodyInfo,
    setGoalsInfo,
    setPlanInfo,
=======
      value={{
        profile,
>>>>>>> origin/main

        hydrated,

        calendarSession,

        lastCalendarPullAt,

        setPlanInfo,

        setPhone,

        setBodyInfo,

        setGoalsInfo,

        updateProfile,

        saveCalendarAvailability,

        saveFreeTimeBlocks,

        updateCalendarSession,

        noteCalendarPull,

        markOnboardingComplete,

        clearLocalProfile,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

/* ============================================ */
/* HOOK                                         */
/* ============================================ */

export function useOnboarding() {
  const context =
    useContext(
      OnboardingContext
    );

  if (
    !context
  ) {
    throw new Error(
      "useOnboarding must be used inside OnboardingProvider"
    );
  }

  return context;
}