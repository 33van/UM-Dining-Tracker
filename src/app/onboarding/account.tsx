import { useState } from "react";

// import { colors } from "../../constants/theme";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";

import { colors } from "../../constants/theme";
import { Alert } from "react-native";
import { router } from "expo-router";
import { normalizeUSPhone } from "../../utils/phone";

export default function AccountScreen() {
  const [signInMethod, setSignInMethod] =
    useState<"umich" | "phone">("umich");

  const [uniqname, setUniqname] = useState("");
  const [phone, setPhone] = useState("");

  function continueOnboarding() {
    // Authentication will eventually happen here.
    router.push("/onboarding/about");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Brand />

          <Text style={styles.stepText}>
            Step 1 of 4
          </Text>
        </View>

        {/* Step indicator */}
        <View style={styles.stepper}>
          <Step number="01" label="Account" active />
          <Step number="02" label="About you" />
          <Step number="03" label="Goals" />
          <Step number="04" label="Plan" />
        </View>

        {/* Main content */}
        <View style={styles.content}>
          <View style={styles.logoBox}>
            <Text style={styles.bigM}>M</Text>

            <View style={styles.verifiedBadge}>
              <Text style={styles.check}>✓</Text>
            </View>
          </View>

          <Text style={styles.eyebrow}>
            WELCOME TO MAIZE
          </Text>

          <Text style={styles.title}>
            Nutrition built for your life at Michigan.
          </Text>

          <Text style={styles.description}>
            Create your account with a UMich uniqname or your mobile phone.
          </Text>

          {/* Toggle */}
          <View style={styles.toggleContainer}>
            <Pressable
              style={[
                styles.toggleButton,
                signInMethod === "umich" &&
                  styles.toggleButtonActive,
              ]}
              onPress={() => setSignInMethod("umich")}
            >
              <Text
                style={[
                  styles.toggleText,
                  signInMethod === "umich" &&
                    styles.toggleTextActive,
                ]}
              >
                UMich account
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.toggleButton,
                signInMethod === "phone" &&
                  styles.toggleButtonActive,
              ]}
              onPress={() => setSignInMethod("phone")}
            >
              <Text
                style={[
                  styles.toggleText,
                  signInMethod === "phone" &&
                    styles.toggleTextActive,
                ]}
              >
                Phone number
              </Text>
            </Pressable>
          </View>

          <Text style={styles.label}>
            {signInMethod === "umich"
              ? "UMICH UNIQNAME"
              : "MOBILE PHONE"}
          </Text>

          {signInMethod === "umich" ? (
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>@</Text>

              <TextInput
                style={styles.input}
                value={uniqname}
                onChangeText={setUniqname}
                placeholder="alexs"
                placeholderTextColor="#9AA0A8"
                autoCapitalize="none"
              />

              <Text style={styles.inputSuffix}>
                @umich.edu
              </Text>
            </View>
          ) : (
            <View style={styles.inputContainer}>
              <Text style={styles.inputPrefix}>
                +1
              </Text>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                placeholder="(734) 555-0123"
                placeholderTextColor="#9AA0A8"
                keyboardType="phone-pad"
              />
            </View>
          )}

          <Pressable
            style={styles.continueButton}
            onPress={continueOnboarding}
          >
            <View style={styles.oktaIcon}>
              <Text style={styles.oktaIconText}>
                {signInMethod === "umich" ? "o" : "#"}
              </Text>
            </View>

            <Text style={styles.continueText}>
              {signInMethod === "umich"
                ? "Continue with UMich Okta"
                : "Text me a verification code"}
            </Text>

            <Text style={styles.arrow}>›</Text>
          </Pressable>

          <Text style={styles.privacy}>
            Your health information stays private and is never
            shared with the university.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Brand() {
  return (
    <View style={styles.brand}>
      <View style={styles.brandMark}>
        <Text style={styles.brandM}>M</Text>
      </View>

      <Text style={styles.brandText}>maize</Text>
    </View>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <View style={styles.step}>
      <View
        style={[
          styles.stepCircle,
          active && styles.stepCircleActive,
        ]}
      >
        <Text
          style={[
            styles.stepNumber,
            active && styles.stepNumberActive,
          ]}
        >
          {number}
        </Text>
      </View>

      <Text
        style={[
          styles.stepLabel,
          active && styles.stepLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FBFBF8",
  },

  container: {
    flex: 1,
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
  },

  stepText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "600",
  },

  stepper: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    paddingBottom: 14,
  },

  step: {
    alignItems: "center",
    gap: 5,
  },

  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D9DCDF",
    alignItems: "center",
    justifyContent: "center",
  },

  stepCircleActive: {
    backgroundColor: colors.maize,
    borderColor: colors.maize,
  },

  stepNumber: {
    color: "#A3A8AF",
    fontSize: 9,
    fontWeight: "700",
  },

  stepNumberActive: {
    color: colors.navy,
  },

  stepLabel: {
    color: "#A3A8AF",
    fontSize: 9,
    fontWeight: "600",
  },

  stepLabelActive: {
    color: colors.navy,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 35,
  },

  logoBox: {
    position: "relative",
    alignSelf: "center",
    width: 108,
    height: 108,
    borderRadius: 31,
    backgroundColor: colors.navy,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    transform: [{ rotate: "-3deg" }],
  },

  bigM: {
    color: colors.maize,
    fontSize: 57,
    fontWeight: "900",
  },

  verifiedBadge: {
    position: "absolute",
    right: -10,
    bottom: -8,
    width: 39,
    height: 39,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: "#FBFBF8",
    backgroundColor: "#43856D",
    alignItems: "center",
    justifyContent: "center",
  },

  check: {
    color: "white",
    fontSize: 18,
    fontWeight: "800",
  },

  eyebrow: {
    color: "#777F89",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 7,
    color: colors.navy,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },

  description: {
    marginTop: 8,
    marginBottom: 25,
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
  },

  toggleContainer: {
    flexDirection: "row",
    gap: 4,
    padding: 4,
    marginBottom: 18,
    borderRadius: 12,
    backgroundColor: "#E9EBEB",
  },

  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 9,
  },

  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
  },

  toggleText: {
    color: "#747C87",
    fontSize: 10,
    fontWeight: "700",
  },

  toggleTextActive: {
    color: colors.navy,
  },

  label: {
    marginBottom: 7,
    color: "#59616D",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  inputContainer: {
    height: 49,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: "#D8DBDF",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },

  inputPrefix: {
    color: colors.navy,
    fontWeight: "700",
  },

  input: {
    flex: 1,
    paddingHorizontal: 7,
    color: colors.navy,
    fontSize: 13,
    fontWeight: "600",
  },

  inputSuffix: {
    color: "#8A919B",
    fontSize: 10,
  },

  continueButton: {
    height: 51,
    marginTop: 13,
    paddingHorizontal: 15,
    borderRadius: 12,
    backgroundColor: colors.navy,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  oktaIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: "#1678C2",
    alignItems: "center",
    justifyContent: "center",
  },

  oktaIconText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  continueText: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },

  arrow: {
    color: "#FFFFFF",
    fontSize: 25,
  },

  privacy: {
    marginTop: 14,
    marginHorizontal: 20,
    color: "#9298A0",
    fontSize: 9,
    lineHeight: 14,
    textAlign: "center",
  },
});