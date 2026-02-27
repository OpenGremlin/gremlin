import type { CommandMessage } from "@gremlin/shared-types";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function App() {
  const [command, setCommand] = useState("");

  const sendCommand = () => {
    if (!command.trim()) return;

    const message: CommandMessage = {
      type: "command",
      text: command.trim(),
      inputType: "text",
      profileId: "default",
    };

    console.log("Would send:", message);
    setCommand("");
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <Text style={styles.title}>Gremlin</Text>
      <Text style={styles.subtitle}>Phone Controller</Text>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Ask something..."
          placeholderTextColor="#666"
          value={command}
          onChangeText={setCommand}
          onSubmitEditing={sendCommand}
        />
        <Pressable style={styles.button} onPress={sendCommand}>
          <Text style={styles.buttonText}>Send</Text>
        </Pressable>
      </View>

      <View style={styles.status}>
        <Text style={styles.statusText}>Profile: Family</Text>
        <Text style={styles.statusText}>Server: Not connected</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0a",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "200",
    color: "#e5e5e5",
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    marginBottom: 48,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    width: "100%",
    maxWidth: 400,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 8,
    padding: 12,
    color: "#e5e5e5",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
  },
  buttonText: {
    color: "#e5e5e5",
    fontSize: 16,
  },
  status: {
    marginTop: 48,
    gap: 4,
    alignItems: "center",
  },
  statusText: {
    color: "#444",
    fontSize: 12,
  },
});
