import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  router,
  usePathname,
} from "expo-router";

import { colors } from "../constants/theme";

export default function MainBottomNav() {
  const pathname = usePathname();

  const tabs = [
    {
      route: "/dashboard",
      icon: "⌂",
      label: "Today",
    },
    {
      route: "/progress",
      icon: "▥",
      label: "Progress",
    },
    {
      route: "/profile",
      icon: "○",
      label: "Profile",
    },
  ] as const;

  return (
    <View style={styles.nav}>
      {tabs.map((tab) => {
        const active =
          pathname === tab.route;

        return (
          <Pressable
            key={tab.route}
            style={styles.navItem}
            onPress={() =>
              router.replace(tab.route)
            }
          >
            <Text
              style={[
                styles.icon,
                active && styles.active,
              ]}
            >
              {tab.icon}
            </Text>

            <Text
              style={[
                styles.label,
                active && styles.active,
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  nav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,

    height: 72,

    flexDirection: "row",
    alignItems: "center",

    borderTopWidth: 1,
    borderTopColor: "#E2E4E6",

    backgroundColor: "#FBFBF8",
  },

  navItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },

  icon: {
    color: "#999FA7",
    fontSize: 20,
    fontWeight: "700",
  },

  label: {
    color: "#999FA7",
    fontSize: 8,
    fontWeight: "600",
  },

  active: {
    color: colors.navy,
    fontWeight: "800",
  },
});