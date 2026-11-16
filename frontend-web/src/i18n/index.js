export const languages = [
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt", short: "VI" },
  { code: "en", flag: "🇬🇧", name: "English", short: "EN" },
  { code: "zh", flag: "🇨🇳", name: "中文", short: "ZH" },
  { code: "ko", flag: "🇰🇷", name: "한국어", short: "KO" },
  { code: "ja", flag: "🇯🇵", name: "日本語", short: "JA" },
];

export const messages = {
  vi: {
    explore: "Khám phá", nearby: "Gần bạn", listen: "Nghe thuyết minh",
    scan: "Quét mã QR", search: "Tìm điểm đến", distance: "Khoảng cách",
    welcome: "Chạm vào nhịp sống Quận 4", subtitle: "Câu chuyện địa phương, hành trình của riêng bạn.",
    location: "Bật vị trí", locationOn: "Đang định vị", demo: "Đang xem dữ liệu mẫu",
    admin: "Quản trị", nowPlaying: "ĐANG PHÁT", noAudio: "Chưa có audio cho ngôn ngữ này.",
    captions: "Lời thuyết minh", nearbyTitle: "Điểm đến quanh bạn",
  },
  en: {
    explore: "Explore", nearby: "Nearby", listen: "Audio guide",
    scan: "Scan QR", search: "Find a place", distance: "Distance",
    welcome: "Find your rhythm in District 4", subtitle: "Local stories, your own journey.",
    location: "Enable location", locationOn: "Locating", demo: "Showing sample data",
    admin: "Admin", nowPlaying: "NOW PLAYING", noAudio: "No audio is available in this language.",
    captions: "Narration", nearbyTitle: "Places around you",
  },
  zh: {
    explore: "探索", nearby: "附近", listen: "语音导览",
    scan: "扫描二维码", search: "搜索景点", distance: "距离",
    welcome: "探索第四郡的城市节奏", subtitle: "聆听本地故事，开启专属旅程。",
    location: "开启定位", locationOn: "正在定位", demo: "正在显示示例数据",
    admin: "管理", nowPlaying: "正在播放", noAudio: "暂无此语言的音频。",
    captions: "讲解文本", nearbyTitle: "附近景点",
  },
  ko: {
    explore: "둘러보기", nearby: "내 주변", listen: "오디오 가이드",
    scan: "QR 스캔", search: "장소 찾기", distance: "거리",
    welcome: "4군의 도시 리듬을 만나보세요", subtitle: "현지의 이야기와 나만의 여행.",
    location: "위치 켜기", locationOn: "위치 확인 중", demo: "샘플 데이터 표시 중",
    admin: "관리자", nowPlaying: "재생 중", noAudio: "이 언어의 오디오가 없습니다.",
    captions: "가이드 자막", nearbyTitle: "주변 명소",
  },
  ja: {
    explore: "見つける", nearby: "近く", listen: "音声ガイド",
    scan: "QRをスキャン", search: "スポットを検索", distance: "距離",
    welcome: "4区の街のリズムを見つけよう", subtitle: "街の物語と、あなただけの旅。",
    location: "位置情報を有効化", locationOn: "位置情報を取得中", demo: "サンプルデータを表示中",
    admin: "管理", nowPlaying: "再生中", noAudio: "この言語の音声はありません。",
    captions: "ガイド字幕", nearbyTitle: "近くのスポット",
  },
};

export function translate(language, key) {
  return messages[language]?.[key] ?? messages.en[key] ?? key;
}
