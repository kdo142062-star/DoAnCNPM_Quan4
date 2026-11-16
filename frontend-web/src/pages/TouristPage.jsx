import { useEffect, useMemo, useState } from "react";
import { AudioPlayer } from "../components/AudioPlayer.jsx";
import { LanguagePicker } from "../components/LanguagePicker.jsx";
import { PoiCard, distanceBetween } from "../components/PoiCard.jsx";
import { QrScanner } from "../components/QrScanner.jsx";
import { translate } from "../i18n/index.js";
import { demoPois, fetchPois } from "../services/api.js";

export function TouristPage() {
  const [language, setLanguage] = useState("vi");
  const [position, setPosition] = useState(null);
  const [pois, setPois] = useState([]);
  const [selected, setSelected] = useState(null);
  const [query, setQuery] = useState("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [error, setError] = useState("");
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPois(language, position)
      .then((items) => {
        if (!active) return;
        setPois(items);
        setDemoMode(false);
        setError("");
      })
      .catch((cause) => {
        if (!active) return;
        setPois(demoPois);
        setDemoMode(true);
        setError(cause.message);
      });
    return () => { active = false; };
  }, [language, position]);

  const filteredPois = useMemo(() => pois
    .filter((poi) => `${poi.name} ${poi.category}`.toLowerCase().includes(query.toLowerCase()))
    .sort((left, right) => (distanceBetween(position, left.coordinates) ?? Infinity) - (distanceBetween(position, right.coordinates) ?? Infinity)), [pois, position, query]);

  function enableLocation() {
    if (!navigator.geolocation) {
      setError("Trình duyệt này không hỗ trợ định vị GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => setPosition({ latitude: coords.latitude, longitude: coords.longitude }),
      (cause) => setError(`Không thể lấy vị trí: ${cause.message}`),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  const activePoi = selected ?? filteredPois[0];
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Q4 Explorer home"><span className="brand__mark">Q<span>4</span></span><span className="brand__text">DISTRICT <b>EXPLORER</b></span></a>
        <nav className="topbar__nav"><a className="nav-link nav-link--active" href="#explore">{translate(language, "explore")}</a><a className="nav-link" href="#nearby">{translate(language, "nearby")}</a></nav>
        <div className="topbar__actions"><LanguagePicker value={language} onChange={setLanguage} compact /><a className="admin-link" href="/admin">{translate(language, "admin")} <span>↗</span></a></div>
      </header>

      <main>
        <section className="hero">
          <div className="hero__copy">
            <span className="eyebrow"><span className="live-dot" /> SAIGON, VIETNAM <span className="hero__divider">/</span> YOUR LOCAL GUIDE</span>
            <h1>{translate(language, "welcome").split(" ").slice(0, -2).join(" ")} <em>{translate(language, "welcome").split(" ").slice(-2).join(" ")}</em></h1>
            <p>{translate(language, "subtitle")}</p>
            <div className="hero__buttons"><button className="button button--primary" onClick={enableLocation}>⌖ {position ? translate(language, "locationOn") : translate(language, "location")}</button><button className="button button--light" onClick={() => setScannerOpen(true)}>▦ {translate(language, "scan")}</button></div>
            <div className="hero__foot"><span>01 — 05 <i /></span><span>CURATED FOR THE CURIOUS</span></div>
          </div>
          <div className="hero__visual">
            <div className="hero__photo" role="img" aria-label="Saigon riverside at sunset" />
            <div className="map-card"><div className="map-card__dots"><span /><span /><span /><span /></div><div className="map-card__label"><span>⌖</span><div><b>QUẬN 4</b><small>10°45' N · 106°42' E</small></div></div><div className="map-card__route" /></div>
            <div className="hero__caption"><span>01 / CITY NOTES</span><b>Where the city meets the river.</b></div>
          </div>
          <span className="hero__index">10°45′ N<br />106°42′ E</span>
        </section>

        <section className="discover-section" id="explore">
          <div className="section-heading"><div><span className="eyebrow">THE NEIGHBOURHOOD, UP CLOSE</span><h2>{translate(language, "nearbyTitle")}<span className="heading-dot">.</span></h2></div><div className="section-heading__tools"><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={translate(language, "search")} /></label><button className="icon-button map-button" onClick={enableLocation} aria-label="Find places near my location">⌖</button></div></div>
          {demoMode && <div className="notice" role="status"><span>ⓘ</span><div><b>{translate(language, "demo")}</b><small>{error} · Khởi động backend để tải điểm tham quan trực tiếp.</small></div></div>}
          {position && <p className="location-note">⌖ GPS {position.latitude.toFixed(4)}, {position.longitude.toFixed(4)} · Sắp xếp theo khoảng cách</p>}
          <div className="poi-grid" id="nearby">
            {filteredPois.map((poi, index) => <div className="poi-grid__item" key={poi.id}><span className="poi-grid__index">0{index + 1}</span><PoiCard poi={poi} position={position} language={language} selected={activePoi?.id === poi.id} onSelect={setSelected} /></div>)}
            {!filteredPois.length && <div className="empty-state">Không tìm thấy điểm tham quan phù hợp.</div>}
          </div>
          <div className="journey-row"><span>✳</span><p>ĐI CHẬM LẠI. <b>NGHE THÀNH PHỐ KỂ CHUYỆN.</b></p><span>⌁</span></div>
        </section>

        <section className="audio-section"><div className="audio-section__heading"><div><span className="eyebrow">A MOMENT TO LISTEN</span><h2>Every place<br />has a <em>voice.</em></h2></div><p>Chọn một điểm đến để đọc câu chuyện và nghe thuyết minh bằng ngôn ngữ của bạn.</p></div><AudioPlayer poi={activePoi} language={language} /></section>
      </main>
      <footer className="footer"><a className="brand" href="/"><span className="brand__mark">Q<span>4</span></span><span className="brand__text">DISTRICT <b>EXPLORER</b></span></a><span>LOCAL STORIES. OPEN HORIZONS.</span><span>© Q4 TOURISM · HO CHI MINH CITY</span></footer>
      {scannerOpen && <QrScanner onClose={() => setScannerOpen(false)} />}
    </div>
  );
}
