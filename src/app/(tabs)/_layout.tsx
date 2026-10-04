import { Tabs } from "expo-router";
import {
    StyleSheet,
    Text,
} from "react-native";

import { colors } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: "#9298A0",

        tabBarStyle: styles.tabBar,

        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Today",

          tabBarIcon: ({ focused }) => (
            <Text
              style={[
                styles.tabIcon,
                focused && styles.tabIconActive,
              ]}
            >
              ◉
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="progress"
        options={{
          title: "Progress",

          tabBarIcon: ({ focused }) => (
            <Text
              style={[
                styles.tabIcon,
                focused && styles.tabIconActive,
              ]}
            >
              ▥
            </Text>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",

          tabBarIcon: ({ focused }) => (
            <Text
              style={[
                styles.tabIcon,
                focused && styles.tabIconActive,
              ]}
            >
              ●
            </Text>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 82,

    paddingTop: 8,
    paddingBottom: 18,

    borderTopWidth: 1,
    borderTopColor: "#E3E5E7",

    backgroundColor: "#FFFFFF",
  },

  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
  },

  tabIcon: {
    color: "#A2A7AE",

    fontSize: 19,
  },

  tabIconActive: {
    color: colors.navy,
  },
});