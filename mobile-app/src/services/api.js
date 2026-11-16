export const languages = [
  { code: "vi", flag: "🇻🇳", name: "Tiếng Việt", voice: "vi-VN" },
  { code: "en", flag: "🇬🇧", name: "English", voice: "en-US" },
  { code: "zh", flag: "🇨🇳", name: "中文", voice: "zh-CN" },
  { code: "ko", flag: "🇰🇷", name: "한국어", voice: "ko-KR" },
  { code: "ja", flag: "🇯🇵", name: "日本語", voice: "ja-JP" },
];

const apiBase = process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const samplePois = [
  {
    id: "demo-ben-van-don",
    name: "Bến Nhà Rồng",
    category: "Di tích lịch sử",
    coordinates: { latitude: 10.7683, longitude: 106.7067 },
    geofence_radius_m: 120,
    image_url: null,
    content: {
      vi: "Bến Nhà Rồng soi bóng bên dòng sông Sài Gòn, lưu giữ câu chuyện về hành trình ra đi tìm đường cứu nước của Chủ tịch Hồ Chí Minh.",
      en: "Dragon House Wharf stands beside the Saigon River, telling the story of a journey that shaped modern Vietnamese history.",
      zh: "龙屋码头静立于西贡河畔，珍藏着一段改变越南历史的旅程。",
      ko: "드래곤 하우스 부두는 사이공강을 따라 자리하며 베트남 근현대사의 여정을 간직하고 있습니다.",
      ja: "ロンハウス埠頭はサイゴン川のほとりにあり、ベトナム近代史を形づくった旅の物語を伝えます。",
    },
    audio: {},
  },
  {
    id: "demo-vinh-hoi",
    name: "Phố ẩm thực Vĩnh Khánh",
    category: "Ẩm thực & đời sống",
    coordinates: { latitude: 10.7592, longitude: 106.7015 },
    geofence_radius_m: 100,
    image_url: null,
    content: {
      vi: "Khi phố lên đèn, Vĩnh Khánh rộn ràng với hàng quán ven đường và những món ngon mang đậm hương vị Sài Gòn.",
      en: "As evening falls, Vinh Khanh comes alive with street-side kitchens and the unmistakable flavours of Saigon.",
      zh: "夜幕降临后，永庆街的路边食摊热闹起来，飘散着西贡的独特风味。",
      ko: "저녁이 되면 빈카인 거리는 노점과 사이공 특유의 맛으로 활기를 띱니다.",
      ja: "夕暮れになると、ヴィンカイン通りは屋台とサイゴンならではの味でにぎわいます。",
    },
    audio: {},
  },
];

export function distanceMeters(from, to) {
  const radians = (value) => (value * Math.PI) / 180;
  const deltaLat = radians(to.latitude - from.latitude);
  const deltaLon = radians(to.longitude - from.longitude);
  const value = Math.sin(deltaLat / 2) ** 2
    + Math.cos(radians(from.latitude)) * Math.cos(radians(to.latitude)) * Math.sin(deltaLon / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export async function getPois(language) {
  try {
    const response = await fetch(`${apiBase}/api/pois?limit=50&language=${encodeURIComponent(language)}`);
    if (!response.ok) throw new Error(`API ${response.status}: ${response.statusText}`);
    const result = await response.json();
    const items = (result.items ?? []).map((poi) => ({
      ...poi,
      image_url: absoluteAssetUrl(poi.image_url),
      audio: Object.fromEntries(Object.entries(poi.audio ?? {}).map(([code, url]) => [code, absoluteAssetUrl(url)])),
    }));
    return { items, source: "api", error: "" };
  } catch (cause) {
    return {
      items: samplePois,
      source: "demo",
      error: `Không kết nối được API (${cause.message}); đang hiển thị dữ liệu mẫu.`,
    };
  }
}

function absoluteAssetUrl(value) {
  if (!value?.startsWith("/")) return value;
  return `${apiBase}${value}`;
}

export async function getPoiFromQr(rawValue, pois) {
  let parsed;
  try {
    parsed = new URL(rawValue);
  } catch {
    throw new Error("Mã QR không chứa liên kết hợp lệ.");
  }
  const poiId = parsed.searchParams.get("poi_id") ?? parsed.searchParams.get("id");
  const apiPathMatch = parsed.pathname.match(/\/api\/pois\/([^/]+)\/?$/);
  const resolvedPoiId = poiId ?? apiPathMatch?.[1];
  if (resolvedPoiId) {
    const poi = pois.find((item) => item.id === resolvedPoiId);
    if (poi) return poi;
    const response = await fetch(`${apiBase}/api/pois/${encodeURIComponent(resolvedPoiId)}`);
    if (!response.ok) throw new Error("Không tìm thấy điểm tham quan của mã QR.");
    return response.json();
  }
  if (parsed.protocol === "https:" || parsed.protocol === "http:") return { externalUrl: parsed.href };
  throw new Error("Mã QR không chứa liên kết web hợp lệ.");
}
