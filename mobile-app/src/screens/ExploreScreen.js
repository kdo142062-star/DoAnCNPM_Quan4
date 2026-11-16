import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import { PoiListItem } from "../components/PoiListItem";
import { distanceMeters } from "../services/api";

export function ExploreScreen({ pois, language, onSelectPoi }) {
  const [position, setPosition] = useState(null);
  const [locationState, setLocationState] = useState("idle");
  const [nearbyPoiId, setNearbyPoiId] = useState(null);
  const announcedPoiIds = useRef(new Set());

  useEffect(() => {
    let subscription;
    let active = true;
    async function watchLocation() {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        if (active) setLocationState("denied");
        return;
      }
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 15, timeInterval: 5000 },
        (location) => {
          if (!active) return;
          const current = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          setPosition(current);
          setLocationState("active");
          const nearby = pois
            .map((poi) => ({ poi, distance: distanceMeters(current, poi.coordinates) }))
            .filter(({ poi, distance }) => distance <= (poi.geofence_radius_m ?? 100))
            .sort((left, right) => left.distance - right.distance)[0];
          setNearbyPoiId(nearby?.poi.id ?? null);
          if (nearby && !announcedPoiIds.current.has(nearby.poi.id)) {
            announcedPoiIds.current.add(nearby.poi.id);
            onSelectPoi(nearby.poi, { autoPlay: true });
          }
          if (!nearby) announcedPoiIds.current.clear();
        },
      );
    }
    watchLocation().catch((cause) => {
      if (active) {
        setLocationState("error");
        Alert.alert("Không thể định vị", cause.message);
      }
    });
    return () => { active = false; subscription?.remove(); };
  }, [pois, onSelectPoi]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>SAIGON · DISTRICT 4</Text>
        <Text style={styles.title}>Chào bạn,{`\n`}hãy bắt đầu <Text style={styles.titleAccent}>khám phá.</Text></Text>
        <Text style={styles.description}>Những câu chuyện hay nhất thường nằm ngay quanh góc phố.</Text>
      </View>
      <View style={styles.locationCard}>
        <View style={styles.locationIcon}><Text style={styles.pin}>⌖</Text></View>
        <View style={styles.locationText}>
          <Text style={styles.locationTitle}>{locationState === "active" ? "Đang theo dõi vị trí" : "Hướng dẫn theo vị trí"}</Text>
          <Text style={styles.locationSubtitle}>{locationState === "denied" ? "Cấp quyền GPS để bật tự động phát." : position ? `${position.latitude.toFixed(4)} · ${position.longitude.toFixed(4)}` : "Audio guide sẽ gợi ý khi bạn đến gần điểm đến."}</Text>
        </View>
        {locationState === "active" && <ActivityIndicator color="#087c70" />}
      </View>
      {nearbyPoiId && <View style={styles.nearbyBanner}><Text style={styles.nearbyText}>✦  Bạn đang ở gần {pois.find((poi) => poi.id === nearbyPoiId)?.name}</Text></View>}
      <View style={styles.sectionHeading}><Text style={styles.sectionTitle}>Điểm đến quanh bạn</Text><Text style={styles.sectionCount}>{pois.length.toString().padStart(2, "0")} PLACES</Text></View>
      {pois.map((poi) => <PoiListItem key={poi.id} poi={poi} position={position} nearby={poi.id === nearbyPoiId} onPress={() => onSelectPoi(poi)} />)}
      <Text style={styles.footerText}>Đang xem nội dung · {language.toUpperCase()}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { padding: 20, paddingBottom: 32 },
  header: { paddingTop: 18, paddingBottom: 20 },
  eyebrow: { color: "#76948b", fontSize: 9, fontWeight: "700", letterSpacing: 1.8 },
  title: { marginTop: 13, color: "#153b3a", fontFamily: "serif", fontSize: 35, lineHeight: 42, fontWeight: "600" },
  titleAccent: { color: "#087c70", fontStyle: "italic" },
  description: { marginTop: 10, color: "#7d9189", fontSize: 12, lineHeight: 19 },
  locationCard: { flexDirection: "row", alignItems: "center", gap: 11, marginBottom: 22, padding: 13, borderWidth: 1, borderColor: "#dfece7", borderRadius: 13, backgroundColor: "#edf7f2" },
  locationIcon: { width: 39, height: 39, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#d8eee4" },
  pin: { color: "#087c70", fontSize: 23 },
  locationText: { flex: 1 },
  locationTitle: { color: "#244b43", fontSize: 11, fontWeight: "700" },
  locationSubtitle: { marginTop: 4, color: "#769087", fontSize: 9 },
  nearbyBanner: { marginTop: -10, marginBottom: 17, padding: 12, borderRadius: 9, backgroundColor: "#dff4e8" },
  nearbyText: { color: "#287a5d", fontSize: 11, fontWeight: "600" },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { color: "#153b3a", fontSize: 17, fontWeight: "700" },
  sectionCount: { color: "#94a69f", fontSize: 8, letterSpacing: 1 },
  footerText: { marginTop: 10, color: "#9aa9a3", fontSize: 9, textAlign: "right" },
});
