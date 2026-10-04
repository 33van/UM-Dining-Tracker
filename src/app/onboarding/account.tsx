import { useState } from "react";
import { API_URL } from "../../services/api";

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
import { colors } from "../../constants/theme";


import { normalizeUSPhone } from "../../utils/phone";
import { router } from "expo-router";
import { Alert } from "react-native";


export default function AccountScreen() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);


  async function handlePhoneLogin() {

   const normalizedPhone = normalizeUSPhone(phone);


    if (!normalizedPhone) {
      Alert.alert(
        "Invalid phone number",
        "Enter a valid 10-digit US phone number."
      );
      return;
    }
  try {
    setLoading(true);


    const response = await fetch(
      `${API_URL}/auth/phone/send-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: normalizedPhone,
        }),
      }
    );



    const data = await response.json();



    if (!response.ok) {
      Alert.alert(
        "Couldn't send code",
        data.error ?? "Unable to send verification code."
      );
      return;
    }


    router.push({
      pathname: "/onboarding/verify-phone",
      params: {
        phone: normalizedPhone,
      },
    });
  } catch (error) {
    console.error("PHONE LOGIN ERROR:", error);

    Alert.alert(
      "Connection error",
      "Could not connect to the backend."
    );
  } finally {
    setLoading(false);
  }
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
            Enter your mobile phone number to get started.
          </Text>

          {/* Toggle */}
          <Text style={styles.label}>
          MOBILE PHONE
          </Text>

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

          <Pressable
            style={styles.continueButton}
            disabled={loading}
            onPress={handlePhoneLogin}
          >
            <View style={styles.phoneIcon}>
              <Text style={styles.phoneIconText}>
                #
              </Text>
            </View>

            <Text style={styles.continueText}>
              {loading
                ? "Sending code..."
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

  phoneIcon: {
    width: 25,
    height: 25,
    borderRadius: 7,
    backgroundColor: "#1678C2",
    alignItems: "center",
    justifyContent: "center",
  },

  phoneIconText: {
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