import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
    UserProfile,
} from "../types/UserProfile";

const PROFILE_KEY =
  "@maize/user-profile";

const ONBOARDING_KEY =
  "@maize/onboarding-complete";

export async function saveProfile(
  profile: UserProfile
) {
  await AsyncStorage.setItem(
    PROFILE_KEY,
    JSON.stringify(profile)
  );
}

export async function loadProfile():
  Promise<UserProfile | null> {
  const stored =
    await AsyncStorage.getItem(
      PROFILE_KEY
    );

  if (!stored) {
    return null;
  }

  return JSON.parse(
    stored
  ) as UserProfile;
}

export async function clearProfile() {
  await AsyncStorage.multiRemove([
    PROFILE_KEY,
    ONBOARDING_KEY,
  ]);
}

export async function setOnboardingComplete(
  complete: boolean
) {
  await AsyncStorage.setItem(
    ONBOARDING_KEY,
    complete
      ? "true"
      : "false"
  );
}

export async function getOnboardingComplete() {
  const value =
    await AsyncStorage.getItem(
      ONBOARDING_KEY
    );

  return value === "true";
}