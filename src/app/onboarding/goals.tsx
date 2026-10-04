import { useState } from "react";
import { useGoogleCalendarConnect } from "../../hooks/useGoogleCalendarConnect";

import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router } from "expo-router";

import { colors } from "../../constants/theme";

import {
  FOOD_PREFERENCES,
  FoodPreference,
} from "../../constants/foodPreferences";

import { useOnboarding } from "../../context/OnboardingContext";


export default function GoalsScreen() {
  const {
    profile,
    setGoalsInfo,
  } = useOnboarding();

  const {
  connect,
  connecting,
  notice,
} = useGoogleCalendarConnect();


  /* ========================================== */
  /* CALORIE GOAL                               */
  /* ========================================== */

  const [calorieGoal, setCalorieGoal] =
    useState(
      profile.calorieGoal ?? 2150
    );

  const [
    calorieGoalIsCustom,
    setCalorieGoalIsCustom,
  ] = useState(
    profile.calorieGoalIsCustom ?? false
  );


  /* ========================================== */
  /* FOOD PREFERENCES                           */
  /* ========================================== */

  const [
  preferences,
  setPreferences,
] = useState<FoodPreference[]>(
  (profile.foodPreferences ?? []) as FoodPreference[]
);

  function togglePreference(
    preference: FoodPreference
  ) {
    setPreferences((current) => {
      if (current.includes(preference)) {
        return current.filter(
          (item) => item !== preference
        );
      }

      return [
        ...current,
        preference,
      ];
    });
  }


  /* ========================================== */
  /* CALORIE CONTROLS                           */
  /* ========================================== */

  function decreaseCalories() {
    setCalorieGoal((current) =>
      Math.max(
        1200,
        current - 50
      )
    );

    setCalorieGoalIsCustom(true);
  }


  function increaseCalories() {
    setCalorieGoal((current) =>
      Math.min(
        4000,
        current + 50
      )
    );

    setCalorieGoalIsCustom(true);
  }


  function handleCalorieInput(
    text: string
  ) {
    const digits =
      text.replace(/\D/g, "");

    setCalorieGoalIsCustom(true);

    if (!digits) {
      setCalorieGoal(0);
      return;
    }

    setCalorieGoal(
      Number(digits)
    );
  }


  /* ========================================== */
  /* GOOGLE CALENDAR                            */
  /* ========================================== */
async function handleCalendarPress() {
  console.log("Google Calendar button pressed");

  try {
    await connect();
  } catch (error) {
    console.error(
      "GOOGLE CALENDAR CONNECTION ERROR:",
      error
    );
  }
}


  /* ========================================== */
  /* CONTINUE                                   */
  /* ========================================== */

  function handleContinue() {
    /*
     * Validate calorie goal.
     */

    if (
      calorieGoal < 1200 ||
      calorieGoal > 4000
    ) {
      Alert.alert(
        "Invalid calorie goal",
        "Please enter a calorie goal between 1,200 and 4,000 calories."
      );

      return;
    }


    /*
     * Everything we're saving from
     * the Goals screen.
     */

    const goalsInfo = {
      calorieGoal,
      calorieGoalIsCustom,
      foodPreferences: preferences,
    };


    /*
     * Construct the profile as it will
     * look after this update.
     *
     * This is only for debugging.
     */

    const updatedProfile = {
      ...profile,
      ...goalsInfo,
    };


    console.log(
      "\n================================="
    );

    console.log(
      "UPDATED USER PROFILE — GOALS"
    );

    console.log(
      "================================="
    );

    console.log(
      JSON.stringify(
        updatedProfile,
        null,
        2
      )
    );

    console.log(
      "=================================\n"
    );


    /*
     * Save to shared UserProfile state.
     */

    setGoalsInfo(goalsInfo);


    /*
     * Go to Step 4.
     */

    router.push(
      "/onboarding/plan"
    );
  }


  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      <View
        style={styles.container}
      >

        {/* ================================= */}
        {/* HEADER                            */}
        {/* ================================= */}

        <View
          style={styles.header}
        >

          <Brand />

          <Text
            style={styles.stepText}
          >
            Step 3 of 4
          </Text>

        </View>


        {/* ================================= */}
        {/* STEPPER                           */}
        {/* ================================= */}

        <View
          style={styles.stepper}
        >

          <Step
            number="✓"
            label="Account"
            completed
          />

          <Step
            number="✓"
            label="About you"
            completed
          />

          <Step
            number="03"
            label="Goals"
            active
          />

          <Step
            number="04"
            label="Plan"
          />

        </View>


        {/* ================================= */}
        {/* CONTENT                           */}
        {/* ================================= */}

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={
            styles.scrollContent
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
        >

          <View
            style={styles.content}
          >

            <Text
              style={styles.eyebrow}
            >
              YOUR GOALS
            </Text>


            <Text
              style={styles.title}
            >
              What feels right for you?
            </Text>


            <Text
              style={styles.description}
            >
              Based on your body data, we
              recommend 2,150 calories per day.
              You can adjust this at any time.
            </Text>


            {/* ============================= */}
            {/* CALORIE GOAL                  */}
            {/* ============================= */}

            <View
              style={styles.calorieCard}
            >

              <Text
                style={styles.calorieLabel}
              >
                DAILY CALORIE GOAL
              </Text>


              <View
                style={styles.calorieControls}
              >

                <Pressable
                  style={styles.calorieButton}
                  onPress={
                    decreaseCalories
                  }
                >

                  <Text
                    style={
                      styles.calorieButtonText
                    }
                  >
                    −
                  </Text>

                </Pressable>


                <TextInput
                  style={styles.calorieInput}
                  value={
                    calorieGoal === 0
                      ? ""
                      : calorieGoal.toString()
                  }
                  onChangeText={
                    handleCalorieInput
                  }
                  keyboardType="number-pad"
                  maxLength={4}
                  selectTextOnFocus
                />


                <Pressable
                  style={styles.calorieButton}
                  onPress={
                    increaseCalories
                  }
                >

                  <Text
                    style={
                      styles.calorieButtonText
                    }
                  >
                    +
                  </Text>

                </Pressable>

              </View>


              <Text
                style={styles.calorieUnit}
              >
                calories per day
              </Text>


              <View
                style={
                  styles.recommendationRow
                }
              >

                <Text
                  style={styles.sparkle}
                >
                  ✦
                </Text>

                <Text
                  style={
                    styles.recommendationText
                  }
                >
                  {calorieGoalIsCustom
                    ? "Your custom daily calorie goal"
                    : "Recommended starting point based on your profile"}
                </Text>

              </View>

            </View>


            {/* ============================= */}
            {/* FOOD PREFERENCES              */}
            {/* ============================= */}

            <View
              style={
                styles.preferenceSection
              }
            >

              <Text
                style={styles.fieldLabel}
              >
                FOOD PREFERENCES
              </Text>


              <Text
                style={
                  styles.preferenceDescription
                }
              >
                Select any that apply. We'll use
                these when recommending meals.
              </Text>


              <View
                style={styles.chips}
              >

                {FOOD_PREFERENCES.map(
                  (preference) => {

                    const selected =
                      preferences.includes(
                        preference
                      );

                    return (

                      <Pressable
                        key={preference}
                        style={[
                          styles.chip,

                          selected &&
                            styles.selectedChip,
                        ]}
                        onPress={() =>
                          togglePreference(
                            preference
                          )
                        }
                      >

                        {selected && (

                          <Text
                            style={
                              styles.checkmark
                            }
                          >
                            ✓
                          </Text>

                        )}


                        <Text
                          style={[
                            styles.chipText,

                            selected &&
                              styles.selectedChipText,
                          ]}
                        >
                          {preference}
                        </Text>

                      </Pressable>

                    );
                  }
                )}

              </View>

            </View>


            {/* ============================= */}
            {/* GOOGLE CALENDAR               */}
            {/* ============================= */}

            <View
              style={styles.scheduleSection}
            >

              <Text
                style={styles.fieldLabel}
              >
                TYPICAL SCHEDULE
              </Text>


              <Pressable
    style={[
      styles.calendarRow,
      connecting && {
        opacity: 0.6,
      },
    ]}
    onPress={handleCalendarPress}
    disabled={connecting}
  >

    <View style={styles.calendarIcon}>

      <Text style={styles.calendarIconText}>
        ▣
      </Text>

    </View>


    <View style={styles.calendarCopy}>

      <Text style={styles.calendarTitle}>
        Google Calendar
      </Text>

      <Text style={styles.calendarDescription}>
        {profile.googleCalendarConnected
          ? "Calendar connected — availability loaded"
          : "Find free time for dining recommendations"}
      </Text>

    </View>


    <Text
      style={[
        styles.connectText,

        profile.googleCalendarConnected &&
          styles.connectedText,
      ]}
    >
      {connecting
        ? "Connecting..."
        : profile.googleCalendarConnected
        ? "Refresh"
        : "Connect"}
    </Text>

  </Pressable>


  {profile.googleCalendarConnected && (

    <View style={styles.calendarStatus}>

      <Text style={styles.calendarStatusTitle}>
        Calendar availability ready
      </Text>

      <Text style={styles.calendarStatusDescription}>
        {profile.freeTimeBlocks.length}{" "}
        free time{" "}
        {profile.freeTimeBlocks.length === 1
          ? "block"
          : "blocks"}{" "}
        found.
      </Text>

    </View>

  )}


  {notice && (

    <Text style={styles.calendarNotice}>
      {notice}
    </Text>

  )}

            </View>

          </View>

        </ScrollView>


        {/* ================================= */}
        {/* FOOTER                            */}
        {/* ================================= */}

        <View
          style={styles.footer}
        >

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >

            <Text
              style={styles.backText}
            >
              Back
            </Text>

          </Pressable>


          <Pressable
            style={
              styles.continueButton
            }
            onPress={
              handleContinue
            }
          >

            <Text
              style={
                styles.continueText
              }
            >
              Continue
            </Text>

            <Text
              style={styles.footerArrow}
            >
              ›
            </Text>

          </Pressable>

        </View>

      </View>

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
/* STEPPER                                      */
/* ============================================ */

function Step({
  number,
  label,
  active = false,
  completed = false,
}: {
  number: string;
  label: string;
  active?: boolean;
  completed?: boolean;
}) {

  const highlighted =
    active || completed;

  return (

    <View style={styles.step}>

      <View
        style={[
          styles.stepCircle,

          highlighted &&
            styles.stepCircleActive,
        ]}
      >

        <Text
          style={[
            styles.stepNumber,

            highlighted &&
              styles.stepNumberActive,
          ]}
        >
          {number}
        </Text>

      </View>


      <Text
        style={[
          styles.stepLabel,

          highlighted &&
            styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>

    </View>

  );
}


/* ============================================ */
/* STYLES                                       */
/* ============================================ */

const styles = StyleSheet.create({

  safeArea: {
    flex: 1,
    backgroundColor: "#FBFBF8",
  },

  container: {
    flex: 1,
    backgroundColor: "#FBFBF8",
  },


  /* HEADER */

  header: {
    height: 70,

    paddingHorizontal: 22,

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
    width: 27,
    height: 27,

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

  stepText: {
    color: colors.muted,

    fontSize: 10,
    fontWeight: "600",
  },


  /* STEPPER */

  stepper: {
    flexDirection: "row",
    justifyContent: "space-between",

    paddingHorizontal: 27,
    paddingTop: 4,
    paddingBottom: 14,

    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },

  step: {
    width: 65,

    alignItems: "center",

    gap: 5,
  },

  stepCircle: {
    width: 27,
    height: 27,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#D9DCDF",

    borderRadius: 14,

    backgroundColor: "#FBFBF8",
  },

  stepCircleActive: {
    borderColor: colors.maize,
    backgroundColor: colors.maize,
  },

  stepNumber: {
    color: "#A3A8AF",

    fontSize: 8,
    fontWeight: "700",
  },

  stepNumberActive: {
    color: colors.navy,
  },

  stepLabel: {
    color: "#A3A8AF",

    fontSize: 8,
    fontWeight: "600",
  },

  stepLabelActive: {
    color: colors.navy,
    fontWeight: "700",
  },


  /* CONTENT */

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 110,
  },

  content: {
    width: "100%",

    paddingHorizontal: 24,
    paddingTop: 27,
  },

  eyebrow: {
    color: "#777F89",

    fontSize: 10,
    fontWeight: "700",

    letterSpacing: 1.5,
  },

  title: {
    marginTop: 7,
    marginBottom: 8,

    color: colors.navy,

    fontSize: 29,
    lineHeight: 34,

    fontWeight: "800",

    letterSpacing: -1.1,
  },

  description: {
    marginBottom: 25,

    color: colors.muted,

    fontSize: 12,
    lineHeight: 19,
  },


  /* ========================================== */
  /* CALORIE CARD                               */
  /* ========================================== */

  calorieCard: {
    padding: 19,

    alignItems: "center",

    borderWidth: 1,
    borderColor: "#DFD08B",
    borderRadius: 18,

    backgroundColor: "#FFFBE5",
  },

  calorieLabel: {
    color: "#8A7B45",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1.3,
  },

  calorieControls: {
    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 25,

    marginTop: 10,
    marginBottom: 1,
  },

  calorieButton: {
    width: 33,
    height: 33,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#E0D5A9",
    borderRadius: 17,

    backgroundColor: "#FFFFFF",
  },

  calorieButtonText: {
    color: colors.navy,

    fontSize: 18,
    lineHeight: 20,

    fontWeight: "600",
  },

  calorieInput: {
    width: 112,

    paddingHorizontal: 5,
    paddingVertical: 3,

    borderBottomWidth: 2,
    borderBottomColor: "#DFCF87",

    color: colors.navy,

    fontSize: 30,
    fontWeight: "800",

    letterSpacing: -1,

    textAlign: "center",
  },

  calorieUnit: {
    color: "#887C57",

    fontSize: 9,
  },

  recommendationRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 5,

    marginTop: 13,
    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: "#EADFAB",
  },

  sparkle: {
    color: "#756836",

    fontSize: 15,
  },

  recommendationText: {
    color: "#756836",

    fontSize: 9,
  },


  /* ========================================== */
  /* FOOD PREFERENCES                           */
  /* ========================================== */

  preferenceSection: {
    marginTop: 24,
  },

  fieldLabel: {
    marginBottom: 7,

    color: "#59616D",

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 1.2,
  },

  preferenceDescription: {
    marginBottom: 11,

    color: colors.muted,

    fontSize: 10,
    lineHeight: 15,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",

    gap: 4,

    paddingHorizontal: 11,
    paddingVertical: 9,

    borderWidth: 1,
    borderColor: "#DADDDF",
    borderRadius: 10,

    backgroundColor: "#FFFFFF",
  },

  selectedChip: {
    borderColor: "#D8B900",

    backgroundColor: "#FFF7CF",
  },

  chipText: {
    color: "#5E6671",

    fontSize: 10,
  },

  selectedChipText: {
    color: "#6D5800",

    fontWeight: "700",
  },

  checkmark: {
    color: "#6D5800",

    fontSize: 11,
    fontWeight: "800",
  },


  /* ========================================== */
  /* GOOGLE CALENDAR                            */
  /* ========================================== */

  scheduleSection: {
    marginTop: 24,
  },

  calendarRow: {
    width: "100%",

    flexDirection: "row",
    alignItems: "center",

    gap: 11,

    padding: 11,

    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,

    backgroundColor: "#FFFFFF",
  },

  calendarIcon: {
    width: 37,
    height: 37,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 10,

    backgroundColor: "#EEF2F7",
  },

  calendarIconText: {
    color: "#3770AD",

    fontSize: 18,
    fontWeight: "700",
  },

  calendarCopy: {
    flex: 1,
  },

  calendarTitle: {
    color: colors.navy,

    fontSize: 11,
    fontWeight: "700",
  },

  calendarDescription: {
    marginTop: 2,

    color: colors.muted,

    fontSize: 8,
    lineHeight: 12,
  },

  connectText: {
    color: colors.blue,

    fontSize: 9,
    fontWeight: "700",
  },

  connectedText: {
    color: colors.green,
  },
  calendarNotice: {
  marginTop: 8,
  color: colors.muted,
  fontSize: 8,
  lineHeight: 12,
},

  /* Calendar connected status */

  calendarStatus: {
    marginTop: 9,

    paddingHorizontal: 12,
    paddingVertical: 10,

    borderWidth: 1,
    borderColor: "#CFE2D8",
    borderRadius: 10,

    backgroundColor: "#F1F8F4",
  },

  calendarStatusTitle: {
    color: colors.green,

    fontSize: 9,
    fontWeight: "700",
  },

  calendarStatusDescription: {
    marginTop: 2,

    color: "#6D7A74",

    fontSize: 8,
  },


  /* ========================================== */
  /* FOOTER                                     */
  /* ========================================== */

  footer: {
    position: "absolute",

    bottom: 0,
    left: 0,
    right: 0,

    flexDirection: "row",

    gap: 10,

    paddingHorizontal: 24,
    paddingTop: 15,
    paddingBottom: 20,

    borderTopWidth: 1,
    borderTopColor: colors.line,

    backgroundColor: "#FBFBF8",
  },

  backButton: {
    width: 82,
    height: 45,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 1,
    borderColor: "#D8DBDE",
    borderRadius: 11,

    backgroundColor: "#FFFFFF",
  },

  backText: {
    color: "#68717D",

    fontSize: 11,
    fontWeight: "700",
  },

  continueButton: {
    flex: 1,
    height: 45,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    borderRadius: 11,

    backgroundColor: colors.navy,
  },

  continueText: {
    color: "#FFFFFF",

    fontSize: 11,
    fontWeight: "700",
  },

  footerArrow: {
    color: "#FFFFFF",

    fontSize: 19,
    fontWeight: "600",
  },
});