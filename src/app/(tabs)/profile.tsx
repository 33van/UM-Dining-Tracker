import { useState } from "react";

import {
    Alert,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";

import type {
    Gender,
    RecommendationWindow,
} from "../../types/UserProfile";

const CONDITIONS = [
  "Iron deficiency",
  "Vitamin A deficiency",
  "Vitamin C deficiency",
  "Lactose intolerance",
  "Diabetes",
  "High cholesterol",
];

const GENDERS: Gender[] = [
  "Woman",
  "Man",
  "Non-binary",
  "Prefer not to say",
];

export default function ProfileScreen() {
  /*
   * Using the full onboarding object lets this file work
   * with your existing setBodyInfo / setPlanInfo setters.
   *
   * If you added updateProfile() to the context, this file
   * will use that too.
   */
  const onboarding = useOnboarding() as any;

  const {
    profile,
    setBodyInfo,
    setPlanInfo,
  } = onboarding;

  /* ========================================== */
  /* EDITABLE PROFILE STATE                     */
  /* ========================================== */

  const [heightFeet, setHeightFeet] =
    useState(
      profile.heightFeet?.toString() ?? ""
    );

  const [heightInches, setHeightInches] =
    useState(
      profile.heightInches?.toString() ?? ""
    );

  const [weight, setWeight] =
    useState(
      profile.weightLbs?.toString() ?? ""
    );

  const [age, setAge] =
    useState(
      profile.age?.toString() ?? ""
    );

  const [gender, setGender] =
    useState<Gender>(
      profile.gender ?? "Woman"
    );

  const [calorieGoal, setCalorieGoal] =
    useState(
      String(
        profile.calorieGoal ?? 2150
      )
    );

  const [conditions, setConditions] =
    useState<string[]>(
      profile.healthConsiderations ?? []
    );

    const [allergies, setAllergies] =
    useState<string>(
        profile.allergies?.join(", ") ?? ""
    );

  const [
    recommendationWindows,
    setRecommendationWindows,
  ] = useState<RecommendationWindow[]>(
    profile.recommendationWindows?.length
      ? profile.recommendationWindows
      : [
          {
            start: "09:00",
            end: "13:00",
          },
        ]
  );

  const [
    allowLocationRecommendations,
    setAllowLocationRecommendations,
  ] = useState(
    profile.allowLocationRecommendations ??
      true
  );

  const [saving, setSaving] =
    useState(false);

  /* ========================================== */
  /* CONDITIONS                                 */
  /* ========================================== */

  function toggleCondition(
    condition: string
  ) {
    setConditions((current) => {
      if (
        current.includes(condition)
      ) {
        return current.filter(
          (item) =>
            item !== condition
        );
      }

      return [
        ...current,
        condition,
      ];
    });
  }

  /* ========================================== */
  /* CALORIES                                   */
  /* ========================================== */

  function decreaseCalories() {
    const current =
      Number(calorieGoal) || 2150;

    const next =
      Math.max(
        1000,
        current - 50
      );

    setCalorieGoal(
      String(next)
    );
  }

  function increaseCalories() {
    const current =
      Number(calorieGoal) || 2150;

    const next =
      Math.min(
        5000,
        current + 50
      );

    setCalorieGoal(
      String(next)
    );
  }

  /* ========================================== */
  /* RECOMMENDATION WINDOWS                     */
  /* ========================================== */

  function formatTimeInput(
    input: string
  ) {
    const digits =
      input
        .replace(/\D/g, "")
        .slice(0, 4);

    if (
      digits.length <= 2
    ) {
      return digits;
    }

    return `${digits.slice(
      0,
      2
    )}:${digits.slice(2)}`;
  }

  function updateWindow(
    index: number,
    field: "start" | "end",
    value: string
  ) {
    setRecommendationWindows(
      (current) =>
        current.map(
          (
            window,
            windowIndex
          ) =>
            windowIndex === index
              ? {
                  ...window,

                  [field]:
                    formatTimeInput(
                      value
                    ),
                }
              : window
        )
    );
  }

  function addWindow() {
    if (
      recommendationWindows.length >= 3
    ) {
      Alert.alert(
        "Maximum reached",
        "You can have up to three recommendation windows."
      );

      return;
    }

    setRecommendationWindows(
      (current) => [
        ...current,

        {
          start: "17:00",
          end: "21:00",
        },
      ]
    );
  }

  function removeWindow(
    index: number
  ) {
    if (
      recommendationWindows.length <= 1
    ) {
      Alert.alert(
        "One window required",
        "Keep at least one recommendation window."
      );

      return;
    }

    setRecommendationWindows(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index
        )
    );
  }

  function isValidTime(
    value: string
  ) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
      value
    );
  }

  function timeToMinutes(
    value: string
  ) {
    const [hour, minute] =
      value
        .split(":")
        .map(Number);

    return (
      hour * 60 +
      minute
    );
  }

  /* ========================================== */
  /* SAVE PROFILE                               */
  /* ========================================== */

  async function saveChanges() {
    Keyboard.dismiss();

    const feet =
      Number(heightFeet);

    const inches =
      Number(heightInches);

    const weightNumber =
      Number(weight);

    const ageNumber =
      Number(age);

    const calorieNumber =
      Number(calorieGoal);

    /* ---------------------------------------- */
    /* VALIDATION                               */
    /* ---------------------------------------- */

    if (
      !heightFeet ||
      Number.isNaN(feet) ||
      feet <= 0
    ) {
      Alert.alert(
        "Invalid height",
        "Enter a valid height in feet."
      );

      return;
    }

    if (
      Number.isNaN(inches) ||
      inches < 0 ||
      inches > 11
    ) {
      Alert.alert(
        "Invalid height",
        "Height inches must be between 0 and 11."
      );

      return;
    }

    if (
      !weight ||
      Number.isNaN(
        weightNumber
      ) ||
      weightNumber <= 0
    ) {
      Alert.alert(
        "Invalid weight",
        "Enter a valid weight."
      );

      return;
    }

    if (
      !age ||
      Number.isNaN(
        ageNumber
      ) ||
      ageNumber <= 0
    ) {
      Alert.alert(
        "Invalid age",
        "Enter a valid age."
      );

      return;
    }

    if (
      !calorieGoal ||
      Number.isNaN(
        calorieNumber
      ) ||
      calorieNumber < 1000 ||
      calorieNumber > 5000
    ) {
      Alert.alert(
        "Invalid calorie goal",
        "Enter a calorie goal between 1,000 and 5,000."
      );

      return;
    }

    for (
      const window
      of recommendationWindows
    ) {
      if (
        !isValidTime(
          window.start
        ) ||
        !isValidTime(
          window.end
        )
      ) {
        Alert.alert(
          "Invalid time",
          "Enter recommendation times in 24-hour format, such as 09:00 or 17:30."
        );

        return;
      }

      if (
        timeToMinutes(
          window.end
        ) <=
        timeToMinutes(
          window.start
        )
      ) {
        Alert.alert(
          "Invalid window",
          "Each recommendation window must end after it starts."
        );

        return;
      }
    }

    /* ---------------------------------------- */
    /* ALLERGIES                                */
    /* ---------------------------------------- */

    const allergyList = [
      ...new Set(
        allergies
          .split(",")
          .map((item) =>
            item
              .trim()
              .toLowerCase()
          )
          .filter(Boolean)
      ),
    ];

    /* ---------------------------------------- */
    /* CREATE UPDATED PROFILE                   */
    /* ---------------------------------------- */

    const bodyInfo = {
      heightFeet: feet,

      heightInches:
        inches,

      weightLbs:
        weightNumber,

      age:
        ageNumber,

      gender,

      healthConsiderations:
        conditions,

      allergies:
        allergyList,
    };

    const planInfo = {
      recommendationWindows,

      allowLocationRecommendations,
    };

    const updatedFields = {
      ...bodyInfo,

      ...planInfo,

      calorieGoal:
        calorieNumber,
    };

    try {
      setSaving(true);

      /*
       * BEST OPTION:
       *
       * If you added updateProfile() to your
       * OnboardingContext, use it.
       */
      if (
        typeof onboarding.updateProfile ===
        "function"
      ) {
        onboarding.updateProfile(
          updatedFields
        );
      } else {
        /*
         * Fall back to the setters you already
         * have in your app.
         */
        setBodyInfo(
          bodyInfo
        );

        setPlanInfo(
          planInfo
        );

        /*
         * Support several possible names for
         * your Goals-screen setter.
         */
        if (
          typeof onboarding.setGoalInfo ===
          "function"
        ) {
          onboarding.setGoalInfo({
            calorieGoal:
              calorieNumber,
          });
        } else if (
          typeof onboarding.setGoals ===
          "function"
        ) {
          onboarding.setGoals({
            calorieGoal:
              calorieNumber,
          });
        } else if (
          typeof onboarding.setGoalData ===
          "function"
        ) {
          onboarding.setGoalData({
            calorieGoal:
              calorieNumber,
          });
        } else {
          /*
           * Your setBodyInfo implementation most
           * likely merges its object into profile.
           * This fallback allows calorieGoal to be
           * included as well.
           */
          (setBodyInfo as any)({
            ...bodyInfo,

            calorieGoal:
              calorieNumber,
          });
        }
      }

      const finalProfile = {
        ...profile,

        ...updatedFields,
      };

      console.log(
        "================================="
      );

      console.log(
        "PROFILE UPDATED"
      );

      console.log(
        JSON.stringify(
          finalProfile,
          null,
          2
        )
      );

      console.log(
        "================================="
      );

      Alert.alert(
        "Profile updated",
        "Your changes have been saved."
      );
    } catch (error) {
      console.error(
        "PROFILE SAVE ERROR:",
        error
      );

      Alert.alert(
        "Could not save",
        "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
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
      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
        <ScrollView
          style={
            styles.scroll
          }
          contentContainerStyle={
            styles.content
          }
          showsVerticalScrollIndicator={
            false
          }
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={
            Platform.OS === "ios"
              ? "interactive"
              : "on-drag"
          }
        >
          {/* ================================= */}
          {/* HEADER                            */}
          {/* ================================= */}

          <View
            style={
              styles.header
            }
          >
            <Brand />

            <View
              style={
                styles.editingBadge
              }
            >
              <Text
                style={
                  styles.editingBadgeText
                }
              >
                EDIT PROFILE
              </Text>
            </View>
          </View>

          {/* ================================= */}
          {/* PROFILE INTRO                     */}
          {/* ================================= */}

          <View
            style={
              styles.profileIntro
            }
          >
            <View
              style={
                styles.avatar
              }
            >
              <Text
                style={
                  styles.avatarText
                }
              >
                M
              </Text>
            </View>

            <View
              style={
                styles.profileIntroText
              }
            >
              <Text
                style={
                  styles.eyebrow
                }
              >
                MY PROFILE
              </Text>

              <Text
                style={
                  styles.title
                }
              >
                Your information
              </Text>

              <Text
                style={
                  styles.verified
                }
              >
                ✓ Verified account
              </Text>
            </View>
          </View>

          {/* ================================= */}
          {/* DAILY CALORIE GOAL                */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            DAILY TARGET
          </Text>

          <View
            style={
              styles.calorieCard
            }
          >
            <Text
              style={
                styles.calorieLabel
              }
            >
              DAILY CALORIE GOAL
            </Text>

            <View
              style={
                styles.calorieEditRow
              }
            >
              <Pressable
                style={
                  styles.calorieButton
                }
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

              <View
                style={
                  styles.calorieInputContainer
                }
              >
                <TextInput
                  style={
                    styles.calorieInput
                  }
                  value={
                    calorieGoal
                  }
                  onChangeText={
                    setCalorieGoal
                  }
                  keyboardType="number-pad"
                  textAlign="center"
                  selectTextOnFocus
                />

                <Text
                  style={
                    styles.calorieUnit
                  }
                >
                  kcal / day
                </Text>
              </View>

              <Pressable
                style={
                  styles.calorieButton
                }
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
          </View>

          {/* ================================= */}
          {/* BODY STATS                        */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            BODY & HEALTH
          </Text>

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.formRow
              }
            >
              <View
                style={
                  styles.formField
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  HEIGHT · FEET
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    heightFeet
                  }
                  onChangeText={
                    setHeightFeet
                  }
                  keyboardType="number-pad"
                  placeholder="5"
                  placeholderTextColor="#A0A5AB"
                />
              </View>

              <View
                style={
                  styles.formField
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  HEIGHT · INCHES
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    heightInches
                  }
                  onChangeText={
                    setHeightInches
                  }
                  keyboardType="number-pad"
                  placeholder="7"
                  placeholderTextColor="#A0A5AB"
                  maxLength={2}
                />
              </View>
            </View>

            <View
              style={
                styles.formRow
              }
            >
              <View
                style={
                  styles.formField
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  WEIGHT · LB
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    weight
                  }
                  onChangeText={
                    setWeight
                  }
                  keyboardType="decimal-pad"
                  placeholder="145"
                  placeholderTextColor="#A0A5AB"
                />
              </View>

              <View
                style={
                  styles.formField
                }
              >
                <Text
                  style={
                    styles.inputLabel
                  }
                >
                  AGE
                </Text>

                <TextInput
                  style={
                    styles.input
                  }
                  value={
                    age
                  }
                  onChangeText={
                    setAge
                  }
                  keyboardType="number-pad"
                  placeholder="20"
                  placeholderTextColor="#A0A5AB"
                  maxLength={3}
                />
              </View>
            </View>

            {/* GENDER */}

            <Text
              style={
                styles.inputLabel
              }
            >
              GENDER
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {GENDERS.map(
                (option) => {
                  const selected =
                    gender ===
                    option;

                  return (
                    <Pressable
                      key={
                        option
                      }
                      style={[
                        styles.chip,

                        selected &&
                          styles.selectedChip,
                      ]}
                      onPress={() =>
                        setGender(
                          option
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,

                          selected &&
                            styles.selectedChipText,
                        ]}
                      >
                        {selected
                          ? "✓ "
                          : ""}

                        {option}
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          {/* ================================= */}
          {/* HEALTH CONDITIONS                 */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            CONDITIONS & CONSIDERATIONS
          </Text>

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.helpText
              }
            >
              Select any conditions that
              should affect your meal
              recommendations.
            </Text>

            <View
              style={
                styles.chips
              }
            >
              {CONDITIONS.map(
                (
                  condition
                ) => {
                  const selected =
                    conditions.includes(
                      condition
                    );

                  return (
                    <Pressable
                      key={
                        condition
                      }
                      style={[
                        styles.chip,

                        selected &&
                          styles.selectedChip,
                      ]}
                      onPress={() =>
                        toggleCondition(
                          condition
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,

                          selected &&
                            styles.selectedChipText,
                        ]}
                      >
                        {selected
                          ? "✓ "
                          : ""}

                        {
                          condition
                        }
                      </Text>
                    </Pressable>
                  );
                }
              )}
            </View>
          </View>

          {/* ================================= */}
          {/* ALLERGIES                         */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            ALLERGIES
          </Text>

          <View
            style={
              styles.card
            }
          >
            <TextInput
              style={
                styles.allergyInput
              }
              value={
                allergies
              }
              onChangeText={
                setAllergies
              }
              placeholder="Peanuts, milk, shellfish..."
              placeholderTextColor="#9BA0A7"
            />

            <Text
              style={
                styles.helpText
              }
            >
              Separate multiple allergies
              with commas. These should be
              excluded from recommendations.
            </Text>
          </View>

          {/* ================================= */}
          {/* LOCATION                          */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            LOCATION
          </Text>

          <View
            style={
              styles.card
            }
          >
            <View
              style={
                styles.switchRow
              }
            >
              <View
                style={
                  styles.switchCopy
                }
              >
                <Text
                  style={
                    styles.switchTitle
                  }
                >
                  Location-based recommendations
                </Text>

                <Text
                  style={
                    styles.switchDescription
                  }
                >
                  Use your location to find the
                  nearest open dining hall.
                </Text>
              </View>

              <Switch
                value={
                  allowLocationRecommendations
                }
                onValueChange={
                  setAllowLocationRecommendations
                }
              />
            </View>
          </View>

          {/* ================================= */}
          {/* RECOMMENDATION WINDOWS            */}
          {/* ================================= */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            RECOMMENDATION WINDOWS
          </Text>

          <View
            style={
              styles.card
            }
          >
            <Text
              style={
                styles.helpText
              }
            >
              Photon can send meal
              recommendations during these
              times.
            </Text>

            {recommendationWindows.map(
              (
                window,
                index
              ) => (
                <View
                  key={index}
                  style={
                    styles.windowRow
                  }
                >
                  <View
                    style={
                      styles.timeField
                    }
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
                      value={
                        window.start
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateWindow(
                          index,
                          "start",
                          value
                        )
                      }
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="09:00"
                      placeholderTextColor="#A0A5AB"
                    />
                  </View>

                  <Text
                    style={
                      styles.timeArrow
                    }
                  >
                    →
                  </Text>

                  <View
                    style={
                      styles.timeField
                    }
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
                      value={
                        window.end
                      }
                      onChangeText={(
                        value
                      ) =>
                        updateWindow(
                          index,
                          "end",
                          value
                        )
                      }
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholder="13:00"
                      placeholderTextColor="#A0A5AB"
                    />
                  </View>

                  {recommendationWindows.length >
                    1 && (
                    <Pressable
                      style={
                        styles.removeButton
                      }
                      onPress={() =>
                        removeWindow(
                          index
                        )
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
                style={
                  styles.addWindowButton
                }
                onPress={
                  addWindow
                }
              >
                <Text
                  style={
                    styles.addWindowText
                  }
                >
                  + Add another window
                </Text>
              </Pressable>
            )}
          </View>

          {/* ================================= */}
          {/* SAVE                              */}
          {/* ================================= */}

          <Pressable
            style={[
              styles.saveButton,

              saving &&
                styles.saveButtonDisabled,
            ]}
            disabled={
              saving
            }
            onPress={
              saveChanges
            }
          >
            <Text
              style={
                styles.saveButtonText
              }
            >
              {saving
                ? "Saving..."
                : "Save changes"}
            </Text>
          </Pressable>

          <Text
            style={
              styles.saveHelp
            }
          >
            Changes will be used for future
            dining and nutrition
            recommendations.
          </Text>

          <View
            style={
              styles.bottomSpace
            }
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
/* STYLES                                       */
/* ============================================ */

const styles =
  StyleSheet.create({
    safeArea: {
      flex: 1,

      backgroundColor:
        "#F8F8F4",
    },

    container: {
      flex: 1,
    },

    scroll: {
      flex: 1,
    },

    content: {
      paddingHorizontal: 22,

      /*
       * Gives enough space so the Save
       * button does not hide behind your
       * bottom tab navigator.
       */
      paddingBottom: 120,
    },

    /* HEADER */

    header: {
      height: 68,

      flexDirection: "row",

      alignItems: "center",

      justifyContent:
        "space-between",
    },

    brand: {
      flexDirection: "row",

      alignItems: "center",

      gap: 9,
    },

    brandMark: {
      width: 28,
      height: 28,

      borderRadius: 7,

      backgroundColor:
        colors.navy,

      alignItems: "center",

      justifyContent:
        "center",

      transform: [
        {
          rotate: "-4deg",
        },
      ],
    },

    brandM: {
      color:
        colors.maize,

      fontSize: 15,

      fontWeight: "900",
    },

    brandText: {
      color:
        colors.navy,

      fontSize: 21,

      fontWeight: "800",

      letterSpacing: -0.8,
    },

    editingBadge: {
      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 8,

      backgroundColor:
        "#FFF4C5",
    },

    editingBadgeText: {
      color:
        colors.navy,

      fontSize: 7,

      fontWeight: "800",

      letterSpacing: 1,
    },

    /* PROFILE */

    profileIntro: {
      marginTop: 15,

      marginBottom: 20,

      flexDirection: "row",

      alignItems: "center",

      gap: 14,
    },

    avatar: {
      width: 64,

      height: 64,

      borderRadius: 20,

      backgroundColor:
        colors.navy,

      alignItems: "center",

      justifyContent:
        "center",
    },

    avatarText: {
      color:
        colors.maize,

      fontSize: 29,

      fontWeight: "900",
    },

    profileIntroText: {
      flex: 1,
    },

    eyebrow: {
      color:
        "#7B828B",

      fontSize: 8,

      fontWeight: "800",

      letterSpacing: 1.2,
    },

    title: {
      marginTop: 4,

      color:
        colors.navy,

      fontSize: 25,

      fontWeight: "800",
    },

    verified: {
      marginTop: 4,

      color:
        colors.green,

      fontSize: 9,

      fontWeight: "700",
    },

    /* SECTION */

    sectionTitle: {
      marginTop: 23,

      marginBottom: 8,

      color:
        "#727A84",

      fontSize: 8,

      fontWeight: "800",

      letterSpacing: 1.2,
    },

    card: {
      padding: 15,

      borderWidth: 1,

      borderColor:
        "#E0E2E4",

      borderRadius: 16,

      backgroundColor:
        "#FFFFFF",
    },

    /* CALORIE */

    calorieCard: {
      padding: 18,

      borderRadius: 17,

      backgroundColor:
        colors.navy,
    },

    calorieLabel: {
      color:
        "#BFC8D4",

      fontSize: 8,

      fontWeight: "800",

      letterSpacing: 1.2,
    },

    calorieEditRow: {
      marginTop: 13,

      flexDirection: "row",

      alignItems: "center",

      gap: 10,
    },

    calorieButton: {
      width: 44,

      height: 44,

      borderRadius: 11,

      backgroundColor:
        colors.maize,

      alignItems: "center",

      justifyContent:
        "center",
    },

    calorieButtonText: {
      color:
        colors.navy,

      fontSize: 22,

      fontWeight: "800",
    },

    calorieInputContainer: {
      flex: 1,

      alignItems: "center",
    },

    calorieInput: {
      width: "100%",

      height: 44,

      borderRadius: 10,

      backgroundColor:
        "#FFFFFF",

      color:
        colors.navy,

      fontSize: 20,

      fontWeight: "800",

      paddingHorizontal: 10,
    },

    calorieUnit: {
      marginTop: 5,

      color:
        "#BFC8D4",

      fontSize: 8,

      fontWeight: "600",
    },

    /* INPUTS */

    formRow: {
      flexDirection: "row",

      gap: 10,

      marginBottom: 14,
    },

    formField: {
      flex: 1,
    },

    inputLabel: {
      marginBottom: 6,

      color:
        "#66707A",

      fontSize: 8,

      fontWeight: "800",

      letterSpacing: 1,
    },

    input: {
      height: 46,

      paddingHorizontal: 12,

      borderWidth: 1,

      borderColor:
        "#D8DBDF",

      borderRadius: 10,

      backgroundColor:
        "#FBFBFA",

      color:
        colors.navy,

      fontSize: 12,

      fontWeight: "700",
    },

    /* CHIPS */

    chips: {
      flexDirection: "row",

      flexWrap: "wrap",

      gap: 8,
    },

    chip: {
      paddingHorizontal: 11,

      paddingVertical: 9,

      borderWidth: 1,

      borderColor:
        "#D8DBDF",

      borderRadius: 10,

      backgroundColor:
        "#FFFFFF",
    },

    selectedChip: {
      borderColor:
        "#D8B900",

      backgroundColor:
        "#FFF7CF",
    },

    chipText: {
      color:
        "#606873",

      fontSize: 9,

      fontWeight: "600",
    },

    selectedChipText: {
      color:
        "#6D5800",

      fontWeight: "800",
    },

    /* ALLERGIES */

    allergyInput: {
      minHeight: 48,

      paddingHorizontal: 12,

      borderWidth: 1,

      borderColor:
        "#D8DBDF",

      borderRadius: 10,

      color:
        colors.navy,

      fontSize: 11,

      backgroundColor:
        "#FBFBFA",
    },

    helpText: {
      marginBottom: 12,

      color:
        colors.muted,

      fontSize: 9,

      lineHeight: 14,
    },

    /* LOCATION */

    switchRow: {
      flexDirection: "row",

      alignItems: "center",

      gap: 12,
    },

    switchCopy: {
      flex: 1,
    },

    switchTitle: {
      color:
        colors.navy,

      fontSize: 11,

      fontWeight: "700",
    },

    switchDescription: {
      marginTop: 4,

      color:
        colors.muted,

      fontSize: 9,

      lineHeight: 14,
    },

    /* WINDOWS */

    windowRow: {
      flexDirection: "row",

      alignItems:
        "flex-end",

      gap: 8,

      marginBottom: 12,
    },

    timeField: {
      flex: 1,
    },

    timeLabel: {
      marginBottom: 5,

      color:
        "#747C86",

      fontSize: 8,

      fontWeight: "800",
    },

    timeInput: {
      height: 44,

      paddingHorizontal: 8,

      borderWidth: 1,

      borderColor:
        "#D8DBDF",

      borderRadius: 10,

      backgroundColor:
        "#FBFBFA",

      color:
        colors.navy,

      fontSize: 11,

      fontWeight: "700",

      textAlign: "center",
    },

    timeArrow: {
      marginBottom: 12,

      color:
        "#90969D",

      fontSize: 15,
    },

    removeButton: {
      width: 25,

      height: 44,

      alignItems: "center",

      justifyContent:
        "center",
    },

    removeText: {
      color:
        "#A75F59",

      fontSize: 22,
    },

    addWindowButton: {
      height: 42,

      marginTop: 3,

      alignItems: "center",

      justifyContent:
        "center",

      borderWidth: 1,

      borderColor:
        "#D8DBDF",

      borderStyle:
        "dashed",

      borderRadius: 10,
    },

    addWindowText: {
      color:
        colors.blue,

      fontSize: 9,

      fontWeight: "700",
    },

    /* SAVE */

    saveButton: {
      height: 52,

      marginTop: 28,

      borderRadius: 13,

      backgroundColor:
        colors.navy,

      alignItems: "center",

      justifyContent:
        "center",
    },

    saveButtonDisabled: {
      opacity: 0.6,
    },

    saveButtonText: {
      color:
        "#FFFFFF",

      fontSize: 11,

      fontWeight: "800",
    },

    saveHelp: {
      marginTop: 8,

      paddingHorizontal: 15,

      color:
        "#9298A0",

      fontSize: 8,

      lineHeight: 13,

      textAlign: "center",
    },

    bottomSpace: {
      height: 20,
    },
  });