import { useEffect, useRef, useState } from "react";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import * as Speech from "expo-speech";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { languages } from "../services/api";

export function AudioGuideScreen({ poi, language, autoPlaySignal = 0 }) {
  const text = poi?.content?.[language] ?? poi?.content?.[poi?.content_language] ?? poi?.content?.vi ?? "";
  const audioUrl = poi?.audio?.[language];
  const player = useAudioPlayer(audioUrl ?? null, { updateInterval: 250 });
  const status = useAudioPlayerStatus(player);
  const [speechPlaying, setSpeechPlaying] = useState(false);
  const [playbackError, setPlaybackError] = useState("");
  const playing = audioUrl ? status.playing : speechPlaying;
  const handledAutoPlaySignal = useRef(0);

  useEffect(() => {
    setSpeechPlaying(false);
    setPlaybackError("");
    Speech.stop();
    return () => {
      Speech.stop();
    };
  }, [audioUrl, poi?.id, language]);

  useEffect(() => {
    if (!autoPlaySignal || handledAutoPlaySignal.current === autoPlaySignal || (audioUrl && !status.isLoaded)) return;
    handledAutoPlaySignal.current = autoPlaySignal;
    if (audioUrl) {
      player.play();
      return;
    }
    if (text) {
      const voice = languages.find((item) => item.code === language)?.voice ?? "vi-VN";
      Speech.speak(text, {
        language: voice,
        onDone: () => setSpeechPlaying(false),
        onStopped: () => setSpeechPlaying(false),
        onError: (cause) => {
          setPlaybackError(`Không thể phát giọng đọc: ${cause.message}`);
          setSpeechPlaying(false);
        },
      });
      setSpeechPlaying(true);
    }
  }, [autoPlaySignal, audioUrl, language, player, status.isLoaded, text]);

  async function togglePlayback() {
    try {
      setPlaybackError("");
      if (audioUrl) {
        if (status.playing) player.pause();
        else player.play();
      } else if (text) {
        if (playing) {
          Speech.stop();
          setSpeechPlaying(false);
        } else {
          const voice = languages.find((item) => item.code === language)?.voice ?? "vi-VN";
          Speech.speak(text, {
            language: voice,
            onDone: () => setSpeechPlaying(false),
            onStopped: () => setSpeechPlaying(false),
            onError: (cause) => {
              setPlaybackError(`Không thể phát giọng đọc: ${cause.message}`);
              setSpeechPlaying(false);
            },
          });
          setSpeechPlaying(true);
        }
      }
    } catch (cause) {
      setPlaybackError(`Không thể phát audio: ${cause.message}`);
      setSpeechPlaying(false);
    }
  }

  if (!poi) return <View style={styles.empty}><Text style={styles.emptyIcon}>♫</Text><Text style={styles.emptyTitle}>Chọn một điểm đến</Text><Text style={styles.emptyText}>Khám phá danh sách địa điểm để nghe thuyết minh.</Text></View>;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>LISTEN · {language.toUpperCase()}</Text>
      <Text style={styles.title}>Chuyện kể{`\n`}từ <Text style={styles.titleAccent}>Quận 4.</Text></Text>
      <View style={styles.artwork}><View style={styles.artworkRing}><Text style={styles.artworkIcon}>♫</Text></View><Text style={styles.artworkLabel}>Q4 · AUDIO GUIDE</Text></View>
      <View style={styles.track}><Text style={styles.category}>{poi.category ?? "Điểm tham quan"}</Text><Text style={styles.poiName}>{poi.name}</Text><Text style={styles.language}>{languages.find((item) => item.code === language)?.flag}  {languages.find((item) => item.code === language)?.name}</Text></View>
      <View style={styles.wave}>{Array.from({ length: 31 }, (_, index) => <View key={index} style={[styles.waveBar, { height: 8 + ((index * 19) % 35), backgroundColor: playing && index % 4 === 0 ? "#087c70" : "#b3dacc" }]} />)}</View>
      <TouchableOpacity style={styles.playButton} onPress={togglePlayback} disabled={Boolean(audioUrl) && !status.isLoaded} accessibilityLabel={playing ? "Pause guide" : "Play guide"}>
        <Text style={styles.playIcon}>{playing ? "Ⅱ" : "▶"}</Text>
      </TouchableOpacity>
      <Text style={styles.playHint}>{audioUrl ? "THUYẾT MINH ÂM THANH" : "ĐỌC BẰNG GIỌNG NÓI THIẾT BỊ"}</Text>
      {playbackError ? <Text style={styles.error}>{playbackError}</Text> : null}
      <View style={styles.caption}><Text style={styles.captionLabel}>LỜI THUYẾT MINH</Text><Text style={styles.captionText}>{text || "Chưa có nội dung cho ngôn ngữ này."}</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f7faf9" },
  content: { alignItems: "center", padding: 22, paddingBottom: 35 },
  eyebrow: { alignSelf: "flex-start", marginTop: 18, color: "#78948b", fontSize: 9, fontWeight: "700", letterSpacing: 1.8 },
  title: { alignSelf: "flex-start", marginTop: 14, color: "#153b3a", fontFamily: "serif", fontSize: 35, lineHeight: 42 },
  titleAccent: { color: "#087c70", fontStyle: "italic" },
  artwork: { width: "100%", height: 195, alignItems: "center", justifyContent: "center", marginTop: 19, borderRadius: 17, backgroundColor: "#174a46" },
  artworkRing: { width: 86, height: 86, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#8ce0c2", borderRadius: 43, backgroundColor: "#ffffff12" },
  artworkIcon: { color: "#c5f1df", fontSize: 38 },
  artworkLabel: { position: "absolute", bottom: 17, color: "#b7d8cb", fontSize: 8, letterSpacing: 2 },
  track: { width: "100%", marginTop: 17 },
  category: { color: "#7e938b", fontSize: 9 },
  poiName: { marginTop: 4, color: "#153b3a", fontFamily: "serif", fontSize: 22, fontWeight: "600" },
  language: { marginTop: 7, color: "#739087", fontSize: 10 },
  wave: { width: "100%", height: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, marginTop: 10 },
  waveBar: { width: 3, borderRadius: 5 },
  playButton: { width: 58, height: 58, alignItems: "center", justifyContent: "center", marginTop: 13, borderRadius: 29, backgroundColor: "#087c70" },
  playIcon: { color: "#fff", fontSize: 19 },
  playHint: { marginTop: 9, color: "#859890", fontSize: 8, letterSpacing: 1.3 },
  error: { marginTop: 9, color: "#a34135", fontSize: 10, textAlign: "center" },
  caption: { width: "100%", marginTop: 20, padding: 15, borderRadius: 11, backgroundColor: "#edf5f1" },
  captionLabel: { color: "#719187", fontSize: 8, fontWeight: "700", letterSpacing: 1.2 },
  captionText: { marginTop: 7, color: "#57736a", fontSize: 12, lineHeight: 19 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30 },
  emptyIcon: { color: "#54a790", fontSize: 36 },
  emptyTitle: { marginTop: 14, color: "#153b3a", fontSize: 18, fontWeight: "700" },
  emptyText: { marginTop: 7, color: "#82948d", fontSize: 11, textAlign: "center" },
});
