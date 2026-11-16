import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { distanceMeters } from "../services/api";

export function PoiListItem({ poi, position, onPress, nearby = false }) {
  const distance = position ? distanceMeters(position, poi.coordinates) : null;
  const formattedDistance = distance === null ? "GPS chưa bật" : distance < 1000 ? `${Math.round(distance)} m` : `${(distance / 1000).toFixed(1)} km`;
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.icon, nearby && styles.iconNearby]}><Text style={styles.iconText}>{nearby ? "⌖" : "✦"}</Text></View>
      <View style={styles.body}>
        <Text style={styles.category}>{poi.category ?? "Điểm tham quan"}</Text>
        <Text style={styles.title}>{poi.name}</Text>
        <Text style={styles.distance}>⌖  {formattedDistance}  ·  Bán kính {poi.geofence_radius_m ?? 100} m</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 10, padding: 13, borderWidth: 1, borderColor: "#e5eeea", borderRadius: 13, backgroundColor: "#fff" },
  icon: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 11, backgroundColor: "#e8f4ef" },
  iconNearby: { backgroundColor: "#d8f2e7" },
  iconText: { color: "#087c70", fontSize: 22 },
  body: { flex: 1 },
  category: { color: "#82958d", fontSize: 9, letterSpacing: 0.5 },
  title: { marginTop: 4, color: "#153b3a", fontSize: 14, fontWeight: "700" },
  distance: { marginTop: 5, color: "#72877f", fontSize: 10 },
  arrow: { color: "#63a797", fontSize: 25 },
});
