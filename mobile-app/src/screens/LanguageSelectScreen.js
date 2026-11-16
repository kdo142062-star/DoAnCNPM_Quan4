import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { languages } from "../services/api";

export function LanguageSelectScreen({ language, onSelect, onClose }) {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}><Text style={styles.eyebrow}>YOUR JOURNEY, YOUR LANGUAGE</Text><Text style={styles.title}>Chọn ngôn ngữ</Text><Text style={styles.description}>Nội dung thuyết minh sẽ ưu tiên ngôn ngữ bạn chọn.</Text></View>
      {languages.map((item) => (
        <TouchableOpacity key={item.code} style={[styles.option, language === item.code && styles.optionSelected]} onPress={() => { onSelect(item.code); onClose(); }}>
          <Text style={styles.flag}>{item.flag}</Text><View style={styles.label}><Text style={styles.name}>{item.name}</Text><Text style={styles.code}>{item.code.toUpperCase()}</Text></View><Text style={styles.radio}>{language === item.code ? "●" : "○"}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { padding: 22, paddingBottom: 30 },
  header: { paddingTop: 28, paddingBottom: 18 },
  eyebrow: { color: "#78948b", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  title: { marginTop: 12, color: "#153b3a", fontFamily: "serif", fontSize: 30 },
  description: { marginTop: 8, color: "#7b9088", fontSize: 11, lineHeight: 17 },
  option: { flexDirection: "row", alignItems: "center", marginTop: 10, padding: 14, borderWidth: 1, borderColor: "#e5eeea", borderRadius: 12, backgroundColor: "#fff" },
  optionSelected: { borderColor: "#77bba8", backgroundColor: "#eef8f3" },
  flag: { fontSize: 25 },
  label: { flex: 1, marginLeft: 13 },
  name: { color: "#244b43", fontSize: 13, fontWeight: "600" },
  code: { marginTop: 3, color: "#98a8a1", fontSize: 8, letterSpacing: 1 },
  radio: { color: "#087c70", fontSize: 17 },
});
