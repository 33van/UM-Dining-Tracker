import { useState } from "react";
import { createUserPlan } from "../../services/userPlan";

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
import { useOnboarding } from "../../context/OnboardingContext";

import type {
  RecommendationWindow,
} from "../../types/UserProfile";


const DEFAULT_WINDOWS: RecommendationWindow[] = [
  {
    start: "09:00",
    end: "13:00",
  },
];


export default function PlanScreen() {
  const {
    profile,
    setPlanInfo,
  } = useOnboarding();

  const [buildingPlan, setBuildingPlan] =
  useState(false);


  const [
  recommendationWindows,
  setRecommendationWindows,
] = useState<RecommendationWindow[]>(
  profile.recommendationWindows?.length
    ? profile.recommendationWindows
    : DEFAULT_WINDOWS
);


  const [
    allowLocationRecommendations,
    setAllowLocationRecommendations,
  ] = useState(
    profile.allowLocationRecommendations ?? true
  );


  /* ========================================== */
  /* TIME INPUT                                 */
  /* ========================================== */

  function formatTimeInput(
    input: string
  ): string {
    const digits = input
      .replace(/\D/g, "")
      .slice(0, 4);

    if (digits.length <= 2) {
      return digits;
    }

    return `${digits.slice(0, 2)}:${digits.slice(2)}`;
  }


  function isValidTime(
    time: string
  ): boolean {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      time
    );
  }


  function timeToMinutes(
    time: string
  ) {
    const [hour, minute] =
      time.split(":").map(Number);

    return hour * 60 + minute;
  }


  function updateWindow(
    index: number,
    field: "start" | "end",
    value: string
  ) {
    setRecommendationWindows(
      (current) =>
        current.map(
          (window, windowIndex) =>
            windowIndex === index
              ? {
                  ...window,
                  [field]:
                    formatTimeInput(value),
                }
              : window
        )
    );
  }


  /* ========================================== */
  /* ADD / REMOVE WINDOWS                       */
  /* ========================================== */

  function addWindow() {
    if (
      recommendationWindows.length >= 3
    ) {
      Alert.alert(
        "Maximum reached",
        "You can add up to three recommendation windows."
      );

      return;
    }


    const defaults = [
      {
        start: "14:00",
        end: "16:00",
      },

      {
        start: "17:00",
        end: "21:00",
      },
    ];


    const next =
      defaults[
        recommendationWindows.length - 1
      ] ?? {
        start: "17:00",
        end: "21:00",
      };


    setRecommendationWindows(
      (current) => [
        ...current,
        next,
      ]
    );
  }


  function removeWindow(
    index: number
  ) {
    setRecommendationWindows(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index
        )
    );
  }


  /* ========================================== */
  /* BUILD PLAN                                 */
  /* ========================================== */

  async function handleBuildPlan() {
  // Validate recommendation windows
  for (const window of recommendationWindows) {
    if (
      !isValidTime(window.start) ||
      !isValidTime(window.end)
    ) {
      Alert.alert(
        "Invalid time",
        "Please enter a valid start and end time."
      );
      return;
    }

    if (
      timeToMinutes(window.end) <=
      timeToMinutes(window.start)
    ) {
      Alert.alert(
        "Invalid window",
        "Each recommendation window must end after it starts."
      );
      return;
    }
  }

  const planInfo = {
    recommendationWindows,
    allowLocationRecommendations,
  };

  const completedProfile = {
    ...profile,
    ...planInfo,
  };

  console.log(
    "SENDING USER PROFILE TO BACKEND:"
  );

  console.log(
    JSON.stringify(
      completedProfile,
      null,
      2
    )
  );

  try {
    setBuildingPlan(true);

    // Send complete UserProfile to backend
    await createUserPlan(
      completedProfile
    );

    // Save Plan information locally
    setPlanInfo(
      planInfo
    );

    // Go to homepage
    router.replace("/dashboard");

  } catch (error) {
    console.error(
      "BUILD PLAN ERROR:",
      error
    );

    Alert.alert(
      "Couldn't build your plan",
      error instanceof Error
        ? error.message
        : "Please try again."
    );

  } finally {
    setBuildingPlan(false);
  }
}


  return (
    <SafeAreaView
      style={styles.safeArea}
    >

      <View
        style={styles.container}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <Brand />

          <Text style={styles.stepText}>
            Step 4 of 4
          </Text>

        </View>


        {/* STEPPER */}

        <View style={styles.stepper}>

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
            number="✓"
            label="Goals"
            completed
          />

          <Step
            number="04"
            label="Plan"
            active
          />

        </View>


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

          <View style={styles.content}>

            {/* PHOTON BRAND */}

            <View
              style={styles.photonBrand}
            >

              <Text
                style={styles.poweredBy}
              >
                POWERED BY
              </Text>

              <View
                style={
                  styles.photonBrandRow
                }
              >

                <Text
                  style={
                    styles.photonSparkle
                  }
                >
                  ✦
                </Text>

                <Text
                  style={
                    styles.photonBrandName
                  }
                >
                  Photon
                </Text>

              </View>

            </View>


            {/* TITLE */}

            <Text style={styles.eyebrow}>
              YOUR DAILY COACH
            </Text>

            <Text style={styles.title}>
              Smart recommendations,
              right on time.
            </Text>

            <Text style={styles.description}>
              Photon uses your free time,
              location, and dining hall menus
              to build a practical daily plan.
            </Text>


            {/* PREVIEW */}

            <View
              style={
                styles.recommendationCard
              }
            >

              <View
                style={
                  styles.recommendationTop
                }
              >

                <Text
                  style={
                    styles.recommendationTime
                  }
                >
                  12:30
                </Text>

                <View
                  style={styles.freeBadge}
                >

                  <Text
                    style={
                      styles.freeBadgeText
                    }
                  >
                    FREE BLOCK · 90 MIN
                  </Text>

                </View>

              </View>


              <Text
                style={
                  styles.recommendationTitle
                }
              >
                Lunch at South Quad
              </Text>


              <View
                style={
                  styles.recommendationBottom
                }
              >

                <Text
                  style={
                    styles.recommendationMeta
                  }
                >
                  6 min walk · 3 vegetarian
                  matches
                </Text>


                <View
                  style={styles.matchBadge}
                >

                  <Text
                    style={
                      styles.matchText
                    }
                  >
                    92% match
                  </Text>

                </View>

              </View>

            </View>


            {/* WINDOWS */}

            <View
              style={styles.windowSection}
            >

              <Text
                style={styles.fieldLabel}
              >
                RECOMMENDATION WINDOWS
              </Text>

              <Text
                style={styles.fieldHelp}
              >
                Add up to three times Photon
                can message you.
              </Text>


              {recommendationWindows.map(
                (window, index) => (

                  <View
                    key={index}
                    style={styles.windowRow}
                  >

                    <View
                      style={styles.timeField}
                    >

                      <Text
                        style={
                          styles.timeLabel
                        }
                      >
                        START
                      </Text>

                      <TextInput
                        style={
                          styles.timeInput
                        }
                        value={window.start}
                        onChangeText={(text) =>
                          updateWindow(
                            index,
                            "start",
                            text
                          )
                        }
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholder="09:00"
                        placeholderTextColor="#A3A8AF"
                      />

                    </View>


                    <Text
                      style={
                        styles.windowArrow
                      }
                    >
                      →
                    </Text>


                    <View
                      style={styles.timeField}
                    >

                      <Text
                        style={
                          styles.timeLabel
                        }
                      >
                        END
                      </Text>

                      <TextInput
                        style={
                          styles.timeInput
                        }
                        value={window.end}
                        onChangeText={(text) =>
                          updateWindow(
                            index,
                            "end",
                            text
                          )
                        }
                        keyboardType="number-pad"
                        maxLength={5}
                        placeholder="13:00"
                        placeholderTextColor="#A3A8AF"
                      />

                    </View>


                    {recommendationWindows.length >
                      1 && (

                      <Pressable
                        style={
                          styles.removeButton
                        }
                        onPress={() =>
                          removeWindow(index)
                        }
                      >

                        <Text
                          style={
                            styles.removeText
                          }
                        >
                          ×
                        </Text>

                      </Pressable>

                    )}

                  </View>

                )
              )}


              {recommendationWindows.length <
                3 && (

                <Pressable
                  style={styles.addButton}
                  onPress={addWindow}
                >

                  <Text
                    style={styles.addIcon}
                  >
                    +
                  </Text>

                  <Text
                    style={styles.addText}
                  >
                    Add another window
                  </Text>

                </Pressable>

              )}

            </View>


            {/* LOCATION */}

            <Pressable
              style={styles.locationCard}
              onPress={() =>
                setAllowLocationRecommendations(
                  (current) => !current
                )
              }
            >

              <View
                style={[
                  styles.checkbox,

                  allowLocationRecommendations &&
                    styles.checkboxSelected,
                ]}
              >

                {allowLocationRecommendations && (

                  <Text
                    style={
                      styles.checkboxCheck
                    }
                  >
                    ✓
                  </Text>

                )}

              </View>


              <View
                style={styles.locationCopy}
              >

                <Text
                  style={
                    styles.locationTitle
                  }
                >
                  Allow location-based dining
                  recommendations
                </Text>

                <Text
                  style={
                    styles.locationDescription
                  }
                >
                  During my selected hours.
                </Text>

              </View>

            </Pressable>

          </View>

        </ScrollView>


        {/* FOOTER */}

        <View style={styles.footer}>

          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >

            <Text style={styles.backText}>
              Back
            </Text>

          </Pressable>


         <Pressable
            style={[
              styles.buildButton,
              buildingPlan && {
                opacity: 0.6,
              },
            ]}
            disabled={buildingPlan}
            onPress={handleBuildPlan}
          >
            <Text style={styles.buildSparkle}>
              ✦
            </Text>

            <Text style={styles.buildText}>
              {buildingPlan
                ? "Building your plan..."
                : "Build my plan"}
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
    paddingBottom: 115,
  },

    content: {
    width: "100%",
    paddingHorizontal: 24,
    paddingTop: 27,
  },


  /* ========================================== */
  /* PHOTON BRAND                               */
  /* ========================================== */

  photonBrand: {
    alignItems: "center",
    marginBottom: 24,
  },

  poweredBy: {
    color: "#8B9199",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1.4,
  },

  photonBrandRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    marginTop: 4,
  },

  photonSparkle: {
    color: colors.blue,

    fontSize: 17,
    fontWeight: "800",
  },

  photonBrandName: {
    color: colors.navy,

    fontSize: 16,
    fontWeight: "800",
  },


  /* ========================================== */
  /* TITLE                                      */
  /* ========================================== */

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
    marginBottom: 22,

    color: colors.muted,

    fontSize: 12,
    lineHeight: 19,
  },


  /* ========================================== */
  /* RECOMMENDATION PREVIEW                     */
  /* ========================================== */

  recommendationCard: {
    padding: 16,

    borderWidth: 1,
    borderColor: "#DCE0E4",

    borderRadius: 16,

    backgroundColor: "#FFFFFF",
  },

  recommendationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    marginBottom: 15,
  },

  recommendationTime: {
    color: colors.navy,

    fontSize: 22,
    fontWeight: "800",

    letterSpacing: -0.5,
  },

  freeBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: "#EDF6F1",
  },

  freeBadgeText: {
    color: colors.green,

    fontSize: 7,
    fontWeight: "800",

    letterSpacing: 0.8,
  },

  recommendationTitle: {
    color: colors.navy,

    fontSize: 15,
    fontWeight: "800",
  },

  recommendationBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    gap: 10,

    marginTop: 6,
  },

  recommendationMeta: {
    flex: 1,

    color: colors.muted,

    fontSize: 9,
    lineHeight: 13,
  },

  matchBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 8,

    backgroundColor: "#FFF5C7",
  },

  matchText: {
    color: "#786300",

    fontSize: 8,
    fontWeight: "700",
  },


  /* ========================================== */
  /* RECOMMENDATION WINDOWS                     */
  /* ========================================== */

  windowSection: {
    marginTop: 25,
  },

  fieldLabel: {
    marginBottom: 5,

    color: "#59616D",

    fontSize: 9,
    fontWeight: "700",

    letterSpacing: 1.2,
  },

  fieldHelp: {
    marginBottom: 13,

    color: colors.muted,

    fontSize: 10,
    lineHeight: 15,
  },

  windowRow: {
    flexDirection: "row",
    alignItems: "flex-end",

    gap: 8,

    marginBottom: 11,
  },

  timeField: {
    flex: 1,
  },

  timeLabel: {
    marginBottom: 5,

    color: "#7B828C",

    fontSize: 8,
    fontWeight: "700",

    letterSpacing: 1,
  },

  timeInput: {
    height: 43,

    paddingHorizontal: 8,

    borderWidth: 1,
    borderColor: "#D8DBDF",

    borderRadius: 10,

    backgroundColor: "#FFFFFF",

    color: colors.navy,

    fontSize: 12,
    fontWeight: "700",

    textAlign: "center",
  },

  windowArrow: {
    marginBottom: 11,

    color: "#9298A0",

    fontSize: 15,
  },

  removeButton: {
    width: 27,
    height: 43,

    alignItems: "center",
    justifyContent: "center",
  },

  removeText: {
    color: "#A76A63",

    fontSize: 20,
    fontWeight: "500",
  },


  /* ========================================== */
  /* ADD WINDOW                                 */
  /* ========================================== */

  addButton: {
    height: 39,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    marginTop: 2,

    borderWidth: 1,
    borderColor: "#D8DBDF",
    borderStyle: "dashed",

    borderRadius: 10,

    backgroundColor: "#FFFFFF",
  },

  addIcon: {
    color: colors.blue,

    fontSize: 17,
    fontWeight: "600",
  },

  addText: {
    color: colors.blue,

    fontSize: 10,
    fontWeight: "700",
  },


  /* ========================================== */
  /* LOCATION                                   */
  /* ========================================== */

  locationCard: {
    flexDirection: "row",
    alignItems: "flex-start",

    gap: 10,

    marginTop: 20,

    padding: 13,

    borderWidth: 1,
    borderColor: "#DDE1E5",

    borderRadius: 13,

    backgroundColor: "#FFFFFF",
  },

  checkbox: {
    width: 19,
    height: 19,

    alignItems: "center",
    justifyContent: "center",

    marginTop: 1,

    borderWidth: 1,
    borderColor: "#C9CDD2",

    borderRadius: 5,

    backgroundColor: "#FFFFFF",
  },

  checkboxSelected: {
    borderColor: colors.navy,

    backgroundColor: colors.navy,
  },

  checkboxCheck: {
    color: colors.maize,

    fontSize: 11,
    fontWeight: "900",
  },

  locationCopy: {
    flex: 1,
  },

  locationTitle: {
    color: colors.navy,

    fontSize: 10,
    fontWeight: "700",

    lineHeight: 14,
  },

  locationDescription: {
    marginTop: 2,

    color: colors.muted,

    fontSize: 9,
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

  buildButton: {
    flex: 1,
    height: 45,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    borderRadius: 11,

    backgroundColor: colors.navy,
  },

  buildSparkle: {
    color: colors.maize,

    fontSize: 15,
    fontWeight: "800",
  },

  buildText: {
    color: "#FFFFFF",

    fontSize: 11,
    fontWeight: "700",
  },
});