import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

import {
  Gender,
  UserProfile,
} from "../types/UserProfile";

type OnboardingContextType = {
  profile: UserProfile;

  setPhone: (phone: string) => void;

  setBodyInfo: (info: {
    heightFeet: number;
    heightInches: number;
    weightLbs: number;
    age: number;
    gender: Gender;
    healthConsiderations: string[];
    allergies: string[];
  }) => void;
};

const OnboardingContext =
  createContext<OnboardingContextType | undefined>(
    undefined
  );

export function OnboardingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [profile, setProfile] = useState<UserProfile>({
    phone: "",
    healthConsiderations: [],
    allergies: [],
    foodPreferences: [],
  });

  function setPhone(phone: string) {
    setProfile((current) => ({
      ...current,
      phone,
    }));
  }

  function setBodyInfo(info: {
    heightFeet: number;
    heightInches: number;
    weightLbs: number;
    age: number;
    gender: Gender;
    healthConsiderations: string[];
    allergies: string[];
  }) {
    setProfile((current) => ({
      ...current,
      ...info,
    }));
  }

  return (
    <OnboardingContext.Provider
      value={{
        profile,
        setPhone,
        setBodyInfo,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);

  if (!context) {
    throw new Error(
      "useOnboarding must be used inside OnboardingProvider"
    );
  }

  return context;
}