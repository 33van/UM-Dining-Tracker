import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  colors,
} from "../../constants/theme";

import {
  API_URL,
} from "../../services/api";

import {
  useOnboarding,
} from "../../context/OnboardingContext";

/* ============================================ */
/* TYPES                                        */
/* ============================================ */

type DiningHallSlug =
  | "bursley"
  | "east-quad"
  | "markley"
  | "mosher-jordan"
  | "north-quad"
  | "south-quad"
  | "twigs-at-oxford"
  | "wolverine-village-dining-hall";

type DiningHallOption = {
  slug: DiningHallSlug;
  name: string;
};

type CarbonLevel =
  | "low"
  | "medium"
  | "high"
  | "unknown";

type DiningMenuItem = {
  meal: string;

  mealTime: string;

  name: string;

  calories?: number | undefined;

  totalFatG?: number | undefined;

  saturatedFatG?: number | undefined;

  transFatG?: number | undefined;

  proteinG?: number | undefined;

  sugarG?: number | undefined;

  cholesterolMg?: number | undefined;

  sodiumMg?: number | undefined;

  carbsG?: number | undefined;

  fiberG?: number | undefined;

  calciumPercent?: number | undefined;

  ironPercent?: number | undefined;

  vitaminAPercent?: number | undefined;

  vitaminCPercent?: number | undefined;

  allergens: string[];

  traits: string[];
};

type SelectableDiningItem =
  DiningMenuItem & {
    id: string;
  };

type LoggedDiningItem = {
  id: string;

  menuItem: DiningMenuItem;

  hall: DiningHallSlug;

  hallName: string;

  servings: number;
};

type NutrientKey =
  | "proteinG"
  | "carbsG"
  | "fiberG"
  | "ironPercent"
  | "vitaminAPercent"
  | "vitaminCPercent"
  | "cholesterolMg"
  | "calciumPercent"
  | "sugarG"
  | "sodiumMg"
  | "totalFatG";

type NutrientConfig = {
  key: NutrientKey;

  label: string;

  unit: string;

  target: number;
};

type PickerScreen =
  | "menu"
  | "nutrients";

type CarbonSummary = {
  level: CarbonLevel;
  score: number;

  low: number;

  medium: number;

  high: number;

  unknown: number;

  knownServings: number;

  totalServings: number;
};

/* ============================================ */
/* DINING HALLS                                 */
/* ============================================ */

const DINING_HALLS: DiningHallOption[] = [
  {
    slug: "bursley",
    name: "Bursley",
  },

  {
    slug: "east-quad",
    name: "East Quad",
  },

  {
    slug: "markley",
    name: "Markley",
  },

  {
    slug: "mosher-jordan",
    name: "Mosher-Jordan",
  },

  {
    slug: "north-quad",
    name: "North Quad",
  },

  {
    slug: "south-quad",
    name: "South Quad",
  },

  {
    slug: "twigs-at-oxford",
    name: "Twigs at Oxford",
  },

  {
    slug:
      "wolverine-village-dining-hall",

    name:
      "Wolverine Village",
  },
];

/* ============================================ */
/* NUTRIENT OPTIONS                             */
/* ============================================ */

const NUTRIENT_OPTIONS: NutrientConfig[] = [
  {
    key: "proteinG",
    label: "Protein",
    unit: "g",
    target: 112,
  },

  {
    key: "carbsG",
    label: "Carbs",
    unit: "g",
    target: 265,
  },

  {
    key: "fiberG",
    label: "Fiber",
    unit: "g",
    target: 30,
  },

  {
    key: "ironPercent",
    label: "Iron",
    unit: "%",
    target: 100,
  },

  {
    key: "vitaminAPercent",
    label: "Vitamin A",
    unit: "%",
    target: 100,
  },

  {
    key: "vitaminCPercent",
    label: "Vitamin C",
    unit: "%",
    target: 100,
  },

  {
    key: "cholesterolMg",
    label: "Cholesterol",
    unit: "mg",
    target: 300,
  },

  {
    key: "calciumPercent",
    label: "Calcium",
    unit: "%",
    target: 100,
  },

  {
    key: "sugarG",
    label: "Sugar",
    unit: "g",
    target: 50,
  },

  {
    key: "sodiumMg",
    label: "Sodium",
    unit: "mg",
    target: 2300,
  },

  {
    key: "totalFatG",
    label: "Total Fat",
    unit: "g",
    target: 78,
  },
];

const DEFAULT_VISIBLE_NUTRIENTS: NutrientKey[] = [
  "proteinG",
  "carbsG",
  "fiberG",
  "ironPercent",
  "vitaminAPercent",
  "vitaminCPercent",
];

/* ============================================ */
/* HELPERS                                      */
/* ============================================ */

function todayDateString() {
  const today =
    new Date();

  const year =
    today.getFullYear();

  const month =
    String(
      today.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      today.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}

function getNutrientValue(
  item: DiningMenuItem,
  key: NutrientKey
): number | undefined {
  return item[key];
}

function totalNutrient(
  loggedItems: LoggedDiningItem[],
  key: NutrientKey
): number {
  let total = 0;

  for (const logged of loggedItems) {
    const value =
      logged.menuItem[key];

    if (
      typeof value === "number" &&
      Number.isFinite(value)
    ) {
      total +=
        value * logged.servings;
    }
  }

  return total;
}

function formatNumber(
  value: number
) {
  if (
    Number.isInteger(
      value
    )
  ) {
    return String(
      value
    );
  }

  return value.toFixed(
    1
  );
}

function formatNutrientValue(
  value: number | null,
  unit: string
) {
  if (
    value === null
  ) {
    return "—";
  }

  return `${formatNumber(
    value
  )}${unit}`;
}

/* ============================================ */
/* CARBON                                       */
/* ============================================ */

function getCarbonLevel(
  item: DiningMenuItem
): CarbonLevel {
  const traits =
    item.traits.map(
      (trait) =>
        trait
          .trim()
          .toLowerCase()
    );

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint low"
        )
    )
  ) {
    return "low";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint medium"
        )
    )
  ) {
    return "medium";
  }

  if (
    traits.some(
      (trait) =>
        trait.includes(
          "carbon footprint high"
        )
    )
  ) {
    return "high";
  }

  return "unknown";
}

function getDailyCarbonSummary(
  loggedItems: LoggedDiningItem[]
): CarbonSummary {
  let low = 0;
  let medium = 0;
  let high = 0;
  let unknown = 0;

  /*
   * Count each serving according to
   * Michigan Dining's carbon label.
   */
  for (const logged of loggedItems) {
    const level =
      getCarbonLevel(
        logged.menuItem
      );

    if (level === "low") {
      low += logged.servings;
    } else if (
      level === "medium"
    ) {
      medium +=
        logged.servings;
    } else if (
      level === "high"
    ) {
      high +=
        logged.servings;
    } else {
      unknown +=
        logged.servings;
    }
  }

  const knownServings =
    low +
    medium +
    high;

  const totalServings =
    knownServings +
    unknown;

  /*
   * Continuous carbon scale:
   *
   * LOW    = 0
   * MEDIUM = 50
   * HIGH   = 100
   *
   * Example:
   *
   * 9 low + 1 high
   * = (9×0 + 1×100) / 10
   * = 10
   *
   * Still green, but shifted toward
   * the yellow side.
   */
  let score = 0;

  let level:
    CarbonLevel =
    "unknown";

  if (knownServings > 0) {
    score =
      (
        low * 0 +
        medium * 50 +
        high * 100
      ) /
      knownServings;

    if (score < 35) {
      level = "low";
    } else if (
      score < 70
    ) {
      level = "medium";
    } else {
      level = "high";
    }
  }

  return {
    level,
    score,

    low,
    medium,
    high,
    unknown,

    knownServings,
    totalServings,
  };
}

function carbonLabel(
  level: CarbonLevel
) {
  if (
    level === "unknown"
  ) {
    return "—";
  }

  return level.toUpperCase();
}
function calculateDailyCalorieGoal(profile: {
  weightLbs?: number;
  heightFeet?: number;
  heightInches?: number;
  age?: number;
  gender?: string;
  calorieGoal?: number;
  calorieGoalIsCustom?: boolean;
}): number {
  /*
   * If the user explicitly chose their
   * own calorie target, preserve it.
   */
  if (
    profile.calorieGoalIsCustom &&
    typeof profile.calorieGoal === "number"
  ) {
    return profile.calorieGoal;
  }

  const {
    weightLbs,
    heightFeet,
    heightInches,
    age,
    gender,
  } = profile;

  /*
   * Keep the existing fallback if
   * onboarding data is incomplete.
   */
  if (
    typeof weightLbs !== "number" ||
    typeof heightFeet !== "number" ||
    typeof heightInches !== "number" ||
    typeof age !== "number"
  ) {
    return profile.calorieGoal ?? 2150;
  }

  /*
   * Convert imperial onboarding values
   * to metric.
   */
  const weightKg =
    weightLbs * 0.453592;

  const totalHeightInches =
    heightFeet * 12 +
    heightInches;

  const heightCm =
    totalHeightInches * 2.54;

  /*
   * Mifflin-St Jeor BMR.
   */
  let bmr =
    10 * weightKg +
    6.25 * heightCm -
    5 * age;

  if (
    gender
      ?.trim()
      .toLowerCase() === "man"
  ) {
    bmr += 5;
  } else if (
    gender
      ?.trim()
      .toLowerCase() === "woman"
  ) {
    bmr -= 161;
  }

  /*
   * Current app doesn't appear to have
   * an activity multiplier available here,
   * so use a moderate baseline.
   */
  const maintenanceCalories =
    bmr * 1.55;

  return Math.round(
    maintenanceCalories
  );
}
/* ============================================ */
/* DASHBOARD                                    */
/* ============================================ */

export default function DashboardScreen() {
  const {
    profile,
  } =
    useOnboarding();

  const calorieGoal =
  calculateDailyCalorieGoal(
    profile
  );
  const [
    showDiningPicker,
    setShowDiningPicker,
  ] =
    useState(false);

  const [
    pickerStartScreen,
    setPickerStartScreen,
  ] =
    useState<PickerScreen>(
      "menu"
    );

  const [
    loggedItems,
    setLoggedItems,
  ] =
    useState<
      LoggedDiningItem[]
    >([]);

  const [
    visibleNutrients,
    setVisibleNutrients,
  ] =
    useState<
      NutrientKey[]
    >(
      DEFAULT_VISIBLE_NUTRIENTS
    );

  const [
  recommendationLoading,
  setRecommendationLoading,
] = useState(false);

const [
  recommendedItems,
  setRecommendedItems,
] = useState<
  Array<{
    name: string;
    servings: number;
  }>
>([]);

  /* ========================================== */
  /* CALORIES                                   */
  /* ========================================== */

  const caloriesConsumed =
    useMemo(
      () =>
        loggedItems.reduce(
          (
            total,
            logged
          ) =>
            total +
            (
              logged
                .menuItem
                .calories ??
              0
            ) *
              logged.servings,

          0
        ),

      [
        loggedItems,
      ]
    );

  const caloriesLeft =
    Math.max(
      calorieGoal -
        caloriesConsumed,

      
    );

  const caloriePercent =
    Math.min(
      Math.round(
        (
          caloriesConsumed /
          calorieGoal
        ) *
          100
      ),

      100
    );

  /* ========================================== */
  /* CARBON                                     */
  /* ========================================== */

  const carbonSummary =
    useMemo(
      () =>
        getDailyCarbonSummary(
          loggedItems
        ),

      [
        loggedItems,
      ]
    );

  /* ========================================== */
  /* NUTRIENTS                                  */
  /* ========================================== */
/* ========================================== */
/* NUTRIENTS                                  */
/* ========================================== */

const nutrientTotals =
  useMemo<
    Record<NutrientKey, number>
  >(() => {
    return {
      proteinG:
        totalNutrient(
          loggedItems,
          "proteinG"
        ),

      carbsG:
        totalNutrient(
          loggedItems,
          "carbsG"
        ),

      fiberG:
        totalNutrient(
          loggedItems,
          "fiberG"
        ),

      ironPercent:
        totalNutrient(
          loggedItems,
          "ironPercent"
        ),

      vitaminAPercent:
        totalNutrient(
          loggedItems,
          "vitaminAPercent"
        ),

      vitaminCPercent:
        totalNutrient(
          loggedItems,
          "vitaminCPercent"
        ),

      cholesterolMg:
        totalNutrient(
          loggedItems,
          "cholesterolMg"
        ),

      calciumPercent:
        totalNutrient(
          loggedItems,
          "calciumPercent"
        ),

      sugarG:
        totalNutrient(
          loggedItems,
          "sugarG"
        ),

      sodiumMg:
        totalNutrient(
          loggedItems,
          "sodiumMg"
        ),

      totalFatG:
        totalNutrient(
          loggedItems,
          "totalFatG"
        ),
    };
  }, [loggedItems]);


/*
 * Nutrients the user chose to display
 * in the Daily Balance card.
 */
const displayedNutrients:
  NutrientConfig[] =
    NUTRIENT_OPTIONS.filter(
      (option) =>
        visibleNutrients.includes(
          option.key
        )
    );

console.log(
  "DAILY BALANCE:",
  nutrientTotals
);
  /* ========================================== */
  /* MODALS                                     */
  /* ========================================== */

  function openMealPicker() {
    setPickerStartScreen(
      "menu"
    );

    setShowDiningPicker(
      true
    );
  }

  function openNutrientPicker() {
    setPickerStartScreen(
      "nutrients"
    );

    setShowDiningPicker(
      true
    );
  }
  async function openSmartRecommendation() {
  try {
    setRecommendationLoading(true);

    const response = await fetch(
      `${API_URL}/api/recommendations/next-meal`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          hall: "south-quad",
          date: todayDateString(),
          profile,
          currentNutrition: {
            caloriesConsumed,
            calorieGoal,
            nutrients: nutrientTotals,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error ??
          "Could not generate a recommendation."
      );
    }

    setRecommendedItems(
      data.items ?? []
    );

    setPickerStartScreen("menu");
    setShowDiningPicker(true);
  } catch (error) {
    console.error(
      "SMART RECOMMENDATION ERROR:",
      error
    );

    Alert.alert(
      "Recommendation unavailable",
      error instanceof Error
        ? error.message
        : "Could not recommend a meal."
    );
  } finally {
    setRecommendationLoading(false);
  }
}

  /* ========================================== */
  /* ADD ITEMS                                  */
  /* ========================================== */

  function addDiningItems(
    incoming:
      LoggedDiningItem[]
  ) {
    console.log(
    "FOOD BEING LOGGED:",
    JSON.stringify(
      incoming,
      null,
      2
    )
  );
    setLoggedItems(
      (current) => {
        const next =
          [
            ...current,
          ];

        for (
          const newItem
          of incoming
        ) {
          const existingIndex =
            next.findIndex(
              (existing) =>
                existing.hall ===
                  newItem.hall &&
                existing
                  .menuItem
                  .name ===
                  newItem
                    .menuItem
                    .name &&
                existing
                  .menuItem
                  .meal ===
                  newItem
                    .menuItem
                    .meal
            );

          if (
            existingIndex >=
            0
          ) {
            next[
              existingIndex
            ] = {
              ...next[
                existingIndex
              ],

              servings:
                next[
                  existingIndex
                ].servings +
                newItem.servings,
            };
          } else {
            next.push(
              newItem
            );
          }
        }

        return next;
      }
    );
  }

  function changeLoggedServings(
  id: string,
  difference: number
) {
  setLoggedItems(
    (current) => {
      const updated =
        current
          .map((item) => {
            if (item.id !== id) {
              return item;
            }

            const newServings =
              Math.max(
                0,
                item.servings +
                  difference
              );

            console.log(
              "UPDATED FOOD:",
              item.menuItem.name,
              "servings:",
              newServings,
              "nutrition:",
              {
                calories:
                  item.menuItem.calories,
                proteinG:
                  item.menuItem.proteinG,
                carbsG:
                  item.menuItem.carbsG,
                fiberG:
                  item.menuItem.fiberG,
                totalFatG:
                  item.menuItem.totalFatG,
                sugarG:
                  item.menuItem.sugarG,
                sodiumMg:
                  item.menuItem.sodiumMg,
                cholesterolMg:
                  item.menuItem
                    .cholesterolMg,
                calciumPercent:
                  item.menuItem
                    .calciumPercent,
                ironPercent:
                  item.menuItem
                    .ironPercent,
                vitaminAPercent:
                  item.menuItem
                    .vitaminAPercent,
                vitaminCPercent:
                  item.menuItem
                    .vitaminCPercent,
              }
            );

            return {
              ...item,
              servings:
                newServings,
            };
          })
          .filter(
            (item) =>
              item.servings > 0
          );

      return updated;
    }
  );
}

  /* ========================================== */
  /* SCREEN                                     */
  /* ========================================== */

  return (
    <SafeAreaView
      style={
        styles.safeArea
      }
    >
      <View
        style={
          styles.screen
        }
      >
        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >
          {/* HEADER */}

          <View
            style={
              styles.topbar
            }
          >
            <Brand />

            <View
              style={
                styles.notificationButton
              }
            >
              <Text
                style={
                  styles.notificationIcon
                }
              >
                ♧
              </Text>

              <View
                style={
                  styles.notificationDot
                }
              />
            </View>
          </View>

          {/* WELCOME */}

          <View
            style={
              styles.welcome
            }
          >
            <View
              style={
                styles.welcomeCopy
              }
            >
              <Text
                style={
                  styles.date
                }
              >
                TODAY
              </Text>

              <Text
                style={
                  styles.welcomeTitle
                }
              >
                Good morning.
              </Text>

              <Text
                style={
                  styles.welcomeDescription
                }
              >
                Here's how you're fueling today.
              </Text>
            </View>

            <View
              style={
                styles.streak
              }
            >
              <Text
                style={
                  styles.streakNumber
                }
              >
                5
              </Text>

              <Text
                style={
                  styles.streakLabel
                }
              >
                day streak
              </Text>
            </View>
          </View>

          {/* ================================= */}
          {/* ENERGY + CARBON                   */}
          {/* ================================= */}

          <View
            style={
              styles.calorieCard
            }
          >
            <View
              style={
                styles.calorieCopy
              }
            >
              <View
                style={
                  styles.statusPill
                }
              >
                <View
                  style={
                    styles.statusPillDot
                  }
                />

                <Text
                  style={
                    styles.statusPillText
                  }
                >
                  TODAY
                </Text>
              </View>

              <Text
                style={
                  styles.cardTitle
                }
              >
                Today's energy
              </Text>

              <Text
                style={
                  styles.calorieDescription
                }
              >
                You have{" "}

                <Text
                  style={
                    styles.calorieDescriptionStrong
                  }
                >
                  {caloriesLeft.toLocaleString()} calories
                </Text>

                {" "}left in your daily target.
              </Text>

              <Pressable
                style={
                  styles.primaryButton
                }
                onPress={
                  openMealPicker
                }
              >
                <Text
                  style={
                    styles.primaryButtonPlus
                  }
                >
                  +
                </Text>

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Add dining food
                </Text>
              </Pressable>
            </View>

            <EnergySummary
              percent={
                caloriePercent
              }
              consumed={
                caloriesConsumed
              }
              goal={
                calorieGoal
              }
              carbonSummary={
                carbonSummary
              }
            />
          </View>

          {/* ================================= */}
          {/* CARBON BREAKDOWN                  */}
          {/* ================================= */}

          <CarbonBreakdown
            summary={
              carbonSummary
            }
          />

          {/* ================================= */}
          {/* NUTRIENTS                         */}
          {/* ================================= */}

          <View
            style={
              styles.nutrientCard
            }
          >
            <View
              style={
                styles.sectionHeading
              }
            >
              <View>
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  NUTRIENTS
                </Text>

                <Text
                  style={
                    styles.sectionHeadingTitle
                  }
                >
                  Daily balance
                </Text>
              </View>

              <Pressable
                onPress={
                  openNutrientPicker
                }
              >
                <Text
                  style={
                    styles.textButton
                  }
                >
                  Customize
                </Text>
              </Pressable>
            </View>

            <View
              style={
                styles.nutrientGrid
              }
            >
              {displayedNutrients.map(
                (
                  nutrient
                ) => {const value =
                  nutrientTotals[
                    nutrient.key
                  ];

                const percent =
                  Math.min(
                    Math.max(
                      (
                        value /
                        nutrient.target
                      ) * 100,
                      0
                    ),
                    100
                  );

                  return (
                    <View
                      key={
                        nutrient.key
                      }
                      style={
                        styles.nutrient
                      }
                    >
                      <View
                        style={
                          styles.nutrientRow
                        }
                      >
                        <Text
                          style={
                            styles.nutrientLabel
                          }
                        >
                          {
                            nutrient.label
                          }
                        </Text>

                        <Text
                          style={
                            styles.nutrientValue
                          }
                        >
                          {formatNutrientValue(
                            value,
                            nutrient.unit
                          )}

                          <Text
                            style={
                              styles.nutrientTarget
                            }
                          >
                            {" "}
                            /{" "}
                            {
                              nutrient.target
                            }
                            {
                              nutrient.unit
                            }
                          </Text>
                        </Text>
                      </View>

                      <View
                        style={
                          styles.progressTrack
                        }
                      >
                        <View
                          style={[
                            styles.progressFill,

                            {
                              width:
                                `${percent}%`,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  );
                }
              )}
            </View>
          </View>

          {/* ================================= */}
          {/* RECOMMENDATION                    */}
          {/* ================================= */}

          <View
            style={
              styles.recommendationCard
            }
          >
            <View
              style={
                styles.recommendationIcon
              }
            >
              <Text
                style={
                  styles.recommendationSparkle
                }
              >
                ✦
              </Text>
            </View>

            <View
              style={
                styles.recommendationCopy
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                SMART RECOMMENDATION
              </Text>

              <Text
                style={
                  styles.recommendationTitle
                }
              >
                Find your next meal
              </Text>

              <Text
                style={
                  styles.recommendationDescription
                }
              >
                Maize can use today's menu, your
                nutrition goals and Michigan
                Dining's carbon labels to favor
                foods that fit both your health
                and sustainability goals.
              </Text>
            </View>

            <Pressable
              style={styles.planButton}
              onPress={openSmartRecommendation}
              disabled={recommendationLoading}
            >
              {recommendationLoading ? (
                <ActivityIndicator />
              ) : (
                <Text
                  style={
                    styles.planButtonText
                  }
                >
                  +
                </Text>
              )}
            </Pressable>
            </View>

          {/* ================================= */}
          {/* TODAY'S LOG                       */}
          {/* ================================= */}

          <View
            style={
              styles.mealsSection
            }
          >
            <View
              style={
                styles.sectionHeading
              }
            >
              <View>
                <Text
                  style={
                    styles.eyebrow
                  }
                >
                  TODAY'S LOG
                </Text>

                <Text
                  style={
                    styles.sectionHeadingTitle
                  }
                >
                  Dining items
                </Text>
              </View>

              <Pressable
                style={
                  styles.addButton
                }
                onPress={
                  openMealPicker
                }
              >
                <Text
                  style={
                    styles.addButtonText
                  }
                >
                  + Add
                </Text>
              </Pressable>
            </View>

            {loggedItems.length ===
            0 ? (
              <View
                style={
                  styles.emptyMealCard
                }
              >
                <Text
                  style={
                    styles.emptyMealTitle
                  }
                >
                  Nothing logged yet
                </Text>

                <Text
                  style={
                    styles.emptyMealDescription
                  }
                >
                  Add foods from a Michigan Dining
                  menu to begin calculating your
                  calories, nutrients and carbon
                  footprint for today.
                </Text>
              </View>
            ) : (
              <View
                style={
                  styles.mealList
                }
              >
                {loggedItems.map(
                  (
                    logged
                  ) => (
                    <LoggedFoodRow
                      key={
                        logged.id
                      }
                      logged={
                        logged
                      }
                      onDecrease={() =>
                        changeLoggedServings(
                          logged.id,
                          -1
                        )
                      }
                      onIncrease={() =>
                        changeLoggedServings(
                          logged.id,
                          1
                        )
                      }
                    />
                  )
                )}
              </View>
            )}
          </View>

          <View
            style={
              styles.bottomSpacer
            }
          />
        </ScrollView>

        {/* ================================= */}
        {/* PICKER MODAL                      */}
        {/* ================================= */}

        <DiningPickerModal
          visible={
            showDiningPicker
          }
          startScreen={
            pickerStartScreen
          }
          recommendedItems={
            recommendedItems
          }
          visibleNutrients={
            visibleNutrients
          }

          dailyTotals={
            nutrientTotals
          }
          onChangeVisibleNutrients={
            setVisibleNutrients
          }
          onClose={() => {
            setShowDiningPicker(false);
            setRecommendedItems([]);
          }}
          onAddItems={(items) => {
            addDiningItems(items);

            setRecommendedItems([]);

            setShowDiningPicker(false);
          }}
                     
        />
      </View>
    </SafeAreaView>
  );
}

/* ============================================ */
/* BRAND                                        */
/* ============================================ */

function Brand() {
  return (
    <View
      style={
        styles.brand
      }
    >
      <View
        style={
          styles.brandMark
        }
      >
        <Text
          style={
            styles.brandM
          }
        >
          M
        </Text>
      </View>

      <Text
        style={
          styles.brandText
        }
      >
        maize
      </Text>
    </View>
  );
}

/* ============================================ */
/* ENERGY SUMMARY                               */
/* ============================================ */

function EnergySummary({
  percent,
  consumed,
  goal,
  carbonSummary,
}: {
  percent: number;

  consumed: number;

  goal: number;

  carbonSummary:
    CarbonSummary;
}) {
  return (
    <View
      style={
        styles.energySummary
      }
    >
      <View
        style={
          styles.ringOuter
        }
      >
        <View
          style={
            styles.ringInner
          }
        >
          <Text
            style={
              styles.ringNumber
            }
          >
            {consumed.toLocaleString()}
          </Text>

          <Text
            style={
              styles.ringLabel
            }
          >
            of{" "}
            {goal.toLocaleString()} kcal
          </Text>

          <Text
            style={
              styles.ringPercent
            }
          >
            {percent}% today
          </Text>
        </View>
      </View>

      <View
        style={
          styles.carbonBadge
        }
      >
        <Text
          style={
            styles.carbonBadgeIcon
          }
        >
          ♻
        </Text>

        <View>
          <Text
            style={
              styles.carbonBadgeEyebrow
            }
          >
            CARBON
          </Text>

          <Text
            style={[
              styles.carbonBadgeLevel,

              carbonSummary.level ===
                "low" &&
                styles.carbonLow,

              carbonSummary.level ===
                "medium" &&
                styles.carbonMedium,

              carbonSummary.level ===
                "high" &&
                styles.carbonHigh,
            ]}
          >
            {carbonLabel(
              carbonSummary.level
            )}
          </Text>
        </View>
      </View>
    </View>
  );
}

/* ============================================ */
/* CARBON BREAKDOWN                             */
/* ============================================ */

function CarbonBreakdown({
  summary,
}: {
  summary:
    CarbonSummary;
}) {
  return (
    <View
      style={
        styles.carbonCard
      }
    >
      <View
        style={
          styles.carbonCardTop
        }
      >
        <View>
          <Text
            style={
              styles.eyebrow
            }
          >
            TODAY'S CARBON FOOTPRINT
          </Text>

          <Text
            style={
              styles.carbonCardTitle
            }
          >
            {summary.level ===
            "unknown"
              ? "No carbon data yet"
              : `${summary.level
                  .charAt(0)
                  .toUpperCase()}${summary.level.slice(
                  1
                )} impact`}
          </Text>
        </View>

        <View
          style={
            styles.carbonStatusPill
          }
        >
          <Text
            style={[
              styles.carbonStatusText,

              summary.level ===
                "low" &&
                styles.carbonLow,

              summary.level ===
                "medium" &&
                styles.carbonMedium,

              summary.level ===
                "high" &&
                styles.carbonHigh,
            ]}
          >
            {carbonLabel(
              summary.level
            )}
          </Text>
        </View>
      </View>

      <View
        style={
          styles.carbonCounts
        }
      >
        <CarbonCount
          value={
            summary.low
          }
          label="LOW"
          level="low"
        />

        <CarbonCount
          value={
            summary.medium
          }
          label="MEDIUM"
          level="medium"
        />

        <CarbonCount
          value={
            summary.high
          }
          label="HIGH"
          level="high"
        />

        <CarbonCount
          value={
            summary.unknown
          }
          label="UNLABELED"
          level="unknown"
        />
      </View>

      <Text
        style={
          styles.carbonExplanation
        }
      >
        Based on Michigan Dining's Low,
        Medium and High carbon footprint
        labels for foods you logged today.
        This is a categorical impact level,
        not an estimated CO₂ mass.
      </Text>
    </View>
  );
}

function CarbonCount({
  value,
  label,
  level,
}: {
  value: number;

  label: string;

  level:
    CarbonLevel;
}) {
  return (
    <View
      style={
        styles.carbonCount
      }
    >
      <Text
        style={[
          styles.carbonCountNumber,

          level === "low" &&
            styles.carbonLow,

          level === "medium" &&
            styles.carbonMedium,

          level === "high" &&
            styles.carbonHigh,
        ]}
      >
        {value}
      </Text>

      <Text
        style={
          styles.carbonCountLabel
        }
      >
        {label}
      </Text>
    </View>
  );
}

/* ============================================ */
/* LOGGED FOOD                                  */
/* ============================================ */

function LoggedFoodRow({
  logged,
  onDecrease,
  onIncrease,
}: {
  logged:
    LoggedDiningItem;

  onDecrease:
    () => void;

  onIncrease:
    () => void;
}) {
  const calories =
    (
      logged.menuItem
        .calories ??
      0
    ) *
    logged.servings;

  const carbon =
    getCarbonLevel(
      logged.menuItem
    );

  return (
    <View
      style={
        styles.loggedFoodRow
      }
    >
      <View
        style={
          styles.loggedFoodStripe
        }
      />

      <View
        style={
          styles.loggedFoodCopy
        }
      >
        <Text
          style={
            styles.loggedFoodName
          }
        >
          {
            logged.menuItem
              .name
          }
        </Text>

        <Text
          style={
            styles.loggedFoodMeta
          }
        >
          {
            logged.hallName
          }

          {" · "}

          {
            logged.menuItem
              .meal
          }

          {" · "}

          {calories.toLocaleString()} kcal
        </Text>

        <View
          style={
            styles.loggedCarbonRow
          }
        >
          <Text
            style={
              styles.loggedCarbonLabel
            }
          >
            Carbon:
          </Text>

          <Text
            style={[
              styles.loggedCarbonValue,

              carbon === "low" &&
                styles.carbonLow,

              carbon ===
                "medium" &&
                styles.carbonMedium,

              carbon === "high" &&
                styles.carbonHigh,
            ]}
          >
            {carbonLabel(
              carbon
            )}
          </Text>
        </View>

        {logged
          .menuItem
          .allergens
          ?.length >
          0 && (
          <Text
            style={
              styles.allergenText
            }
          >
            Allergens:{" "}
            {logged
              .menuItem
              .allergens
              .join(
                ", "
              )}
          </Text>
        )}
      </View>

      <ServingControl
        value={
          logged.servings
        }
        onDecrease={
          onDecrease
        }
        onIncrease={
          onIncrease
        }
      />
    </View>
  );
}

/* ============================================ */
/* SERVINGS                                     */
/* ============================================ */

function ServingControl({
  value,
  onDecrease,
  onIncrease,
}: {
  value: number;

  onDecrease:
    () => void;

  onIncrease:
    () => void;
}) {
  return (
    <View
      style={
        styles.servingControl
      }
    >
      <Pressable
        style={[
          styles.servingButton,

          value === 0 &&
            styles.servingButtonDisabled,
        ]}
        disabled={
          value === 0
        }
        onPress={
          onDecrease
        }
      >
        <Text
          style={
            styles.servingMinus
          }
        >
          −
        </Text>
      </Pressable>

      <Text
        style={
          styles.servingCount
        }
      >
        {value}
      </Text>

      <Pressable
        style={[
          styles.servingButton,

          styles.servingPlusButton,
        ]}
        onPress={
          onIncrease
        }
      >
        <Text
          style={
            styles.servingPlus
          }
        >
          +
        </Text>
      </Pressable>
    </View>
  );
}

/* ============================================ */
/* DINING PICKER                                */
/* ============================================ */
function DiningPickerModal({
  visible,
  startScreen,
  recommendedItems,
  visibleNutrients,
  dailyTotals,
  onChangeVisibleNutrients,
  onClose,
  onAddItems,
}: {
  visible: boolean;

  startScreen: PickerScreen;

  recommendedItems: Array<{
    name: string;
    servings: number;
  }>;

  visibleNutrients:
    NutrientKey[];

  dailyTotals:
    Partial<
      Record<
        NutrientKey,
        number | null
      >
    >;

  onChangeVisibleNutrients:
    (
      value:
        NutrientKey[]
    ) => void;

  onClose:
    () => void;

  onAddItems:
    (
      items:
        LoggedDiningItem[]
    ) => void;
}) {
  const [
    screen,
    setScreen,
  ] =
    useState<PickerScreen>(
      startScreen
    );

  const [
    selectedHall,
    setSelectedHall,
  ] =
    useState<DiningHallSlug>(
      "south-quad"
    );

  const [
    showHallOptions,
    setShowHallOptions,
  ] =
    useState(false);

  const [
    menuItems,
    setMenuItems,
  ] =
    useState<
      SelectableDiningItem[]
    >([]);

  const [
    servings,
    setServings,
  ] =
    useState<
      Record<
        string,
        number
      >
    >({});

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<
      string | null
    >(null);

  useEffect(
    () => {
      if (
        visible
      ) {
        setScreen(
          startScreen
        );
      }
    },

    [
      visible,
      startScreen,
    ]
  );

  /* ========================================== */
  /* LOAD REAL CHEERIO MENU                     */
  /* ========================================== */

  useEffect(
    () => {
      if (
        !visible ||
        screen !==
          "menu"
      ) {
        return;
      }

      let cancelled =
        false;

      async function loadMenu() {
        try {
          setLoading(
            true
          );

          setError(
            null
          );

          const date =
            todayDateString();

          const url =
            `${API_URL}/api/dining/menu?hall=${selectedHall}&date=${date}`;

          console.log(
            "DINING MENU URL:",
            url
          );

          const response =
            await fetch(
              url
            );

          const raw =
            await response.text();

          let data:
            unknown;

          try {
            data =
              JSON.parse(
                raw
              );
          } catch {
            throw new Error(
              `Dining backend returned non-JSON: ${raw.slice(
                0,
                100
              )}`
            );
          }

          if (
            !response.ok
          ) {
            let message =
              "Could not load dining menu.";

            if (
              typeof data ===
                "object" &&
              data !==
                null &&
              "error" in
                data
            ) {
              const maybeError =
                (
                  data as {
                    error?: unknown;
                  }
                ).error;

              if (
                typeof maybeError ===
                "string"
              ) {
                message =
                  maybeError;
              }
            }

            throw new Error(
              message
            );
          }

          let rawItems:
            DiningMenuItem[] =
            [];

          if (
            Array.isArray(
              data
            )
          ) {
            rawItems =
              data as DiningMenuItem[];
          } else if (
            typeof data ===
              "object" &&
            data !==
              null &&
            "items" in
              data
          ) {
            const maybeItems =
              (
                data as {
                  items?: unknown;
                }
              ).items;

            if (
              Array.isArray(
                maybeItems
              )
            ) {
              rawItems =
                maybeItems as DiningMenuItem[];
            }
          }

          const items =
            rawItems.map(
              (
                item,
                index
              ) => ({
                ...item,

                allergens:
                  item.allergens ??
                  [],

                traits:
                  item.traits ??
                  [],

                id:
                  `${selectedHall}-${item.meal}-${item.name}-${index}`,
              })
            );

          if (!cancelled) {
  /*
   * Build a lookup containing Gemini's
   * recommendation ranking.
   */
  const recommendationOrder =
    new Map(
      recommendedItems.map(
        (recommendation, index) => [
          recommendation.name
            .trim()
            .toLowerCase(),
          index,
        ]
      )
    );

  /*
   * Put recommended foods at the top.
   * If Gemini returns multiple foods,
   * preserve Gemini's ranking.
   */
  const sortedItems =
    [...items].sort((a, b) => {
      const aOrder =
        recommendationOrder.get(
          a.name
            .trim()
            .toLowerCase()
        );

      const bOrder =
        recommendationOrder.get(
          b.name
            .trim()
            .toLowerCase()
        );

      if (
        aOrder !== undefined &&
        bOrder !== undefined
      ) {
        return aOrder - bOrder;
      }

      if (aOrder !== undefined) {
        return -1;
      }

      if (bOrder !== undefined) {
        return 1;
      }

      return 0;
    });

  /*
   * Show all recommendations at the top,
   * but automatically select ONLY the
   * #1 recommendation.
   */
  const recommendedServings:
    Record<string, number> = {};

  const topRecommendation =
    recommendedItems[0];

  if (topRecommendation) {
    const match =
      items.find(
        (item) =>
          item.name
            .trim()
            .toLowerCase() ===
          topRecommendation.name
            .trim()
            .toLowerCase()
      );

    if (match) {
      recommendedServings[
        match.id
      ] = 1;
    }
  }

  setMenuItems(
    sortedItems
  );

  setServings(
    recommendedServings
  );
}
        } catch (
          loadError
        ) {
          console.error(
            "DINING MENU ERROR:",
            loadError
          );

          if (
            !cancelled
          ) {
            setMenuItems(
              []
            );

            setError(
              loadError instanceof
                Error
                ? loadError.message
                : "Could not load dining menu."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(
              false
            );
          }
        }
      }

      loadMenu();

      return () => {
        cancelled =
          true;
      };
    },

    [
      visible,
      screen,
      selectedHall,
      recommendedItems,
    ]
  );

  const hall =
    DINING_HALLS.find(
      (item) =>
        item.slug ===
        selectedHall
    ) ??
    DINING_HALLS[0];

  function changeServing(
    id: string,
    difference: number
  ) {
    setServings(
      (current) => {
        const currentValue =
          current[id] ??
          0;

        const nextValue =
          Math.max(
            currentValue +
              difference,

            0
          );

        return {
          ...current,

          [id]:
            nextValue,
        };
      }
    );
  }

  const selectedItems =
    menuItems.filter(
      (item) =>
        (
          servings[
            item.id
          ] ??
          0
        ) > 0
    );

  const estimatedCalories =
    selectedItems.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          item.calories ??
          0
        ) *
          (
            servings[
              item.id
            ] ??
            0
          ),

      0
    );

  function estimatedNutrient(
    key: NutrientKey
  ) {
    let total = 0;

    let found =
      false;

    for (
      const item
      of selectedItems
    ) {
      const value =
        getNutrientValue(
          item,
          key
        );

      if (
        typeof value ===
        "number"
      ) {
        total +=
          value *
          (
            servings[
              item.id
            ] ??
            0
          );

        found = true;
      }
    }

    return found
      ? total
      : null;
  }

  function addSelected() {
    if (
      selectedItems.length ===
      0
    ) {
      Alert.alert(
        "Nothing selected",
        "Add at least one serving before continuing."
      );

      return;
    }

    const now =
      Date.now();

    const logged =
      selectedItems.map(
        (
          item,
          index
        ): LoggedDiningItem => ({
          id:
            `${now}-${index}`,

          hall:
            hall.slug,

          hallName:
            hall.name,

          servings:
            servings[
              item.id
            ] ??
            1,

          menuItem:
            item,
        })
      );

    onAddItems(
      logged
    );

    setServings(
      {}
    );
  }

  function toggleNutrient(
    key: NutrientKey
  ) {
    const selected =
      visibleNutrients.includes(
        key
      );

    if (
      selected &&
      visibleNutrients.length ===
        1
    ) {
      Alert.alert(
        "Keep one nutrient",
        "Select at least one nutrition label to display."
      );

      return;
    }

    if (
      selected
    ) {
      onChangeVisibleNutrients(
        visibleNutrients.filter(
          (item) =>
            item !== key
        )
      );

      return;
    }

    onChangeVisibleNutrients([
      ...visibleNutrients,

      key,
    ]);
  }

  function close() {
    setServings(
      {}
    );

    setShowHallOptions(
      false
    );

    onClose();
  }

  return (
    <Modal
      visible={
        visible
      }
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={
        close
      }
    >
      <SafeAreaView
        style={
          styles.pickerSafeArea
        }
      >
        {screen ===
        "nutrients" ? (
          <ScrollView
            contentContainerStyle={
              styles.nutrientPickerContent
            }
            showsVerticalScrollIndicator={
              false
            }
          >
            <View
              style={
                styles.modalHandle
              }
            />

            <Text
              style={
                styles.pickerEyebrow
              }
            >
              CUSTOMIZE TODAY
            </Text>

            <Text
              style={
                styles.pickerTitle
              }
            >
              Choose your nutrients
            </Text>

            <Text
              style={
                styles.pickerDescription
              }
            >
              Select which nutrition labels you
              want displayed in your Daily
              Balance card.
            </Text>

            <View
              style={
                styles.nutrientChoiceGrid
              }
            >
              {NUTRIENT_OPTIONS.map(
                (
                  nutrient
                ) => {
                  const selected =
                    visibleNutrients.includes(
                      nutrient.key
                    );

                  const current =
                    dailyTotals[
                      nutrient.key
                    ] ??
                    null;

                  return (
                    <Pressable
                      key={
                        nutrient.key
                      }
                      style={[
                        styles.nutrientChoice,

                        selected &&
                          styles.nutrientChoiceSelected,
                      ]}
                      onPress={() =>
                        toggleNutrient(
                          nutrient.key
                        )
                      }
                    >
                      <View
                        style={[
                          styles.checkBox,

                          selected &&
                            styles.checkBoxSelected,
                        ]}
                      >
                        {selected && (
                          <Text
                            style={
                              styles.checkText
                            }
                          >
                            ✓
                          </Text>
                        )}
                      </View>

                      <View
                        style={
                          styles.nutrientChoiceCopy
                        }
                      >
                        <Text
                          style={
                            styles.nutrientChoiceTitle
                          }
                        >
                          {
                            nutrient.label
                          }
                        </Text>

                        <Text
                          style={
                            styles.nutrientChoiceValue
                          }
                        >
                          {formatNutrientValue(
                            current,
                            nutrient.unit
                          )}

                          {" of "}

                          {
                            nutrient.target
                          }
                          {
                            nutrient.unit
                          }
                        </Text>
                      </View>
                    </Pressable>
                  );
                }
              )}
            </View>

            <Pressable
              style={
                styles.doneButton
              }
              onPress={() => {
                if (
                  startScreen ===
                  "nutrients"
                ) {
                  close();
                } else {
                  setScreen(
                    "menu"
                  );
                }
              }}
            >
              <Text
                style={
                  styles.doneButtonText
                }
              >
                Done · Show{" "}
                {
                  visibleNutrients.length
                }{" "}
                nutrients
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <View
            style={
              styles.menuPickerContainer
            }
          >
            <View
              style={
                styles.modalHandle
              }
            />

            <View
              style={
                styles.pickerHeader
              }
            >
              <View>
                <Text
                  style={
                    styles.pickerEyebrow
                  }
                >
                  UMICH DINING
                </Text>

                <Text
                  style={
                    styles.pickerTitle
                  }
                >
                  Add dining items
                </Text>
              </View>

              <Pressable
                onPress={() =>
                  setScreen(
                    "nutrients"
                  )
                }
              >
                <Text
                  style={
                    styles.configureText
                  }
                >
                  Nutrients
                </Text>
              </Pressable>
            </View>

            <Text
              style={
                styles.inputLabel
              }
            >
              DINING HALL
            </Text>

            <Pressable
              style={
                styles.hallSelector
              }
              onPress={() =>
                setShowHallOptions(
                  (
                    current
                  ) =>
                    !current
                )
              }
            >
              <Text
                style={
                  styles.hallPin
                }
              >
                ◎
              </Text>

              <Text
                style={
                  styles.hallName
                }
              >
                {
                  hall.name
                }
              </Text>

              <Text
                style={
                  styles.hallChevron
                }
              >
                {showHallOptions
                  ? "⌃"
                  : "⌄"}
              </Text>
            </Pressable>

            {showHallOptions && (
              <View
                style={
                  styles.hallOptions
                }
              >
                {DINING_HALLS.map(
                  (
                    diningHall
                  ) => (
                    <Pressable
                      key={
                        diningHall.slug
                      }
                      style={
                        styles.hallOption
                      }
                      onPress={() => {
                        setSelectedHall(
                          diningHall.slug
                        );

                        setShowHallOptions(
                          false
                        );
                      }}
                    >
                      <Text
                        style={[
                          styles.hallOptionText,

                          diningHall.slug ===
                            selectedHall &&
                            styles.hallOptionTextSelected,
                        ]}
                      >
                        {
                          diningHall.name
                        }
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            )}

            <Text
              style={
                styles.menuStatus
              }
            >
              ● Today's menu from Michigan Dining
            </Text>

            <View
              style={
                styles.availableHeader
              }
            >
              <Text
                style={
                  styles.availableHeaderText
                }
              >
                TODAY'S AVAILABLE ITEMS
              </Text>

              <Text
                style={
                  styles.availableHeaderText
                }
              >
                SERVINGS
              </Text>
            </View>

            <View
              style={
                styles.menuListShell
              }
            >
              {loading ? (
                <View
                  style={
                    styles.loadingState
                  }
                >
                  <ActivityIndicator />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Loading dining menu...
                  </Text>
                </View>
              ) : error ? (
                <View
                  style={
                    styles.loadingState
                  }
                >
                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      error
                    }
                  </Text>
                </View>
              ) : menuItems.length ===
                0 ? (
                <View
                  style={
                    styles.loadingState
                  }
                >
                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    No menu items were returned for
                    this dining hall today.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  showsVerticalScrollIndicator={
                    true
                  }
                >
                  {menuItems.map(
                    (
                      item
                    ) => {
                      const count =
                        servings[
                          item.id
                        ] ??
                        0;

                      const carbon =
                        getCarbonLevel(
                          item
                        );

                      return (
                        <View
                          key={
                            item.id
                          }
                          style={
                            styles.menuItemRow
                          }
                        >
                          <View
                            style={
                              styles.menuItemStripe
                            }
                          />

                          <View
                            style={
                              styles.menuItemCopy
                            }
                          >
                            <Text
                              style={
                                styles.menuItemName
                              }
                            >
                              {
                                item.name
                              }
                            </Text>

                            <View
                              style={
                                styles.menuMetaRow
                              }
                            >
                              <View
                                style={
                                  styles.menuItemBadge
                                }
                              >
                                <Text
                                  style={
                                    styles.menuItemBadgeText
                                  }
                                >
                                  {
                                    item.meal
                                  }

                                  {" · "}

                                  {item.calories ??
                                    "—"}{" "}
                                  kcal
                                </Text>
                              </View>

                              <Text
                                style={[
                                  styles.menuCarbonText,

                                  carbon ===
                                    "low" &&
                                    styles.carbonLow,

                                  carbon ===
                                    "medium" &&
                                    styles.carbonMedium,

                                  carbon ===
                                    "high" &&
                                    styles.carbonHigh,
                                ]}
                              >
                                ♻{" "}
                                {carbonLabel(
                                  carbon
                                )}
                              </Text>
                            </View>

                            {item
                              .mealTime && (
                              <Text
                                style={
                                  styles.mealTimeText
                                }
                              >
                                {
                                  item.mealTime
                                }
                              </Text>
                            )}
                          </View>

                          <ServingControl
                            value={
                              count
                            }
                            onDecrease={() =>
                              changeServing(
                                item.id,
                                -1
                              )
                            }
                            onIncrease={() =>
                              changeServing(
                                item.id,
                                1
                              )
                            }
                          />
                        </View>
                      );
                    }
                  )}
                </ScrollView>
              )}
            </View>

            {/* ESTIMATED NUTRITION */}

            <View
              style={
                styles.estimatedCard
              }
            >
              <View
                style={
                  styles.estimatedHeader
                }
              >
                <Text
                  style={
                    styles.estimatedLabel
                  }
                >
                  ✦ ESTIMATED NUTRITION
                </Text>

                <Text
                  style={
                    styles.estimatedCalories
                  }
                >
                  {estimatedCalories.toLocaleString()} kcal
                </Text>
              </View>

              <View
                style={
                  styles.estimatedNutrients
                }
              >
                {visibleNutrients
                  .slice(
                    0,
                    6
                  )
                  .map(
                    (
                      key
                    ) => {
                      const config =
                        NUTRIENT_OPTIONS.find(
                          (
                            option
                          ) =>
                            option.key ===
                            key
                        );

                      if (
                        !config
                      ) {
                        return null;
                      }

                      const value =
                        estimatedNutrient(
                          key
                        );

                      return (
                        <View
                          key={
                            key
                          }
                          style={
                            styles.estimatedNutrient
                          }
                        >
                          <Text
                            style={
                              styles.estimatedNutrientLabel
                            }
                          >
                            {
                              config.label
                            }
                          </Text>

                          <Text
                            style={
                              styles.estimatedNutrientValue
                            }
                          >
                            {formatNutrientValue(
                              value,
                              config.unit
                            )}
                          </Text>
                        </View>
                      );
                    }
                  )}
              </View>

              <Text
                style={
                  styles.estimatedHelp
                }
              >
                Totals are calculated from Michigan
                Dining's parsed nutrition data and
                your selected serving amounts.
              </Text>
            </View>

            <Pressable
              style={[
                styles.addSelectedButton,

                selectedItems.length ===
                  0 &&
                  styles.addSelectedButtonDisabled,
              ]}
              disabled={
                selectedItems.length ===
                0
              }
              onPress={
                addSelected
              }
            >
              <Text
                style={
                  styles.addSelectedButtonText
                }
              >
                Add{" "}
                {selectedItems.length}{" "}
                {selectedItems.length ===
                1
                  ? "item"
                  : "items"}{" "}
                to today's log
              </Text>
            </Pressable>

            <Pressable
              style={
                styles.closePickerButton
              }
              onPress={
                close
              }
            >
              <Text
                style={
                  styles.closePickerText
                }
              >
                Cancel
              </Text>
            </Pressable>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

/* ============================================ */
/* STYLES                                       */
/* ============================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        "#F8F8F4",
    },

    screen: {
      flex: 1,

      backgroundColor:
        "#F8F8F4",
    },

    scroll: {
      flex: 1,
    },

    scrollContent: {
      paddingHorizontal:
        22,

      paddingBottom:
        110,
    },

    /* HEADER */

    topbar: {
      height: 68,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    brand: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 9,
    },

    brandMark: {
      width: 28,

      height: 28,

      borderRadius: 7,

      backgroundColor:
        colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",

      transform: [
        {
          rotate:
            "-4deg",
        },
      ],
    },

    brandM: {
      color:
        colors.maize,

      fontSize: 15,

      fontWeight:
        "900",
    },

    brandText: {
      color:
        colors.navy,

      fontSize: 21,

      fontWeight:
        "800",

      letterSpacing:
        -0.8,
    },

    notificationButton: {
      width: 38,

      height: 38,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 19,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    notificationIcon: {
      color:
        colors.navy,

      fontSize: 18,
    },

    notificationDot: {
      position:
        "absolute",

      top: 8,

      right: 8,

      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        "#D7B900",
    },

    /* WELCOME */

    welcome: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      paddingTop: 20,

      paddingBottom: 23,
    },

    welcomeCopy: {
      flex: 1,
    },

    date: {
      color:
        "#7B828B",

      fontSize: 8,

      fontWeight:
        "700",

      letterSpacing:
        1.25,
    },

    welcomeTitle: {
      marginTop: 5,

      color:
        colors.navy,

      fontSize: 28,

      lineHeight: 33,

      fontWeight:
        "800",

      letterSpacing:
        -1,
    },

    welcomeDescription: {
      marginTop: 4,

      color:
        colors.muted,

      fontSize: 11,
    },

    streak: {
      width: 67,

      height: 67,

      borderWidth: 1,

      borderColor:
        "#E4D991",

      borderRadius: 34,

      backgroundColor:
        "#FFF9D9",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    streakNumber: {
      color:
        colors.navy,

      fontSize: 20,

      fontWeight:
        "800",
    },

    streakLabel: {
      color:
        "#827850",

      fontSize: 7,
    },

    /* ENERGY */

    calorieCard: {
      minHeight: 198,

      flexDirection:
        "row",

      alignItems:
        "center",

      padding: 18,

      borderRadius: 18,

      backgroundColor:
        colors.navy,
    },

    calorieCopy: {
      flex: 1,

      paddingRight: 10,
    },

    statusPill: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      paddingHorizontal:
        8,

      paddingVertical: 5,

      borderRadius: 8,

      backgroundColor:
        "#304158",
    },

    statusPillDot: {
      width: 6,

      height: 6,

      borderRadius: 3,

      backgroundColor:
        "#8BC7A5",
    },

    statusPillText: {
      color:
        "#B9E2CA",

      fontSize: 7,

      fontWeight:
        "800",
    },

    cardTitle: {
      marginTop: 12,

      color:
        "#FFFFFF",

      fontSize: 20,

      fontWeight:
        "800",
    },

    calorieDescription: {
      marginTop: 6,

      maxWidth: 185,

      color:
        "#C7CFDA",

      fontSize: 10,

      lineHeight: 15,
    },

    calorieDescriptionStrong: {
      color:
        "#FFFFFF",

      fontWeight:
        "800",
    },

    primaryButton: {
      alignSelf:
        "flex-start",

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 5,

      marginTop: 15,

      paddingHorizontal:
        12,

      paddingVertical: 9,

      borderRadius: 10,

      backgroundColor:
        colors.maize,
    },

    primaryButtonPlus: {
      color:
        colors.navy,

      fontSize: 15,

      fontWeight:
        "800",
    },

    primaryButtonText: {
      color:
        colors.navy,

      fontSize: 9,

      fontWeight:
        "800",
    },

    /* ENERGY RIGHT */

    energySummary: {
      width: 132,

      alignItems:
        "center",

      gap: 9,
    },

    ringOuter: {
      width: 116,

      height: 116,

      borderWidth: 8,

      borderColor:
        colors.maize,

      borderRadius: 58,

      backgroundColor:
        "#192A40",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    ringInner: {
      width: 91,

      height: 91,

      borderRadius: 46,

      backgroundColor:
        colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    ringNumber: {
      color:
        "#FFFFFF",

      fontSize: 19,

      fontWeight:
        "800",
    },

    ringLabel: {
      marginTop: 2,

      color:
        "#AEB9C7",

      fontSize: 6,
    },

    ringPercent: {
      marginTop: 4,

      color:
        colors.maize,

      fontSize: 7,

      fontWeight:
        "700",
    },

    carbonBadge: {
      width: 116,

      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "center",

      gap: 7,

      paddingVertical: 7,

      paddingHorizontal:
        8,

      borderWidth: 1,

      borderColor:
        "#46566C",

      borderRadius: 10,

      backgroundColor:
        "#1B304B",
    },

    carbonBadgeIcon: {
      color:
        "#8BC7A5",

      fontSize: 15,

      fontWeight:
        "800",
    },

    carbonBadgeEyebrow: {
      color:
        "#9FACBA",

      fontSize: 5,

      fontWeight:
        "800",

      letterSpacing:
        0.8,
    },

    carbonBadgeLevel: {
      marginTop: 1,

      color:
        "#FFFFFF",

      fontSize: 9,

      fontWeight:
        "900",
    },

    /* CARBON */

    carbonCard: {
      marginTop: 12,

      padding: 15,

      borderWidth: 1,

      borderColor:
        "#DCE6DF",

      borderRadius: 15,

      backgroundColor:
        "#F1F7F3",
    },

    carbonCardTop: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    carbonCardTitle: {
      marginTop: 3,

      color:
        colors.navy,

      fontSize: 13,

      fontWeight:
        "800",
    },

    carbonStatusPill: {
      minWidth: 65,

      paddingHorizontal:
        9,

      paddingVertical: 6,

      borderRadius: 9,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",
    },

    carbonStatusText: {
      color:
        "#8A9198",

      fontSize: 8,

      fontWeight:
        "900",
    },

    carbonCounts: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      marginTop: 15,

      paddingTop: 12,

      borderTopWidth: 1,

      borderTopColor:
        "#DDE8E0",
    },

    carbonCount: {
      flex: 1,

      alignItems:
        "center",
    },

    carbonCountNumber: {
      color:
        "#8A9198",

      fontSize: 15,

      fontWeight:
        "900",
    },

    carbonCountLabel: {
      marginTop: 3,

      color:
        "#7C858C",

      fontSize: 5,

      fontWeight:
        "800",
    },

    carbonExplanation: {
      marginTop: 12,

      color:
        "#758079",

      fontSize: 7,

      lineHeight: 11,
    },

    carbonLow: {
      color:
        "#3E8A67",
    },

    carbonMedium: {
      color:
        "#B48A05",
    },

    carbonHigh: {
      color:
        "#B35D54",
    },

    /* SHARED */

    sectionHeading: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    eyebrow: {
      color:
        "#7A818A",

      fontSize: 8,

      fontWeight:
        "700",

      letterSpacing:
        1.15,
    },

    sectionHeadingTitle: {
      marginTop: 3,

      color:
        colors.navy,

      fontSize: 17,

      fontWeight:
        "800",
    },

    textButton: {
      color:
        colors.blue,

      fontSize: 9,

      fontWeight:
        "700",
    },

    /* NUTRIENTS */

    nutrientCard: {
      marginTop: 16,

      padding: 17,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 17,

      backgroundColor:
        "#FFFFFF",
    },

    nutrientGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "space-between",

      marginTop: 17,
    },

    nutrient: {
      width: "47%",

      marginBottom: 15,
    },

    nutrientRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",

      marginBottom: 6,
    },

    nutrientLabel: {
      color:
        "#606873",

      fontSize: 8,

      fontWeight:
        "600",
    },

    nutrientValue: {
      color:
        colors.navy,

      fontSize: 8,

      fontWeight:
        "800",
    },

    nutrientTarget: {
      color:
        "#9AA0A7",

      fontWeight:
        "500",
    },

    progressTrack: {
      height: 5,

      overflow:
        "hidden",

      borderRadius: 3,

      backgroundColor:
        "#ECEEF0",
    },

    progressFill: {
      height: "100%",

      borderRadius: 3,

      backgroundColor:
        colors.navy,
    },

    /* RECOMMENDATION */

    recommendationCard: {
      flexDirection:
        "row",

      alignItems:
        "flex-start",

      gap: 11,

      marginTop: 16,

      padding: 16,

      borderWidth: 1,

      borderColor:
        "#E3D892",

      borderRadius: 17,

      backgroundColor:
        "#FFFBE6",
    },

    recommendationIcon: {
      width: 39,

      height: 39,

      borderRadius: 12,

      backgroundColor:
        colors.maize,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    recommendationSparkle: {
      color:
        colors.navy,

      fontSize: 18,

      fontWeight:
        "900",
    },

    recommendationCopy: {
      flex: 1,
    },

    recommendationTitle: {
      marginTop: 3,

      color:
        colors.navy,

      fontSize: 14,

      fontWeight:
        "800",
    },

    recommendationDescription: {
      marginTop: 5,

      color:
        "#6C6858",

      fontSize: 9,

      lineHeight: 14,
    },

    planButton: {
      alignSelf:
        "center",

      width: 34,

      height: 34,

      borderWidth: 1,

      borderColor:
        "#D4C76F",

      borderRadius: 9,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    planButtonSelected: {
      borderColor:
        "#B9D5C4",

      backgroundColor:
        "#EEF7F1",
    },

    planButtonText: {
      color:
        colors.navy,

      fontSize: 14,

      fontWeight:
        "800",
    },

    /* LOG */

    mealsSection: {
      marginTop: 23,
    },

    addButton: {
      paddingHorizontal:
        11,

      paddingVertical: 7,

      borderWidth: 1,

      borderColor:
        "#D9DCDF",

      borderRadius: 9,

      backgroundColor:
        "#FFFFFF",
    },

    addButtonText: {
      color:
        colors.navy,

      fontSize: 9,

      fontWeight:
        "700",
    },

    emptyMealCard: {
      marginTop: 11,

      padding: 22,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 15,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",
    },

    emptyMealTitle: {
      color:
        colors.navy,

      fontSize: 11,

      fontWeight:
        "800",
    },

    emptyMealDescription: {
      marginTop: 5,

      maxWidth: 250,

      color:
        colors.muted,

      fontSize: 8,

      lineHeight: 13,

      textAlign:
        "center",
    },

    mealList: {
      overflow:
        "hidden",

      marginTop: 11,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 15,

      backgroundColor:
        "#FFFFFF",
    },

    loggedFoodRow: {
      minHeight: 95,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingVertical: 12,

      paddingRight: 12,

      borderBottomWidth: 1,

      borderBottomColor:
        "#ECEDEF",
    },

    loggedFoodStripe: {
      width: 3,

      alignSelf:
        "stretch",

      marginRight: 12,

      backgroundColor:
        colors.maize,
    },

    loggedFoodCopy: {
      flex: 1,

      paddingRight: 8,
    },

    loggedFoodName: {
      color:
        colors.navy,

      fontSize: 11,

      fontWeight:
        "800",
    },

    loggedFoodMeta: {
      marginTop: 5,

      color:
        "#65707A",

      fontSize: 7,

      lineHeight: 11,
    },

    loggedCarbonRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 4,

      marginTop: 4,
    },

    loggedCarbonLabel: {
      color:
        "#858C93",

      fontSize: 6,
    },

    loggedCarbonValue: {
      color:
        "#858C93",

      fontSize: 6,

      fontWeight:
        "800",
    },

    allergenText: {
      marginTop: 4,

      color:
        "#9A625D",

      fontSize: 6,

      lineHeight: 10,
    },

    bottomSpacer: {
      height: 25,
    },

    /* SERVINGS */

    servingControl: {
      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 7,
    },

    servingButton: {
      width: 30,

      height: 30,

      borderWidth: 1,

      borderColor:
        "#D8DDE2",

      borderRadius: 8,

      backgroundColor:
        "#FFFFFF",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    servingButtonDisabled: {
      opacity: 0.4,
    },

    servingPlusButton: {
      borderColor:
        colors.navy,

      backgroundColor:
        colors.navy,
    },

    servingMinus: {
      color:
        "#8F969E",

      fontSize: 16,

      fontWeight:
        "700",
    },

    servingPlus: {
      color:
        "#FFFFFF",

      fontSize: 16,

      fontWeight:
        "700",
    },

    servingCount: {
      minWidth: 15,

      color:
        colors.navy,

      fontSize: 9,

      fontWeight:
        "800",

      textAlign:
        "center",
    },

    /* MODAL */

    pickerSafeArea: {
      flex: 1,

      backgroundColor:
        "#FBFBF8",
    },

    menuPickerContainer: {
      flex: 1,

      paddingHorizontal:
        16,

      paddingBottom: 12,
    },

    modalHandle: {
      width: 38,

      height: 4,

      alignSelf:
        "center",

      marginTop: 7,

      marginBottom: 20,

      borderRadius: 2,

      backgroundColor:
        "#C7CBD0",
    },

    pickerHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      alignItems:
        "center",

      marginBottom: 17,
    },

    pickerEyebrow: {
      color:
        "#7C838C",

      fontSize: 7,

      fontWeight:
        "800",

      letterSpacing:
        1.3,
    },

    pickerTitle: {
      marginTop: 5,

      color:
        colors.navy,

      fontSize: 23,

      fontWeight:
        "800",

      letterSpacing:
        -0.6,
    },

    pickerDescription: {
      marginTop: 6,

      color:
        colors.muted,

      fontSize: 10,

      lineHeight: 15,
    },

    configureText: {
      color:
        colors.blue,

      fontSize: 9,

      fontWeight:
        "700",
    },

    inputLabel: {
      marginBottom: 6,

      color:
        "#646C75",

      fontSize: 7,

      fontWeight:
        "800",

      letterSpacing:
        1,
    },

    hallSelector: {
      height: 48,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingHorizontal:
        12,

      borderWidth: 1,

      borderColor:
        "#D7DCE1",

      borderRadius: 10,

      backgroundColor:
        "#FFFFFF",
    },

    hallPin: {
      marginRight: 9,

      color:
        colors.blue,

      fontSize: 16,
    },

    hallName: {
      flex: 1,

      color:
        colors.navy,

      fontSize: 10,

      fontWeight:
        "700",
    },

    hallChevron: {
      color:
        "#8D949C",

      fontSize: 13,
    },

    hallOptions: {
      overflow:
        "hidden",

      marginTop: 5,

      borderWidth: 1,

      borderColor:
        "#DDE1E5",

      borderRadius: 10,

      backgroundColor:
        "#FFFFFF",
    },

    hallOption: {
      minHeight: 40,

      justifyContent:
        "center",

      paddingHorizontal:
        12,

      borderBottomWidth: 1,

      borderBottomColor:
        "#ECEEF0",
    },

    hallOptionText: {
      color:
        "#6A727B",

      fontSize: 9,
    },

    hallOptionTextSelected: {
      color:
        colors.navy,

      fontWeight:
        "800",
    },

    menuStatus: {
      marginTop: 7,

      marginBottom: 11,

      color:
        colors.green,

      fontSize: 7,
    },

    availableHeader: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      paddingHorizontal:
        12,

      paddingVertical: 9,

      borderWidth: 1,

      borderBottomWidth: 0,

      borderColor:
        "#DEE2E5",

      borderTopLeftRadius:
        11,

      borderTopRightRadius:
        11,

      backgroundColor:
        "#F8F9F7",
    },

    availableHeaderText: {
      color:
        "#707983",

      fontSize: 6,

      fontWeight:
        "800",

      letterSpacing:
        1.2,
    },

    menuListShell: {
      flex: 1,

      minHeight: 200,

      overflow:
        "hidden",

      borderWidth: 1,

      borderColor:
        "#DEE2E5",

      borderBottomLeftRadius:
        11,

      borderBottomRightRadius:
        11,

      backgroundColor:
        "#FFFFFF",
    },

    loadingState: {
      flex: 1,

      minHeight: 200,

      alignItems:
        "center",

      justifyContent:
        "center",

      padding: 20,
    },

    loadingText: {
      marginTop: 8,

      color:
        colors.muted,

      fontSize: 8,

      textAlign:
        "center",
    },

    errorText: {
      color:
        "#A35853",

      fontSize: 9,

      lineHeight: 14,

      textAlign:
        "center",
    },

    menuItemRow: {
      minHeight: 82,

      flexDirection:
        "row",

      alignItems:
        "center",

      paddingRight: 10,

      borderBottomWidth: 1,

      borderBottomColor:
        "#ECEEF0",
    },

    menuItemStripe: {
      width: 3,

      alignSelf:
        "stretch",

      marginRight: 12,

      backgroundColor:
        colors.maize,
    },

    menuItemCopy: {
      flex: 1,

      paddingVertical: 10,

      paddingRight: 8,
    },

    menuItemName: {
      color:
        colors.navy,

      fontSize: 10,

      fontWeight:
        "800",
    },

    menuMetaRow: {
      flexDirection:
        "row",

      alignItems:
        "center",

      flexWrap:
        "wrap",

      gap: 7,

      marginTop: 6,
    },

    menuItemBadge: {
      paddingHorizontal:
        7,

      paddingVertical: 4,

      borderRadius: 7,

      backgroundColor:
        "#F4F5F0",
    },

    menuItemBadgeText: {
      color:
        "#59636D",

      fontSize: 6,
    },

    menuCarbonText: {
      color:
        "#8A9198",

      fontSize: 6,

      fontWeight:
        "800",
    },

    mealTimeText: {
      marginTop: 4,

      color:
        "#8D949B",

      fontSize: 6,
    },

    /* ESTIMATED */

    estimatedCard: {
      marginTop: 10,

      padding: 12,

      borderWidth: 1,

      borderColor:
        "#E4C850",

      borderRadius: 12,

      backgroundColor:
        "#FFF9E9",
    },

    estimatedHeader: {
      flexDirection:
        "row",

      alignItems:
        "center",

      justifyContent:
        "space-between",
    },

    estimatedLabel: {
      color:
        "#836A00",

      fontSize: 6,

      fontWeight:
        "800",

      letterSpacing:
        1,
    },

    estimatedCalories: {
      color:
        colors.navy,

      fontSize: 12,

      fontWeight:
        "800",
    },

    estimatedNutrients: {
      flexDirection:
        "row",

      justifyContent:
        "space-between",

      marginTop: 13,
    },

    estimatedNutrient: {
      flex: 1,

      alignItems:
        "center",
    },

    estimatedNutrientLabel: {
      color:
        "#83775A",

      fontSize: 5,
    },

    estimatedNutrientValue: {
      marginTop: 3,

      color:
        colors.navy,

      fontSize: 6,

      fontWeight:
        "800",
    },

    estimatedHelp: {
      marginTop: 10,

      color:
        "#8F866C",

      fontSize: 5,

      lineHeight: 9,
    },

    addSelectedButton: {
      height: 47,

      marginTop: 10,

      borderRadius: 11,

      backgroundColor:
        colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    addSelectedButtonDisabled: {
      opacity: 0.45,
    },

    addSelectedButtonText: {
      color:
        "#FFFFFF",

      fontSize: 9,

      fontWeight:
        "800",
    },

    closePickerButton: {
      height: 33,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    closePickerText: {
      color:
        "#818890",

      fontSize: 8,

      fontWeight:
        "600",
    },

    /* NUTRIENT PICKER */

    nutrientPickerContent: {
      paddingHorizontal:
        17,

      paddingBottom: 30,
    },

    nutrientChoiceGrid: {
      flexDirection:
        "row",

      flexWrap:
        "wrap",

      justifyContent:
        "space-between",

      marginTop: 18,
    },

    nutrientChoice: {
      width: "48%",

      minHeight: 51,

      flexDirection:
        "row",

      alignItems:
        "center",

      gap: 8,

      marginBottom: 8,

      paddingHorizontal:
        10,

      borderWidth: 1,

      borderColor:
        "#DDE1E4",

      borderRadius: 11,

      backgroundColor:
        "#FFFFFF",
    },

    nutrientChoiceSelected: {
      borderColor:
        "#E1B900",

      backgroundColor:
        "#FFFAE8",
    },

    checkBox: {
      width: 19,

      height: 19,

      borderWidth: 1,

      borderColor:
        "#CFD5DA",

      borderRadius: 5,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    checkBoxSelected: {
      borderColor:
        colors.navy,

      backgroundColor:
        colors.navy,
    },

    checkText: {
      color:
        "#FFFFFF",

      fontSize: 10,

      fontWeight:
        "800",
    },

    nutrientChoiceCopy: {
      flex: 1,
    },

    nutrientChoiceTitle: {
      color:
        colors.navy,

      fontSize: 8,

      fontWeight:
        "800",
    },

    nutrientChoiceValue: {
      marginTop: 3,

      color:
        "#8C939B",

      fontSize: 5,
    },

    doneButton: {
      height: 48,

      marginTop: 12,

      borderRadius: 11,

      backgroundColor:
        colors.navy,

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    doneButtonText: {
      color:
        "#FFFFFF",

      fontSize: 9,

      fontWeight:
        "800",
    },
  });