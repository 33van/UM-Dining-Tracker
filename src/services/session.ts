import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
  UserProfile,
} from "../types/UserProfile";


const PROFILE_KEY =
  "maize_user_profile";

const ONBOARDING_KEY =
  "maize_onboarding_complete";


export async function saveSession(
  profile: UserProfile
) {
  await AsyncStorage.multiSet([
    [
      PROFILE_KEY,
      JSON.stringify(profile),
    ],
    [
      ONBOARDING_KEY,
      "true",
    ],
  ]);
}


export async function loadProfile():
  Promise<UserProfile | null> {

  const value =
    await AsyncStorage.getItem(
      PROFILE_KEY
    );

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(
      value
    ) as UserProfile;
  } catch {
    return null;
  }
}


export async function isOnboardingComplete():
  Promise<boolean> {

  const value =
    await AsyncStorage.getItem(
      ONBOARDING_KEY
    );

  return value === "true";
}


export async function clearSession() {
  await AsyncStorage.multiRemove([
    PROFILE_KEY,
    ONBOARDING_KEY,
  ]);
}