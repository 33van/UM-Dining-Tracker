import { useState } from "react";

import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";



type Meal = {
  time: string;
  name: string;
  detail: string;
  calories: number;
};


const NUTRIENTS = [
  {
    label: "Protein",
    value: "74g",
    target: "112g",
    percent: 66,
  },
  {
    label: "Carbs",
    value: "186g",
    target: "265g",
    percent: 70,
  },
  {
    label: "Fiber",
    value: "21g",
    target: "30g",
    percent: 70,
  },
  {
    label: "Iron",
    value: "12mg",
    target: "18mg",
    percent: 67,
  },
  {
    label: "Vitamin A",
    value: "610µg",
    target: "700µg",
    percent: 87,
  },
  {
    label: "Vitamin C",
    value: "52mg",
    target: "75mg",
    percent: 69,
  },
];


export default function DashboardScreen() {
  const { profile } = useOnboarding();

  const calorieGoal =
    profile.calorieGoal ?? 2150;

  const [showAddMeal, setShowAddMeal] =
    useState(false);

  const [planned, setPlanned] =
    useState(false);

  const [meals, setMeals] =
    useState<Meal[]>([
      {
        time: "8:20 AM",
        name: "Breakfast",
        detail:
          "Oatmeal, blueberries, almond butter",
        calories: 486,
      },
      {
        time: "12:45 PM",
        name: "Lunch",
        detail:
          "Tofu grain bowl, roasted vegetables",
        calories: 672,
      },
    ]);


  const caloriesConsumed =
    meals.reduce(
      (sum, meal) =>
        sum + meal.calories,
      0
    );

  const caloriesLeft =
    Math.max(
      calorieGoal - caloriesConsumed,
      0
    );

  const caloriePercent =
    Math.min(
      Math.round(
        (caloriesConsumed /
          calorieGoal) *
          100
      ),
      100
    );


  return (
    <SafeAreaView style={styles.safeArea}>

      <View style={styles.screen}>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
        >

          {/* ================================= */}
          {/* HEADER                            */}
          {/* ================================= */}

          <View style={styles.topbar}>

            <Brand />


            <Pressable
              style={styles.notificationButton}
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

            </Pressable>

          </View>


          {/* ================================= */}
          {/* WELCOME                           */}
          {/* ================================= */}

          <View style={styles.welcome}>

            <View style={styles.welcomeCopy}>

              <Text style={styles.date}>
                MONDAY, SEPTEMBER 16
              </Text>

              <Text style={styles.welcomeTitle}>
                Good morning.
              </Text>

              <Text
                style={
                  styles.welcomeDescription
                }
              >
                Here's how you're fueling
                today.
              </Text>

            </View>


            <View style={styles.streak}>

              <Text style={styles.streakNumber}>
                5
              </Text>

              <Text style={styles.streakLabel}>
                day streak
              </Text>

            </View>

          </View>


          {/* ================================= */}
          {/* ENERGY                            */}
          {/* ================================= */}

          <View style={styles.calorieCard}>

            <View style={styles.calorieCopy}>

              <View style={styles.statusPill}>

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
                  ON TRACK
                </Text>

              </View>


              <Text
                style={styles.cardTitle}
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

                {" "}left in your daily
                target.
              </Text>


              <Pressable
                style={styles.primaryButton}
                onPress={() =>
                  setShowAddMeal(true)
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
                  Log a meal
                </Text>

              </Pressable>

            </View>


            <CalorieRing
              percent={caloriePercent}
              consumed={caloriesConsumed}
              goal={calorieGoal}
            />

          </View>


          {/* ================================= */}
          {/* NUTRIENTS                         */}
          {/* ================================= */}

          <View style={styles.nutrientCard}>

            <View style={styles.sectionHeading}>

              <View>

                <Text style={styles.eyebrow}>
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


              <Pressable>

                <Text
                  style={
                    styles.textButton
                  }
                >
                  View all
                </Text>

              </Pressable>

            </View>


            <View
              style={
                styles.nutrientGrid
              }
            >

              {NUTRIENTS.map(
                (nutrient) => (

                  <View
                    key={nutrient.label}
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
                        {nutrient.label}
                      </Text>


                      <Text
                        style={
                          styles.nutrientValue
                        }
                      >
                        {nutrient.value}

                        <Text
                          style={
                            styles.nutrientTarget
                          }
                        >
                          {" "}
                          / {nutrient.target}
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
                              `${nutrient.percent}%`,
                          },
                        ]}
                      />

                    </View>

                  </View>

                )
              )}

            </View>

          </View>


          {/* ================================= */}
          {/* SMART RECOMMENDATION              */}
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

              <Text style={styles.eyebrow}>
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
                You're free from
                12:30–2:00 PM. South Quad
                is a 6-minute walk and has
                three high-protein
                vegetarian options today.
              </Text>


              <View
                style={
                  styles.recommendationMeta
                }
              >

                <Text
                  style={
                    styles.metaText
                  }
                >
                  ⌖ 0.3 mi away
                </Text>

                <Text
                  style={
                    styles.metaText
                  }
                >
                  ◷ Open until 8 PM
                </Text>

              </View>

            </View>


            <Pressable
              style={[
                styles.planButton,

                planned &&
                  styles.planButtonSelected,
              ]}
              onPress={() =>
                setPlanned(true)
              }
            >

              <Text
                style={[
                  styles.planButtonText,

                  planned &&
                    styles.planButtonTextSelected,
                ]}
              >
                {planned
                  ? "✓ In your plan"
                  : "+ Add to plan"}
              </Text>

            </Pressable>

          </View>


          {/* ================================= */}
          {/* MEALS                             */}
          {/* ================================= */}

          <View style={styles.mealsSection}>

            <View
              style={styles.sectionHeading}
            >

              <View>

                <Text style={styles.eyebrow}>
                  TODAY'S LOG
                </Text>

                <Text
                  style={
                    styles.sectionHeadingTitle
                  }
                >
                  Meals
                </Text>

              </View>


              <Pressable
                style={styles.addButton}
                onPress={() =>
                  setShowAddMeal(true)
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


            <View style={styles.mealList}>

              {meals.map(
                (meal, index) => (

                  <MealRow
                    key={`${meal.name}-${index}`}
                    meal={meal}
                  />

                )
              )}


              {planned && (

                <View
                  style={
                    styles.plannedMeal
                  }
                >

                  <View
                    style={
                      styles.plannedMealIcon
                    }
                  >
                    <Text>✦</Text>
                  </View>


                  <View
                    style={
                      styles.plannedMealCopy
                    }
                  >

                    <Text
                      style={
                        styles.plannedMealEyebrow
                      }
                    >
                      6:15 PM · PHOTON PLAN
                    </Text>

                    <Text
                      style={
                        styles.plannedMealTitle
                      }
                    >
                      South Quad power bowl
                    </Text>

                    <Text
                      style={
                        styles.plannedMealDescription
                      }
                    >
                      Tofu, quinoa, spinach,
                      chickpeas · 498 kcal
                    </Text>

                  </View>

                </View>

              )}

            </View>

          </View>


          <View
            style={styles.bottomSpacer}
          />

        </ScrollView>


        {/* Your existing navigation component */}

      </View>


      {/* ================================= */}
      {/* ADD MEAL SHEET                    */}
      {/* ================================= */}

      <AddMealModal
        visible={showAddMeal}
        onClose={() =>
          setShowAddMeal(false)
        }
        onSave={(meal) => {

          setMeals(
            (current) => [
              ...current,
              meal,
            ]
          );

          setShowAddMeal(false);

        }}
      />

    </SafeAreaView>
  );
}


/* ============================================ */
/* BRAND                                        */
/* ============================================ */

function Brand() {
  return (

    <View style={styles.brand}>

      <View style={styles.brandMark}>

        <Text style={styles.brandM}>
          M
        </Text>

      </View>

      <Text style={styles.brandText}>
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
  /*
   * React Native does not provide the same
   * inline SVG element used by the Figma
   * web version without an SVG dependency.
   *
   * This recreates the visual as a circular
   * bordered indicator while keeping the
   * same central copy.
   */

  return (

    <View style={styles.ringOuter}>

      <View style={styles.ringInner}>

        <Text style={styles.ringNumber}>
          {consumed.toLocaleString()}
        </Text>

        <Text style={styles.ringLabel}>
          of {goal.toLocaleString()} kcal
        </Text>

        <Text style={styles.ringPercent}>
          {percent}% today
        </Text>

      </View>

    </View>

  );
}


/* ============================================ */
/* MEAL ROW                                     */
/* ============================================ */

function MealRow({
  meal,
}: {
  meal: Meal;
}) {

  return (

    <Pressable style={styles.meal}>

      <View style={styles.mealArt}>

        <Text style={styles.mealArtText}>
          {meal.name === "Breakfast"
            ? "◷"
            : "✦"}
        </Text>

      </View>


      <View style={styles.mealCopy}>

        <Text style={styles.mealTime}>
          {meal.time}
        </Text>

        <Text style={styles.mealName}>
          {meal.name}
        </Text>

        <Text style={styles.mealDetail}>
          {meal.detail}
        </Text>

      </View>


      <View style={styles.mealCalories}>

        <Text
          style={
            styles.mealCaloriesNumber
          }
        >
          {meal.calories}
        </Text>

        <Text
          style={
            styles.mealCaloriesLabel
          }
        >
          kcal
        </Text>

      </View>


      <Text style={styles.chevron}>
        ›
      </Text>

    </Pressable>

  );
}


/* ============================================ */
/* ADD MEAL MODAL                               */
/* ============================================ */

function AddMealModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (meal: Meal) => void;
}) {

  const [mealType, setMealType] =
    useState<string | null>(null);

  const [food, setFood] =
    useState(
      "Greek yogurt, strawberries, granola"
    );

  const [calories, setCalories] =
    useState("285");


  function close() {
    setMealType(null);
    onClose();
  }


  function save() {
    if (!mealType) {
      return;
    }

    onSave({
      time: "3:10 PM",
      name: mealType,
      detail: food,
      calories:
        Number(calories) || 0,
    });

    setMealType(null);
  }


  return (

    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
    >

      <View style={styles.modalOverlay}>

        <Pressable
          style={styles.modalBackdrop}
          onPress={close}
        />


        <View style={styles.modalSheet}>

          <View
            style={styles.sheetHandle}
          />


          <Text style={styles.eyebrow}>
            QUICK LOG
          </Text>


          {!mealType ? (
            <>

              <Text style={styles.sheetTitle}>
                What did you have?
              </Text>

              <Text
                style={
                  styles.sheetDescription
                }
              >
                Choose a meal to start
                logging your food.
              </Text>


              {[
                "Breakfast",
                "Lunch",
                "Dinner",
                "Snack",
              ].map(
                (meal, index) => (

                  <Pressable
                    key={meal}
                    style={
                      styles.mealOption
                    }
                    onPress={() =>
                      setMealType(meal)
                    }
                  >

                    <View
                      style={
                        styles.mealOptionNumber
                      }
                    >
                      <Text
                        style={
                          styles.mealOptionNumberText
                        }
                      >
                        {
                          [
                            "07",
                            "12",
                            "18",
                            "•",
                          ][index]
                        }
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.mealOptionText
                      }
                    >
                      {meal}
                    </Text>

                    <Text
                      style={
                        styles.mealOptionChevron
                      }
                    >
                      ›
                    </Text>

                  </Pressable>

                )
              )}

            </>
          ) : (
            <>

              <Pressable
                onPress={() =>
                  setMealType(null)
                }
              >

                <Text
                  style={
                    styles.sheetBack
                  }
                >
                  ← Back
                </Text>

              </Pressable>


              <Text style={styles.sheetTitle}>
                Log {mealType.toLowerCase()}
              </Text>

              <Text
                style={
                  styles.sheetDescription
                }
              >
                Add what you ate and we'll
                estimate the nutrition.
              </Text>


              <Text style={styles.inputLabel}>
                FOOD OR MEAL
              </Text>

              <TextInput
                style={styles.modalInput}
                value={food}
                onChangeText={setFood}
              />


              <Text style={styles.inputLabel}>
                CALORIES
              </Text>

              <TextInput
                style={styles.modalInput}
                value={calories}
                onChangeText={setCalories}
                keyboardType="number-pad"
              />


              <Pressable
                style={styles.saveMealButton}
                onPress={save}
              >

                <Text
                  style={
                    styles.saveMealButtonText
                  }
                >
                  ✓ Add to today's log
                </Text>

              </Pressable>

            </>
          )}

        </View>

      </View>

    </Modal>

  );
}
/* ============================================ */
/* STYLES                                       */
/* ============================================ */

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8F8F4",
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8F8F4",
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 22,
  },


  /* ========================================== */
  /* HEADER                                     */
  /* ========================================== */

  topbar: {
    height: 68,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },

  brandMark: {
    width: 28,
    height: 28,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 7,

    backgroundColor: colors.navy,

    transform: [
      {
        rotate: "-4deg",
      },
    ],
  },

  brandM: {
    color: colors.maize,

    fontSize: 15,
    fontWeight: "900",
  },

  brandText: {
    color: colors.navy,

    fontSize: 21,
    fontWeight: "800",

    letterSpacing: -0.8,
  },

  notificationButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E0E2E4",

    borderRadius: 19,

    backgroundColor: "#FFFFFF",
  },

  notificationIcon: {
    color: colors.navy,

    fontSize: 18,
    fontWeight: "700",
  },

  notificationDot: {
    position: "absolute",

    top: 8,
    right: 8,

    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: "#D7B900",
  },


  /* ========================================== */
  /* WELCOME                                    */
  /* ========================================== */

  welcome: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingTop: 20,
    paddingBottom: 23,
  },

  welcomeCopy: {
    flex: 1,
  },

  date: {
    color: "#7B828B",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1.25,
  },

  welcomeTitle: {
    marginTop: 5,

    color: colors.navy,

    fontSize: 28,
    lineHeight: 33,

    fontWeight: "800",

    letterSpacing: -1,
  },

  welcomeDescription: {
    marginTop: 4,

    color: colors.muted,

    fontSize: 11,
  },

  streak: {
    width: 67,
    height: 67,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E4D991",

    borderRadius: 34,

    backgroundColor: "#FFF9D9",
  },

  streakNumber: {
    color: colors.navy,

    fontSize: 20,
    fontWeight: "800",
  },

  streakLabel: {
    marginTop: -1,

    color: "#827850",

    fontSize: 7,
    fontWeight: "600",
  },


  /* ========================================== */
  /* ENERGY CARD                                */
  /* ========================================== */

  calorieCard: {
    minHeight: 180,

    flexDirection: "row",
    alignItems: "center",

    padding: 18,

    borderRadius: 18,

    backgroundColor: colors.navy,
  },

  calorieCopy: {
    flex: 1,

    paddingRight: 12,
  },

  statusPill: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    paddingHorizontal: 8,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: "#304158",
  },

  statusPillDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: "#8BC7A5",
  },

  statusPillText: {
    color: "#B9E2CA",

    fontSize: 7,
    fontWeight: "800",

    letterSpacing: 0.8,
  },

  cardTitle: {
    marginTop: 12,

    color: "#FFFFFF",

    fontSize: 20,
    fontWeight: "800",

    letterSpacing: -0.4,
  },

  calorieDescription: {
    marginTop: 6,

    maxWidth: 190,

    color: "#C7CFDA",

    fontSize: 10,
    lineHeight: 15,
  },

  calorieDescriptionStrong: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  primaryButton: {
    alignSelf: "flex-start",

    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    marginTop: 15,

    paddingHorizontal: 12,
    paddingVertical: 9,

    borderRadius: 10,

    backgroundColor: colors.maize,
  },

  primaryButtonPlus: {
    color: colors.navy,

    fontSize: 15,
    fontWeight: "700",
  },

  primaryButtonText: {
    color: colors.navy,

    fontSize: 9,
    fontWeight: "800",
  },


  /* ========================================== */
  /* CALORIE RING                               */
  /* ========================================== */

  ringOuter: {
    width: 126,
    height: 126,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 9,
    borderColor: colors.maize,

    borderRadius: 63,

    backgroundColor: "#192A40",
  },

  ringInner: {
    width: 96,
    height: 96,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 48,

    backgroundColor: colors.navy,
  },

  ringNumber: {
    color: "#FFFFFF",

    fontSize: 20,
    fontWeight: "800",

    letterSpacing: -0.5,
  },

  ringLabel: {
    marginTop: 2,

    color: "#AEB9C7",

    fontSize: 7,
  },

  ringPercent: {
    marginTop: 4,

    color: colors.maize,

    fontSize: 7,
    fontWeight: "700",
  },


  /* ========================================== */
  /* SHARED CARD / HEADING                      */
  /* ========================================== */

  sectionHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  eyebrow: {
    color: "#7A818A",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1.15,
  },

  sectionHeadingTitle: {
    marginTop: 3,

    color: colors.navy,

    fontSize: 17,
    fontWeight: "800",

    letterSpacing: -0.3,
  },

  textButton: {
    color: colors.blue,

    fontSize: 9,
    fontWeight: "700",
  },


  /* ========================================== */
  /* NUTRIENTS                                  */
  /* ========================================== */

  nutrientCard: {
    marginTop: 16,

    padding: 17,

    borderWidth: 1,
    borderColor: "#E0E2E4",

    borderRadius: 17,

    backgroundColor: "#FFFFFF",
  },

  nutrientGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    justifyContent: "space-between",

    marginTop: 17,
  },

  nutrient: {
    width: "47%",

    marginBottom: 15,
  },

  nutrientRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 6,
  },

  nutrientLabel: {
    color: "#606873",

    fontSize: 8,
    fontWeight: "600",
  },

  nutrientValue: {
    color: colors.navy,

    fontSize: 8,
    fontWeight: "800",
  },

  nutrientTarget: {
    color: "#9AA0A7",

    fontWeight: "500",
  },

  progressTrack: {
    height: 5,

    overflow: "hidden",

    borderRadius: 3,

    backgroundColor: "#ECEEF0",
  },

  progressFill: {
    height: "100%",

    borderRadius: 3,

    backgroundColor: colors.navy,
  },


  /* ========================================== */
  /* SMART RECOMMENDATION                       */
  /* ========================================== */

  recommendationCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 11,

    marginTop: 16,

    padding: 16,

    borderWidth: 1,
    borderColor: "#E3D892",

    borderRadius: 17,

    backgroundColor: "#FFFBE6",
  },

  recommendationIcon: {
    width: 39,
    height: 39,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 12,

    backgroundColor: colors.maize,
  },

  recommendationSparkle: {
    color: colors.navy,

    fontSize: 18,
    fontWeight: "900",
  },

  recommendationCopy: {
    flex: 1,
  },

  recommendationTitle: {
    marginTop: 3,

    color: colors.navy,

    fontSize: 14,
    fontWeight: "800",
  },

  recommendationDescription: {
    marginTop: 5,

    color: "#6C6858",

    fontSize: 9,
    lineHeight: 14,
  },

  recommendationMeta: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 12,

    marginTop: 9,
  },

  metaText: {
    color: "#716B51",

    fontSize: 8,
    fontWeight: "600",
  },

  planButton: {
    alignSelf: "center",

    paddingHorizontal: 10,
    paddingVertical: 8,

    borderWidth: 1,
    borderColor: "#D4C76F",

    borderRadius: 9,

    backgroundColor: "#FFFFFF",
  },

  planButtonSelected: {
    borderColor: "#B9D5C4",

    backgroundColor: "#EEF7F1",
  },

  planButtonText: {
    color: "#756200",

    fontSize: 8,
    fontWeight: "700",
  },

  planButtonTextSelected: {
    color: colors.green,
  },


  /* ========================================== */
  /* MEALS                                      */
  /* ========================================== */

  mealsSection: {
    marginTop: 23,
  },

  addButton: {
    paddingHorizontal: 11,
    paddingVertical: 7,

    borderWidth: 1,
    borderColor: "#D9DCDF",

    borderRadius: 9,

    backgroundColor: "#FFFFFF",
  },

  addButtonText: {
    color: colors.navy,

    fontSize: 9,
    fontWeight: "700",
  },

  mealList: {
    overflow: "hidden",

    marginTop: 11,

    borderWidth: 1,
    borderColor: "#E0E2E4",

    borderRadius: 15,

    backgroundColor: "#FFFFFF",
  },

  meal: {
    minHeight: 78,

    flexDirection: "row",
    alignItems: "center",

    gap: 11,

    paddingHorizontal: 13,
    paddingVertical: 11,

    borderBottomWidth: 1,
    borderBottomColor: "#ECEDEF",
  },

  mealArt: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor: "#FFF5C8",
  },

  mealArtText: {
    color: colors.navy,

    fontSize: 17,
    fontWeight: "800",
  },

  mealCopy: {
    flex: 1,
  },

  mealTime: {
    color: "#949AA1",

    fontSize: 7,
    fontWeight: "600",
  },

  mealName: {
    marginTop: 2,

    color: colors.navy,

    fontSize: 11,
    fontWeight: "800",
  },

  mealDetail: {
    marginTop: 2,

    color: colors.muted,

    fontSize: 8,
  },

  mealCalories: {
    alignItems: "flex-end",
  },

  mealCaloriesNumber: {
    color: colors.navy,

    fontSize: 12,
    fontWeight: "800",
  },

  mealCaloriesLabel: {
    color: "#999FA6",

    fontSize: 7,
  },

  chevron: {
    marginLeft: 3,

    color: "#A0A5AB",

    fontSize: 21,
  },


  /* ========================================== */
  /* PLANNED PHOTON MEAL                        */
  /* ========================================== */

  plannedMeal: {
    flexDirection: "row",
    alignItems: "center",

    gap: 11,

    padding: 13,

    backgroundColor: "#FFFBE6",
  },

  plannedMealIcon: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 11,

    backgroundColor: colors.maize,
  },

  plannedMealCopy: {
    flex: 1,
  },

  plannedMealEyebrow: {
    color: "#81774C",

    fontSize: 7,
    fontWeight: "700",
  },

  plannedMealTitle: {
    marginTop: 2,

    color: colors.navy,

    fontSize: 11,
    fontWeight: "800",
  },

  plannedMealDescription: {
    marginTop: 2,

    color: "#756F59",

    fontSize: 8,
  },

  bottomSpacer: {
    height: 100,
  },


  /* ========================================== */
  /* QUICK LOG MODAL                            */
  /* ========================================== */

  modalOverlay: {
    flex: 1,

    justifyContent: "flex-end",

    backgroundColor: "rgba(8, 21, 37, 0.34)",
  },

  modalBackdrop: {
  position: "absolute",
  top: 0,
  bottom: 0,
  left: 0,
  right: 0,
},

  modalSheet: {
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 32,

    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,

    backgroundColor: "#FBFBF8",
  },

  sheetHandle: {
    width: 38,
    height: 4,

    alignSelf: "center",

    marginBottom: 22,

    borderRadius: 2,

    backgroundColor: "#D4D7DA",
  },

  sheetTitle: {
    marginTop: 5,

    color: colors.navy,

    fontSize: 23,
    fontWeight: "800",

    letterSpacing: -0.6,
  },

  sheetDescription: {
    marginTop: 5,
    marginBottom: 18,

    color: colors.muted,

    fontSize: 10,
    lineHeight: 15,
  },

  mealOption: {
    height: 55,

    flexDirection: "row",
    alignItems: "center",

    gap: 11,

    paddingHorizontal: 12,

    borderBottomWidth: 1,
    borderBottomColor: "#E6E8EA",
  },

  mealOptionNumber: {
    width: 31,
    height: 31,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 9,

    backgroundColor: "#FFF3B5",
  },

  mealOptionNumberText: {
    color: colors.navy,

    fontSize: 9,
    fontWeight: "800",
  },

  mealOptionText: {
    flex: 1,

    color: colors.navy,

    fontSize: 11,
    fontWeight: "700",
  },

  mealOptionChevron: {
    color: "#A0A5AB",

    fontSize: 21,
  },

  sheetBack: {
    marginBottom: 12,

    color: colors.blue,

    fontSize: 10,
    fontWeight: "700",
  },

  inputLabel: {
    marginTop: 12,
    marginBottom: 6,

    color: "#606873",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1,
  },

  modalInput: {
    height: 44,

    paddingHorizontal: 12,

    borderWidth: 1,
    borderColor: "#D8DBDE",

    borderRadius: 10,

    backgroundColor: "#FFFFFF",

    color: colors.navy,

    fontSize: 10,
  },

  saveMealButton: {
    height: 45,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 20,

    borderRadius: 11,

    backgroundColor: colors.navy,
  },

  saveMealButtonText: {
    color: "#FFFFFF",

    fontSize: 10,
    fontWeight: "700",
  },
});