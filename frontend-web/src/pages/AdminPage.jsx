import { useEffect, useMemo, useState } from "react";
import { LanguagePicker } from "../components/LanguagePicker.jsx";
import { createPoi, fetchAdminPois, fetchAnalytics, generateAudio } from "../services/api.js";

function getDateRange() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
}

export function AdminPage() {
  const [language, setLanguage] = useState("vi");
  const [pois, setPois] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  async function refresh() {
    setError("");
    const [start, end] = getDateRange();
    const results = await Promise.allSettled([fetchAdminPois(), fetchAnalytics(start, end)]);
    if (results[0].status === "fulfilled") setPois(results[0].value.items ?? []);
    else setError(`Không tải được danh sách điểm đến: ${results[0].reason.message}`);
    if (results[1].status === "fulfilled") setAnalytics(results[1].value);
    else setError((current) => `${current}${current ? " · " : ""}Thống kê cần quyền analytics: ${results[1].reason.message}`);
  }

  useEffect(() => { refresh(); }, []);

  const visiblePois = useMemo(() => pois.filter((poi) => `${poi.name} ${poi.category}`.toLowerCase().includes(query.toLowerCase())), [pois, query]);
  const totalVisits = analytics?.total_visits ?? analytics?.total_listens ?? "—";
  const languageCount = new Set(pois.flatMap((poi) => Object.keys(poi.content ?? {}))).size;

  async function handleCreate(event) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: String(form.get("name")).trim(),
      category: String(form.get("category")).trim(),
      coordinates: { latitude: Number(form.get("latitude")), longitude: Number(form.get("longitude")) },
      geofence_radius_m: 100,
      content: { vi: String(form.get("content")).trim() },
    };
    setBusy(true);
    try {
      await createPoi(payload);
      setNotice("Đã thêm điểm tham quan.");
      formElement.reset();
      await refresh();
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleAudio(poi) {
    setBusy(true);
    setNotice("");
    try {
      await generateAudio(poi.id, language);
      setNotice(`Đã tạo audio ${language.toUpperCase()} cho ${poi.name}.`);
    } catch (cause) {
      setError(`Không thể tạo audio: ${cause.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <a className="brand" href="/"><span className="brand__mark">Q<span>4</span></span><span className="brand__text">DISTRICT <b>STUDIO</b></span></a>
        <span className="sidebar-label">WORKSPACE</span>
        <a className="sidebar-link sidebar-link--active" href="#overview"><span>▦</span> Tổng quan</a>
        <a className="sidebar-link" href="#places"><span>⌖</span> Điểm tham quan</a>
        <a className="sidebar-link" href="#translations"><span>文</span> Nội dung & audio</a>
        <div className="sidebar-bottom"><span className="avatar">Q4</span><div><b>Tourism team</b><small>District 4 workspace</small></div><span>⌄</span></div>
      </aside>
      <main className="admin-main">
        <header className="admin-topbar"><div><span className="eyebrow">WORKSPACE / DISTRICT 4</span><h1>Tourism overview</h1></div><div className="topbar__actions"><LanguagePicker value={language} onChange={setLanguage} compact /><a className="button button--light" href="/">← Cổng du khách</a><span className="profile-dot">Q</span></div></header>
        {error && <div className="admin-alert" role="alert"><b>Không thể tải dữ liệu</b><span>{error}</span><button onClick={refresh}>Thử lại</button></div>}
        {notice && <div className="admin-success" role="status">{notice}<button onClick={() => setNotice("")}>×</button></div>}
        <section className="stats-grid" id="overview">
          <article className="stat-card stat-card--feature"><span className="stat-card__top">TOTAL LISTENS <i>↗</i></span><strong>{totalVisits}</strong><span>7 ngày gần nhất · theo quyền tài khoản</span><div className="mini-chart" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></article>
          <article className="stat-card"><span className="stat-card__top">ĐIỂM THAM QUAN <i>⌖</i></span><strong>{pois.length || "—"}</strong><span>Địa điểm đang quản lý</span><div className="stat-card__bottom"><span className="status-dot" /> Dữ liệu trực tiếp</div></article>
          <article className="stat-card"><span className="stat-card__top">NGÔN NGỮ NỘI DUNG <i>文</i></span><strong>{languageCount || "—"}</strong><span>Ngôn ngữ đã xuất bản</span><div className="stat-card__bottom">VI · EN · ZH · KO · JA</div></article>
        </section>
        <section className="admin-panel" id="places">
          <div className="panel-heading"><div><span className="eyebrow">CONTENT LIBRARY</span><h2>Điểm tham quan</h2></div><label className="search-field"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm điểm đến..." /></label></div>
          <div className="table-scroll"><table><thead><tr><th>ĐỊA ĐIỂM</th><th>TOẠ ĐỘ</th><th>NGÔN NGỮ</th><th>TRẠNG THÁI</th><th>THAO TÁC</th></tr></thead><tbody>
            {visiblePois.map((poi) => <tr key={poi.id}><td><b>{poi.name}</b><small>{poi.category}</small></td><td>{poi.coordinates?.latitude?.toFixed(4)}, {poi.coordinates?.longitude?.toFixed(4)}</td><td><span className="language-chips">{Object.keys(poi.content ?? {}).map((code) => <i key={code}>{code.toUpperCase()}</i>)}</span></td><td><span className={`state-pill${poi.is_active ? " state-pill--active" : ""}`}>{poi.is_active ? "Đang hoạt động" : "Bản nháp"}</span></td><td><button className="table-action" onClick={() => handleAudio(poi)} disabled={busy}>Tạo audio {language.toUpperCase()} ↗</button></td></tr>)}
            {!visiblePois.length && <tr><td colSpan="5" className="table-empty">{pois.length ? "Không tìm thấy địa điểm." : "Đăng nhập Admin để tải và quản lý điểm tham quan."}</td></tr>}
          </tbody></table></div>
        </section>
        <section className="admin-panel create-panel" id="translations">
          <div className="panel-heading"><div><span className="eyebrow">QUICK ACTION</span><h2>Thêm điểm tham quan</h2></div><span className="panel-icon">＋</span></div>
          <form className="create-form" onSubmit={handleCreate}>
            <label>Tên điểm đến<input name="name" required maxLength="200" placeholder="Ví dụ: Cầu Mống" /></label>
            <label>Danh mục<input name="category" required maxLength="100" placeholder="Di tích, ẩm thực..." /></label>
            <label>Vĩ độ<input name="latitude" type="number" step="any" min="-90" max="90" required placeholder="10.7675" /></label>
            <label>Kinh độ<input name="longitude" type="number" step="any" min="-180" max="180" required placeholder="106.7031" /></label>
            <label className="create-form__wide">Thuyết minh tiếng Việt<textarea name="content" required maxLength="50000" rows="3" placeholder="Viết câu chuyện cho điểm tham quan..." /></label>
            <button className="button button--primary" type="submit" disabled={busy}>{busy ? "Đang lưu..." : "＋ Lưu điểm tham quan"}</button>
          </form>
        </section>
      </main>
    </div>
  );
}
