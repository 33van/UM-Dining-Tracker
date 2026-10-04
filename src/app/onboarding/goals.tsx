import {
  SafeAreaView,
  StyleSheet,
  Text,
} from "react-native";

export default function GoalsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>
        Goals
      </Text>

      <Text>
        Body information saved successfully.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "800",
  },
});