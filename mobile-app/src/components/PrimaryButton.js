import { StyleSheet, Text, TouchableOpacity } from "react-native";

export function PrimaryButton({ title, onPress, disabled = false, secondary = false }) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} style={[styles.button, secondary && styles.secondary, disabled && styles.disabled]} activeOpacity={0.8}>
      <Text style={[styles.text, secondary && styles.secondaryText]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 48, alignItems: "center", justifyContent: "center", paddingHorizontal: 18, borderRadius: 12, backgroundColor: "#087c70" },
  secondary: { borderWidth: 1, borderColor: "#dce9e3", backgroundColor: "#fff" },
  disabled: { opacity: 0.5 },
  text: { color: "#fff", fontSize: 13, fontWeight: "700" },
  secondaryText: { color: "#315e55" },
});
