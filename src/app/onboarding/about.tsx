import { useState } from "react";

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { Gender } from "../../types/UserProfile";

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

export default function AboutScreen() {
  const { profile, setBodyInfo } = useOnboarding();

  const [height, setHeight] = useState(
    profile.heightFeet
      ? `${profile.heightFeet}' ${profile.heightInches ?? 0}"`
      : ""
  );

  const [weight, setWeight] = useState(
    profile.weightLbs?.toString() ?? ""
  );

  const [age, setAge] = useState(
    profile.age?.toString() ?? ""
  );

  const [gender, setGender] = useState<Gender>(
    profile.gender ?? "Woman"
  );

  const [showGenderOptions, setShowGenderOptions] =
    useState(false);

  const [conditions, setConditions] = useState<string[]>(
    profile.healthConsiderations
  );

  const [allergies, setAllergies] = useState(
    profile.allergies.join(", ")
  );

  function toggleCondition(condition: string) {
    setConditions((current) =>
      current.includes(condition)
        ? current.filter((item) => item !== condition)
        : [...current, condition]
    );
  }

  function parseHeight() {
    /*
     * Accept:
     * 5'7
     * 5' 7"
     * 5 7
     */

    const numbers = height.match(/\d+/g);

    if (!numbers || numbers.length < 2) {
      return null;
    }

    const feet = Number(numbers[0]);
    const inches = Number(numbers[1]);

    if (
      Number.isNaN(feet) ||
      Number.isNaN(inches) ||
      feet <= 0 ||
      inches < 0 ||
      inches > 11
    ) {
      return null;
    }

    return {
      feet,
      inches,
    };
  }

  function handleHeightChange(input: string) {
  // Strip everything except numbers.
  const digits = input.replace(/\D/g, "");

  if (digits.length === 0) {
    setHeight("");
    return;
  }

  // Limit input to:
  // 1 digit for feet
  // 2 digits for inches
  //
  // Example: 511 → 5' 11"
  const limited = digits.slice(0, 3);

  const feet = limited.charAt(0);
  const inches = limited.slice(1);

  // User has only entered feet.
  //
  // 5 → 5'
  if (limited.length === 1) {
    setHeight(`${feet}'`);
    return;
  }

  // User has entered feet + inches.
  //
  // 57  → 5' 7"
  // 511 → 5' 11"
  setHeight(`${feet}' ${inches}"`);
}

  function handleContinue() {
  const parsedHeight = parseHeight();

  const weightNumber = Number(weight);
  const ageNumber = Number(age);

  // Validate height
  if (!parsedHeight) {
    Alert.alert(
      "Invalid height",
      `Enter your height like 5' 7".`
    );
    return;
  }

  // Validate weight
  if (
    !weight ||
    Number.isNaN(weightNumber) ||
    weightNumber <= 0
  ) {
    Alert.alert(
      "Invalid weight",
      "Enter a valid weight."
    );
    return;
  }

  // Validate age
  if (
    !age ||
    Number.isNaN(ageNumber) ||
    ageNumber <= 0
  ) {
    Alert.alert(
      "Invalid age",
      "Enter a valid age."
    );
    return;
  }

  // Convert comma-separated allergies into an array.
  // Example:
  // "Peanuts, Milk" -> ["peanuts", "milk"]
  const allergyList = [
    ...new Set(
      allergies
        .split(",")
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean)
    ),
  ];

  // Body data we're about to save
  const bodyInfo = {
    heightFeet: parsedHeight.feet,
    heightInches: parsedHeight.inches,
    weightLbs: weightNumber,
    age: ageNumber,
    gender,
    healthConsiderations: conditions,
    allergies: allergyList,
  };

  // Build what the complete UserProfile will look like
  const updatedProfile = {
    ...profile,
    ...bodyInfo,
  };

  // Print it to the Expo terminal
  console.log("=================================");
  console.log("UPDATED USER PROFILE");
  console.log(JSON.stringify(updatedProfile, null, 2));
  console.log("=================================");

  // Store the new body information in OnboardingContext
  setBodyInfo(bodyInfo);

  // Continue to next onboarding screen
  router.push("/onboarding/goals");
}

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        {/* HEADER */}

        <View style={styles.header}>
          <Brand />

          <Text style={styles.stepText}>
            Step 2 of 4
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
            number="02"
            label="About you"
            active
          />

          <Step
            number="03"
            label="Goals"
          />

          <Step
            number="04"
            label="Plan"
          />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.eyebrow}>
              TELL US ABOUT YOU
            </Text>

            <Text style={styles.title}>
              Let’s personalize your daily needs.
            </Text>

            <Text style={styles.description}>
              These details help calculate a safe starting
              point. You can update them anytime.
            </Text>

            {/* 2 x 2 GRID */}

            <View style={styles.formGrid}>
              {/* HEIGHT */}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  Height
                </Text>

                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.centerInput}
                    value={height}
                    onChangeText={handleHeightChange}
                    placeholder={`5' 7"`}
                    placeholderTextColor="#A3A8AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    />

                  <Text style={styles.inputUnit}>
                    ft / in
                  </Text>
                </View>
              </View>

              {/* WEIGHT */}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  Weight
                </Text>

                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.centerInput}
                    value={weight}
                    onChangeText={setWeight}
                    placeholder="145"
                    placeholderTextColor="#A3A8AF"
                    keyboardType="decimal-pad"
                  />

                  <Text style={styles.inputUnit}>
                    lb
                  </Text>
                </View>
              </View>

              {/* AGE */}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  Age
                </Text>

                <View style={styles.inputShell}>
                  <TextInput
                    style={styles.centerInput}
                    value={age}
                    onChangeText={setAge}
                    placeholder="20"
                    placeholderTextColor="#A3A8AF"
                    keyboardType="number-pad"
                    maxLength={3}
                  />

                  <Text style={styles.inputUnit}>
                    years
                  </Text>
                </View>
              </View>

              {/* GENDER */}

              <View style={styles.formField}>
                <Text style={styles.formLabel}>
                  Gender
                </Text>

                <Pressable
                  style={styles.inputShell}
                  onPress={() =>
                    setShowGenderOptions(
                      !showGenderOptions
                    )
                  }
                >
                  <Text style={styles.genderText}>
                    {gender}
                  </Text>

                  <Text style={styles.chevron}>
                    ›
                  </Text>
                </Pressable>

                {showGenderOptions && (
                  <View style={styles.genderMenu}>
                    {GENDERS.map((option) => (
                      <Pressable
                        key={option}
                        style={styles.genderOption}
                        onPress={() => {
                          setGender(option);
                          setShowGenderOptions(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.genderOptionText,

                            gender === option &&
                              styles.genderOptionSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* CONDITIONS */}

            <View style={styles.choiceSection}>
              <Text style={styles.fieldLabel}>
                CONDITIONS & CONSIDERATIONS
              </Text>

              <Text style={styles.choiceDescription}>
                Select any that apply so recommendations
                work for you.
              </Text>

              <View style={styles.chips}>
                {CONDITIONS.map((condition) => {
                  const selected =
                    conditions.includes(condition);

                  return (
                    <Pressable
                      key={condition}
                      style={[
                        styles.chip,
                        selected &&
                          styles.selectedChip,
                      ]}
                      onPress={() =>
                        toggleCondition(condition)
                      }
                    >
                      {selected && (
                        <Text style={styles.checkmark}>
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
                        {condition}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* ALLERGIES */}

            <View style={styles.allergySection}>
              <Text style={styles.fieldLabel}>
                ALLERGIES
              </Text>

              <View style={styles.allergyInput}>
                <TextInput
                  style={styles.allergyTextInput}
                  value={allergies}
                  onChangeText={setAllergies}
                  placeholder="Type allergies, separated by commas"
                  placeholderTextColor="#9BA0A7"
                />
              </View>

              <Text style={styles.allergyHelp}>
                We’ll exclude these ingredients from every
                recommendation.
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* FOOTER */}

        <View style={styles.footer}>
          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>
              Back
            </Text>
          </Pressable>

          <Pressable
            style={styles.continueButton}
            onPress={handleContinue}
          >
            <Text style={styles.continueText}>
              Continue
            </Text>

            <Text style={styles.footerArrow}>
              ›
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


/* -------------------------------------------------- */
/* BRAND                                               */
/* -------------------------------------------------- */

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


/* -------------------------------------------------- */
/* STEPPER                                             */
/* -------------------------------------------------- */

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
  const highlighted = active || completed;

  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,

          highlighted &&
            styles.stepCircleHighlighted,
        ]}
      >
        <Text
          style={[
            styles.stepNumber,

            highlighted &&
              styles.stepNumberHighlighted,
          ]}
        >
          {number}
        </Text>
      </View>

      <Text
        style={[
          styles.stepLabel,

          highlighted &&
            styles.stepLabelHighlighted,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}


/* -------------------------------------------------- */
/* STYLES                                              */
/* -------------------------------------------------- */
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
    borderRadius: 7,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "-4deg" }],
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
    borderWidth: 1,
    borderColor: "#D9DCDF",
    borderRadius: 14,
    backgroundColor: "#FBFBF8",
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleHighlighted: {
    borderColor: colors.maize,
    backgroundColor: colors.maize,
  },

  stepNumber: {
    color: "#A3A8AF",
    fontSize: 8,
    fontWeight: "700",
  },

  stepNumberHighlighted: {
    color: colors.navy,
  },

  stepLabel: {
    color: "#A3A8AF",
    fontSize: 8,
    fontWeight: "600",
  },

  stepLabelHighlighted: {
    color: colors.navy,
    fontWeight: "700",
  },

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
    alignItems: "center",
  },

  eyebrow: {
    color: "#777F89",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    maxWidth: 370,
    marginTop: 7,
    marginBottom: 8,
    color: colors.navy,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1.1,
    textAlign: "center",
  },

  description: {
    maxWidth: 370,
    marginBottom: 25,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 19,
    textAlign: "center",
  },

  formGrid: {
    width: "100%",
    maxWidth: 360,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 11,
    rowGap: 13,
  },

  formField: {
    width: "48%",
    position: "relative",
  },

  formLabel: {
    marginBottom: 6,
    color: "#59616D",
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },

  inputShell: {
    position: "relative",
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D8DBDF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  centerInput: {
    flex: 1,
    height: "100%",
    paddingLeft: 22,
    paddingRight: 42,
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  inputUnit: {
    position: "absolute",
    right: 12,
    color: "#8A919B",
    fontSize: 10,
  },

  genderText: {
    flex: 1,
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    paddingLeft: 15,
  },

  chevron: {
    color: "#90969E",
    fontSize: 20,
    transform: [{ rotate: "90deg" }],
  },

  genderMenu: {
    position: "absolute",
    zIndex: 100,
    top: 75,
    left: 0,
    right: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  genderOption: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F1",
  },

  genderOptionText: {
    color: "#5E6671",
    fontSize: 10,
  },

  genderOptionSelected: {
    color: colors.navy,
    fontWeight: "700",
  },

  choiceSection: {
    width: "100%",
    maxWidth: 360,
    marginTop: 24,
  },

  fieldLabel: {
    marginBottom: 7,
    color: "#59616D",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  choiceDescription: {
    marginTop: -2,
    marginBottom: 11,
    color: colors.muted,
    fontSize: 10,
  },

  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "#DAD DDF".replace(" ", ""),
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

  allergySection: {
    width: "100%",
    maxWidth: 360,
    marginTop: 21,
  },

  allergyInput: {
    minHeight: 49,
    justifyContent: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D8DBDF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  allergyTextInput: {
    color: colors.navy,
    fontSize: 12,
    fontWeight: "500",
  },

  allergyHelp: {
    marginTop: 6,
    marginHorizontal: 2,
    color: "#8C929B",
    fontSize: 8,
  },

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