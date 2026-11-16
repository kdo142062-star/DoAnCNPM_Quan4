import { useState } from "react";
import { Alert, Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { getPoiFromQr } from "../services/api";

export function QrScannerScreen({ pois, onSelectPoi, onClose }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  async function handleBarcode({ data }) {
    if (scanned) return;
    setScanned(true);
    try {
      const poi = await getPoiFromQr(data, pois);
      if (poi.externalUrl) {
        await Linking.openURL(poi.externalUrl);
        onClose();
      } else {
        onSelectPoi(poi);
      }
    } catch (cause) {
      Alert.alert("Mã QR chưa được nhận diện", cause.message, [{ text: "Quét lại", onPress: () => setScanned(false) }]);
    }
  }

  if (!permission) return <View style={styles.center}><Text>Đang kiểm tra quyền camera...</Text></View>;
  if (!permission.granted) {
    return <View style={styles.center}><Text style={styles.title}>Cần quyền camera</Text><Text style={styles.copy}>Cho phép camera để quét mã tại điểm tham quan.</Text><TouchableOpacity style={styles.button} onPress={requestPermission}><Text style={styles.buttonText}>Cho phép camera</Text></TouchableOpacity><TouchableOpacity onPress={onClose}><Text style={styles.cancel}>Quay lại</Text></TouchableOpacity></View>;
  }

  return (
    <View style={styles.screen}>
      <CameraView style={StyleSheet.absoluteFill} facing="back" barcodeScannerSettings={{ barcodeTypes: ["qr"] }} onBarcodeScanned={scanned ? undefined : handleBarcode} />
      <View style={styles.overlay}>
        <View style={styles.top}><Text style={styles.eyebrow}>DISCOVER A PLACE</Text><TouchableOpacity style={styles.close} onPress={onClose}><Text style={styles.closeText}>×</Text></TouchableOpacity></View>
        <View style={styles.frame}><View style={[styles.corner, styles.topLeft]} /><View style={[styles.corner, styles.topRight]} /><View style={[styles.corner, styles.bottomLeft]} /><View style={[styles.corner, styles.bottomRight]} /></View>
        <View style={styles.instruction}><Text style={styles.instructionTitle}>Quét mã điểm đến</Text><Text style={styles.instructionText}>Đặt mã QR vào khung hình để mở thuyết minh.</Text></View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#102826" },
  overlay: { flex: 1, justifyContent: "space-between", padding: 23 },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  eyebrow: { color: "#d0e9df", fontSize: 9, fontWeight: "700", letterSpacing: 1.7 },
  close: { width: 35, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 18, backgroundColor: "#ffffff28" },
  closeText: { color: "#fff", fontSize: 24 },
  frame: { width: 245, height: 245, alignSelf: "center" },
  corner: { position: "absolute", width: 38, height: 38, borderColor: "#7de0ba" },
  topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 12 },
  topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 12 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 12 },
  bottomRight: { right: 0, bottom: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 12 },
  instruction: { alignItems: "center", paddingBottom: 40 },
  instructionTitle: { color: "#fff", fontFamily: "serif", fontSize: 23 },
  instructionText: { marginTop: 8, color: "#bed1ca", fontSize: 11 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28, backgroundColor: "#f7faf9" },
  title: { color: "#153b3a", fontSize: 20, fontWeight: "700" },
  copy: { marginTop: 9, color: "#71877f", fontSize: 12, textAlign: "center" },
  button: { marginTop: 19, paddingHorizontal: 18, paddingVertical: 13, borderRadius: 10, backgroundColor: "#087c70" },
  buttonText: { color: "#fff", fontWeight: "700" },
  cancel: { marginTop: 16, color: "#087c70" },
});
