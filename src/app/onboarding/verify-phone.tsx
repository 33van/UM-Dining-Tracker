import { useState } from "react";
import { API_URL } from "../../services/api";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import { colors } from "../../constants/theme";
import { useOnboarding } from "../../context/OnboardingContext";

export default function VerifyPhoneScreen() {
    
  const params = useLocalSearchParams<{ phone: string }>();

  const phone = params.phone;

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { setPhone } = useOnboarding();

  async function verifyCode() {


  if (!phone) {
    Alert.alert("Error", "Phone number is missing.");
    return;
  }

  if (code.length !== 8) {
    Alert.alert(
      "Invalid code",
      "Enter the 8-character verification code."
    );
    return;
  }

  try {
    setLoading(true);

    const response = await fetch(
      `${API_URL}/auth/phone/verify-code`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone,
          code,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      Alert.alert(
        "Verification failed",
        data.error ?? "The code could not be verified."
      );
      return;
    }

    setPhone(phone);

    router.replace("/onboarding/about");

  } catch (error) {
    console.error("VERIFY ERROR:", error);

    Alert.alert(
      "Connection error",
      "Could not connect to the Maize server."
    );
  } finally {
    setLoading(false);
  }
}

  async function resendCode() {
    if (!phone) {
      return;
    }

    try {
      setResending(true);

      const response = await fetch(
        "http://{API_URL}:3000/auth/phone/send-code",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        Alert.alert(
          "Couldn't resend code",
          data.error ?? "Please try again."
        );

        return;
      }

      setCode("");

      Alert.alert(
        "New code sent",
        "A new verification code has been generated."
      );
    } catch (error) {
      console.error(error);

      Alert.alert(
        "Connection error",
        "Could not connect to the Maize server."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.content}>
          {/* Brand */}

          <View style={styles.brand}>
            <View style={styles.brandMark}>
              <Text style={styles.brandM}>M</Text>
            </View>

            <Text style={styles.brandText}>
              maize
            </Text>
          </View>

          {/* Header */}

          <Text style={styles.eyebrow}>
            PHONE VERIFICATION
          </Text>

          <Text style={styles.title}>
            Verify your number.
          </Text>

          <Text style={styles.description}>
            We sent an 8-character verification code to
          </Text>

          <Text style={styles.phone}>
            {formatPhoneForDisplay(phone)}
          </Text>

          {/* Code input */}

          <Text style={styles.label}>
            VERIFICATION CODE
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            maxLength={8}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="12345678"
            placeholderTextColor="#A3A8AF"
            textAlign="center"
          />

          {/* Verify */}

          <Pressable
            style={[
              styles.verifyButton,
              loading && styles.disabledButton,
            ]}
            disabled={loading}
            onPress={verifyCode}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.verifyButtonText}>
                Verify phone number
              </Text>
            )}
          </Pressable>

          {/* Resend */}

          <View style={styles.resendContainer}>
            <Text style={styles.resendText}>
              Didn't get the code?
            </Text>

            <Pressable
              disabled={resending}
              onPress={resendCode}
            >
              <Text style={styles.resendButton}>
                {resending ? "Sending..." : "Resend code"}
              </Text>
            </Pressable>
          </View>

          {/* Change number */}

          <Pressable
            onPress={() => router.back()}
          >
            <Text style={styles.changeNumber}>
              ← Use a different phone number
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}


function formatPhoneForDisplay(phone?: string): string {
  if (!phone) {
    return "";
  }

  const digits = phone.replace(/\D/g, "");

  const tenDigits =
    digits.length === 11 && digits.startsWith("1")
      ? digits.slice(1)
      : digits;

  if (tenDigits.length !== 10) {
    return phone;
  }

  return `(${tenDigits.slice(0, 3)}) ${tenDigits.slice(
    3,
    6
  )}-${tenDigits.slice(6)}`;
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  container: {
    flex: 1,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginBottom: 65,
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
    fontWeight: "900",
  },

  brandText: {
    color: colors.navy,
    fontSize: 21,
    fontWeight: "800",
  },

  eyebrow: {
    color: "#777F89",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
  },

  title: {
    marginTop: 8,
    color: colors.navy,
    fontSize: 30,
    fontWeight: "800",
  },

  description: {
    marginTop: 10,
    color: colors.muted,
    fontSize: 13,
  },

  phone: {
    marginTop: 5,
    marginBottom: 35,
    color: colors.navy,
    fontSize: 15,
    fontWeight: "700",
  },

  label: {
    marginBottom: 8,
    color: "#59616D",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.2,
  },

  codeInput: {
    height: 58,
    borderWidth: 1,
    borderColor: "#D8DBDF",
    borderRadius: 12,
    backgroundColor: colors.white,

    color: colors.navy,

    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 4,
  },

  verifyButton: {
    height: 51,
    marginTop: 16,
    borderRadius: 12,

    backgroundColor: colors.navy,

    alignItems: "center",
    justifyContent: "center",
  },

  disabledButton: {
    opacity: 0.6,
  },

  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  resendContainer: {
    marginTop: 24,

    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
  },

  resendText: {
    color: colors.muted,
    fontSize: 11,
  },

  resendButton: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: "700",
  },

  changeNumber: {
    marginTop: 30,

    color: colors.blue,

    fontSize: 11,
    fontWeight: "600",

    textAlign: "center",
  },
});