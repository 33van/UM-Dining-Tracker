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

  /*
   * Your current scraper may not
   * have this yet.
   *
   * If fiberG is missing from the
   * backend, the app will show "—".
   */
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

  hall:
    DiningHallSlug;

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

/*
 * These targets are currently UI defaults.
 *
 * Later you can move these into UserProfile
 * if Gemini/backend calculates personalized
 * nutrient targets.
 */
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
): number | null {
  let total = 0;

  let found =
    false;

  for (
    const logged
    of loggedItems
  ) {
    const value =
      getNutrientValue(
        logged.menuItem,
        key
      );

    if (
      typeof value ===
      "number"
    ) {
      total +=
        value *
        logged.servings;

      found = true;
    }
  }

  return found
    ? total
    : null;
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
/* DASHBOARD                                    */
/* ============================================ */

export default function DashboardScreen() {
  const {
    profile,
  } = useOnboarding();

  const calorieGoal =
    profile.calorieGoal ??
    2150;

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
    planned,
    setPlanned,
  ] =
    useState(false);

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
            (logged
              .menuItem
              .calories ??
              0) *
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

      0
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
  /* NUTRIENT TOTALS                            */
  /* ========================================== */

  const nutrientTotals =
    useMemo(() => {
      const totals: Partial<
        Record<
          NutrientKey,
          number | null
        >
      > = {};

      for (
        const option
        of NUTRIENT_OPTIONS
      ) {
        totals[
          option.key
        ] =
          totalNutrient(
            loggedItems,
            option.key
          );
      }

      return totals;
    }, [
      loggedItems,
    ]);

  const displayedNutrients =
    NUTRIENT_OPTIONS.filter(
      (option) =>
        visibleNutrients.includes(
          option.key
        )
    );

  /* ========================================== */
  /* OPEN MODALS                                */
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

  /* ========================================== */
  /* ADD DINING ITEMS                           */
  /* ========================================== */

  function addDiningItems(
    incoming:
      LoggedDiningItem[]
  ) {
    setLoggedItems(
      (current) => {
        const next =
          [...current];

        for (
          const newItem
          of incoming
        ) {
          /*
           * If the same dining item
           * is already logged,
           * increase its servings.
           */
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
      (current) =>
        current
          .map(
            (item) =>
              item.id === id
                ? {
                    ...item,

                    servings:
                      item.servings +
                      difference,
                  }
                : item
          )
          .filter(
            (item) =>
              item.servings >
              0
          )
    );
  }

  /* ========================================== */
  /* UI                                         */
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

          {/* ENERGY */}

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

            <CalorieRing
              percent={
                caloriePercent
              }
              consumed={
                caloriesConsumed
              }
              goal={
                calorieGoal
              }
            />
          </View>

          {/* NUTRIENTS */}

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
                ) => {
                  const value =
                    nutrientTotals[
                      nutrient.key
                    ] ??
                    null;

                  const percent =
                    value ===
                    null
                      ? 0
                      : Math.min(
                          (
                            value /
                            nutrient.target
                          ) *
                            100,

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

          {/* SMART RECOMMENDATION */}

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
                Lunch at South Quad?
              </Text>

              <Text
                style={
                  styles.recommendationDescription
                }
              >
                We'll use your schedule, location,
                preferences and today's dining menu
                to suggest a meal.
              </Text>
            </View>

            <Pressable
              style={[
                styles.planButton,

                planned &&
                  styles.planButtonSelected,
              ]}
              onPress={() =>
                setPlanned(
                  true
                )
              }
            >
              <Text
                style={
                  styles.planButtonText
                }
              >
                {planned
                  ? "✓"
                  : "+"}
              </Text>
            </Pressable>
          </View>

          {/* TODAY'S LOG */}

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
                  menu to start tracking today's
                  calories and nutrients.
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

        {/* DINING / NUTRIENT PICKER */}

        <DiningPickerModal
          visible={
            showDiningPicker
          }
          startScreen={
            pickerStartScreen
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
          onClose={() =>
            setShowDiningPicker(
              false
            )
          }
          onAddItems={(
            items
          ) => {
            addDiningItems(
              items
            );

            setShowDiningPicker(
              false
            );
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
/* CALORIE RING                                 */
/* ============================================ */

function CalorieRing({
  percent,
  consumed,
  goal,
}: {
  percent: number;

  consumed: number;

  goal: number;
}) {
  return (
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
  );
}

/* ============================================ */
/* LOGGED FOOD ROW                              */
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
/* SERVING CONTROL                              */
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
  visibleNutrients,
  dailyTotals,
  onChangeVisibleNutrients,
  onClose,
  onAddItems,
}: {
  visible: boolean;

  startScreen:
    PickerScreen;

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

  /*
   * When the parent opens this modal
   * from Customize, show nutrient
   * settings first.
   *
   * When opened from + Add, show menu.
   */
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

  /*
   * Fetch dining menu directly from
   * your Express + Cheerio route.
   */
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
            const message =
              typeof data ===
                "object" &&
              data !==
                null &&
              "error" in
                data
                ? String(
                    (
                      data as {
                        error?: unknown;
                      }
                    )
                      .error
                  )
                : "Could not load dining menu.";

            throw new Error(
              message
            );
          }

          /*
           * This supports either:
           *
           * res.json(items)
           *
           * or:
           *
           * res.json({ items })
           */
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
              data &&
            Array.isArray(
              (
                data as {
                  items?: unknown;
                }
              ).items
            )
          ) {
            rawItems =
              (
                data as {
                  items:
                    DiningMenuItem[];
                }
              ).items;
          }

          const items =
            rawItems.map(
              (
                item,
                index
              ) => ({
                ...item,

                id:
                  `${selectedHall}-${item.meal}-${item.name}-${index}`,
              })
            );

          if (
            !cancelled
          ) {
            setMenuItems(
              items
            );

            setServings(
              {}
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
        (item.calories ??
          0) *
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

          menuItem: {
            meal:
              item.meal,

            mealTime:
              item.mealTime,

            name:
              item.name,

            calories:
              item.calories,

            totalFatG:
              item.totalFatG,

            saturatedFatG:
              item.saturatedFatG,

            transFatG:
              item.transFatG,

            proteinG:
              item.proteinG,

            sugarG:
              item.sugarG,

            cholesterolMg:
              item.cholesterolMg,

            sodiumMg:
              item.sodiumMg,

            carbsG:
              item.carbsG,

            fiberG:
              item.fiberG,

            calciumPercent:
              item.calciumPercent,

            ironPercent:
              item.ironPercent,

            vitaminAPercent:
              item.vitaminAPercent,

            vitaminCPercent:
              item.vitaminCPercent,

            allergens:
              item.allergens ??
              [],

            traits:
              item.traits ??
              [],
          },
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
    } else {
      onChangeVisibleNutrients([
        ...visibleNutrients,
        key,
      ]);
    }
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
              Select the nutrients you want visible
              in your Daily Balance card.
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
                /*
                 * If Customize was opened
                 * directly from the dashboard,
                 * Done closes the sheet.
                 *
                 * If the user opened settings
                 * while adding food, return
                 * to the food picker.
                 */
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

            {/* PICKER HEADER */}

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

            {/* DINING HALL */}

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

            {/* MENU */}

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
                Totals update automatically from serving
                amounts and Michigan Dining nutrition data.
              </Text>
            </View>

            {/* ADD BUTTON */}

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

    /* CALORIES */

    calorieCard: {
      minHeight: 180,

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

      paddingRight: 12,
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

      maxWidth: 190,

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

    /* RING */

    ringOuter: {
      width: 126,

      height: 126,

      borderWidth: 9,

      borderColor:
        colors.maize,

      borderRadius: 63,

      backgroundColor:
        "#192A40",

      alignItems:
        "center",

      justifyContent:
        "center",
    },

    ringInner: {
      width: 96,

      height: 96,

      borderRadius: 48,

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

      fontSize: 20,

      fontWeight:
        "800",
    },

    ringLabel: {
      marginTop: 2,

      color:
        "#AEB9C7",

      fontSize: 7,
    },

    ringPercent: {
      marginTop: 4,

      color:
        colors.maize,

      fontSize: 7,

      fontWeight:
        "700",
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

    /* NUTRIENT CARD */

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

    /* TODAY LOG */

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

      maxWidth: 240,

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
      minHeight: 88,

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

    allergenText: {
      marginTop: 4,

      color:
        "#9A625D",

      fontSize: 6,

      lineHeight: 10,
    },

    bottomSpacer: {
      height: 100,
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

      borderBottomWidth:
        1,

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

      borderBottomWidth:
        0,

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
      minHeight: 79,

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

    menuItemBadge: {
      alignSelf:
        "flex-start",

      marginTop: 6,

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

    mealTimeText: {
      marginTop: 4,

      color:
        "#8D949B",

      fontSize: 6,
    },

    /* ESTIMATED NUTRITION */

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
      alignItems:
        "center",

      flex: 1,
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

    /* NUTRIENT CUSTOMIZATION */

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