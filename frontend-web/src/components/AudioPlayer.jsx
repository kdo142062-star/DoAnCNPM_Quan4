import { useEffect, useRef, useState } from "react";
import { translate } from "../i18n/index.js";

export function AudioPlayer({ poi, language }) {
  const audioRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const content = poi?.content?.[language] ?? poi?.content?.[poi?.content_language] ?? "";
  const audioUrl = poi?.audio?.[language];

  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    if (audioRef.current) audioRef.current.pause();
  }, [poi?.id, language]);

  async function togglePlayback() {
    if (!audioUrl || !audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    try {
      await audioRef.current.play();
      setPlaying(true);
    } catch (error) {
      console.error("Audio playback failed:", error);
    }
  }

  return (
    <section className="audio-player" aria-label={translate(language, "listen")}>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={() => setProgress(audioRef.current?.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0)}
          onEnded={() => setPlaying(false)}
          onError={() => setPlaying(false)}
        />
      )}
      <div className="audio-player__top">
        <div>
          <span className="eyebrow">{playing ? translate(language, "nowPlaying") : translate(language, "listen")}</span>
          <h3>{poi?.name ?? "Choose a destination"}</h3>
        </div>
        <div className={`waveform${playing ? " waveform--playing" : ""}`} aria-hidden="true">
          {Array.from({ length: 28 }, (_, index) => <i key={index} style={{ "--wave": `${12 + ((index * 17) % 29)}px` }} />)}
        </div>
      </div>
      <div className="audio-player__controls">
        <button className="play-button" type="button" onClick={togglePlayback} disabled={!audioUrl} aria-label={playing ? "Pause audio" : "Play audio"}>
          {playing ? "Ⅱ" : "▶"}
        </button>
        <div className="audio-player__timeline">
          <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>
          <div className="audio-player__time"><span>{playing ? "LIVE" : "00:00"}</span><span>{audioUrl ? "AUDIO GUIDE" : translate(language, "noAudio")}</span></div>
        </div>
        <span className="audio-player__language">{language.toUpperCase()}</span>
      </div>
      <div className="caption-box">
        <span className="caption-box__icon" aria-hidden="true">“</span>
        <div><span className="eyebrow">{translate(language, "captions")}</span><p>{content || translate(language, "noAudio")}</p></div>
      </div>
    </section>
  );
}
