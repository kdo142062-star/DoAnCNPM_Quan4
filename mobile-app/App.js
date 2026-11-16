import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { AudioGuideScreen } from "./src/screens/AudioGuideScreen";
import { ExploreScreen } from "./src/screens/ExploreScreen";
import { LanguageSelectScreen } from "./src/screens/LanguageSelectScreen";
import { QrScannerScreen } from "./src/screens/QrScannerScreen";
import { getPois, languages } from "./src/services/api";

const tabs = [
  { id: "explore", label: "Khám phá", icon: "⌖" },
  { id: "audio", label: "Thuyết minh", icon: "♫" },
  { id: "scan", label: "Quét QR", icon: "▦" },
  { id: "language", label: "Ngôn ngữ", icon: "文" },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("explore");
  const [language, setLanguage] = useState("vi");
  const [pois, setPois] = useState([]);
  const [selectedPoi, setSelectedPoi] = useState(null);
  const [autoPlaySignal, setAutoPlaySignal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getPois(language)
      .then(({ items, source, error: apiError }) => {
        if (!active) return;
        setPois(items);
        setError(source === "demo" ? apiError : "");
        setSelectedPoi((current) => items.find((poi) => poi.id === current?.id) ?? items[0] ?? null);
      })
      .catch((cause) => { if (active) setError(cause.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [language]);

  const choosePoi = useCallback((poi, options = {}) => {
    setSelectedPoi(poi);
    if (options.autoPlay) setAutoPlaySignal((signal) => signal + 1);
    setActiveTab("audio");
  }, []);

  let content = null;
  if (loading) {
    content = <View style={styles.center}><ActivityIndicator color="#087c70" /><Text style={styles.loadingText}>Đang tải hành trình...</Text></View>;
  } else if (activeTab === "explore") {
    content = <ExploreScreen pois={pois} language={language} onSelectPoi={choosePoi} />;
  } else if (activeTab === "audio") {
    content = <AudioGuideScreen poi={selectedPoi} language={language} autoPlaySignal={autoPlaySignal} />;
  } else if (activeTab === "scan") {
    content = <QrScannerScreen pois={pois} onSelectPoi={choosePoi} onClose={() => setActiveTab("explore")} />;
  } else {
    content = <LanguageSelectScreen language={language} onSelect={setLanguage} onClose={() => setActiveTab("explore")} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f7faf9" />
      {error ? <View style={styles.notice}><Text style={styles.noticeText}>ⓘ  {error}</Text></View> : null}
      <View style={styles.content}>{content}</View>
      {activeTab !== "scan" && activeTab !== "language" && (
        <View style={styles.tabBar}>
          {tabs.filter((tab) => tab.id !== "language" || activeTab !== "language").map((tab) => (
            <TouchableOpacity key={tab.id} style={styles.tab} onPress={() => setActiveTab(tab.id)} accessibilityRole="button">
              <Text style={[styles.tabIcon, activeTab === tab.id && styles.tabIconActive]}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.languageTab} onPress={() => setActiveTab("language")} accessibilityLabel={`Language ${language}`}>
            <Text style={styles.languageFlag}>{languages.find((item) => item.code === language)?.flag ?? "🌐"}</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f7faf9" },
  content: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#718782", fontSize: 13 },
  notice: { paddingHorizontal: 16, paddingVertical: 9, backgroundColor: "#fff4e8" },
  noticeText: { color: "#805d3c", fontSize: 11 },
  tabBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingTop: 10, paddingBottom: 8, borderTopWidth: 1, borderTopColor: "#e5eeea", backgroundColor: "#fff" },
  tab: { alignItems: "center", minWidth: 58 },
  tabIcon: { color: "#9aaba5", fontSize: 20 },
  tabIconActive: { color: "#087c70" },
  tabLabel: { marginTop: 3, color: "#99a8a2", fontSize: 9 },
  tabLabelActive: { color: "#087c70", fontWeight: "700" },
  languageTab: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "#eef6f2" },
  languageFlag: { fontSize: 18 },
});
