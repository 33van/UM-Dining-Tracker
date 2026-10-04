import {
  useEffect,
  useState,
} from "react";

import {
  ActivityIndicator,
  StyleSheet,
  View,
} from "react-native";

import {
  router,
} from "expo-router";


import {
  clearSession,
  isOnboardingComplete,
} from "../services/session";


export default function Index() {
  const [checking, setChecking] =
    useState(true);


  useEffect(() => {
    async function checkSession() {
      try {

         // TEMPORARY DEVELOPMENT RESET
      await clearSession();
      
        const complete =
          await isOnboardingComplete();

        if (complete) {
          router.replace(
            "/dashboard"
          );
        } else {
          router.replace(
            "/onboarding/account"
          );
        }

      } catch (error) {
        console.error(
          "SESSION CHECK ERROR:",
          error
        );

        router.replace(
          "/onboarding/account"
        );

      } finally {
        setChecking(false);
      }
    }

    void checkSession();
  }, []);


  if (!checking) {
    return null;
  }


  return (
    <View style={styles.loading}>
      <ActivityIndicator />
    </View>
  );
}


const styles =
  StyleSheet.create({
    loading: {
      flex: 1,

      alignItems: "center",
      justifyContent: "center",

      backgroundColor:
        "#FBFBF8",
    },
  });