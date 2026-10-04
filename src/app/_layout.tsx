import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";

import { MealCalendarSync } from "../components/MealCalendarSync";
import { OnboardingProvider } from "../context/OnboardingContext";

WebBrowser.maybeCompleteAuthSession();

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <StatusBar style="dark" />
      <MealCalendarSync />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      />
    </OnboardingProvider>
  );
}