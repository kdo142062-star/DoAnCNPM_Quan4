const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

function absoluteAssetUrl(value) {
  if (!value?.startsWith("/") || !API_BASE) return value;
  return new URL(value, API_BASE).toString();
}

export const demoPois = [
  {
    id: "demo-ben-van-don",
    name: "Bến Nhà Rồng",
    category: "Di tích lịch sử",
    coordinates: { latitude: 10.7683, longitude: 106.7067 },
    geofence_radius_m: 120,
    image_url: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=85",
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
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=1200&q=85",
    content: {
      vi: "Khi phố lên đèn, Vĩnh Khánh rộn ràng với hàng quán ven đường và những món ngon mang đậm hương vị Sài Gòn.",
      en: "As evening falls, Vinh Khanh comes alive with street-side kitchens and the unmistakable flavours of Saigon.",
      zh: "夜幕降临后，永庆街的路边食摊热闹起来，飘散着西贡的独特风味。",
      ko: "저녁이 되면 빈카인 거리는 노점과 사이공 특유의 맛으로 활기를 띱니다.",
      ja: "夕暮れになると、ヴィンカイン通りは屋台とサイゴンならではの味でにぎわいます。",
    },
    audio: {},
  },
  {
    id: "demo-cau-mong",
    name: "Cầu Mống",
    category: "Kiến trúc & cảnh quan",
    coordinates: { latitude: 10.7675, longitude: 106.7031 },
    geofence_radius_m: 80,
    image_url: "https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=1200&q=85",
    content: {
      vi: "Cây cầu màu xanh ngọc nối đôi bờ kênh Bến Nghé là một trong những dấu mốc kiến trúc lâu đời của thành phố.",
      en: "The turquoise bridge crossing Ben Nghe Canal is one of the city's enduring architectural landmarks.",
      zh: "横跨槟义运河的青绿色桥梁，是这座城市经久不衰的建筑地标之一。",
      ko: "벤응에 운하를 가로지르는 청록색 다리는 도시의 오랜 건축 명소입니다.",
      ja: "ベンゲー運河に架かる青緑色の橋は、街を代表する歴史ある建築のひとつです。",
    },
    audio: {},
  },
];

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}/api${path}`, {
    credentials: "include",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`API ${response.status}: ${detail || response.statusText}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

export async function fetchPois(language, position) {
  const params = new URLSearchParams({ limit: "50", language });
  if (position) {
    params.set("latitude", String(position.latitude));
    params.set("longitude", String(position.longitude));
    params.set("radius_m", "10000");
  }
  const result = await request(`/pois?${params}`);
  return (result.items ?? []).map((poi) => ({
    ...poi,
    image_url: absoluteAssetUrl(poi.image_url),
    audio: Object.fromEntries(Object.entries(poi.audio ?? {}).map(([code, url]) => [code, absoluteAssetUrl(url)])),
  }));
}

export async function fetchAdminPois() {
  return request("/admin/pois?limit=100");
}

export async function fetchAnalytics(startDate, endDate) {
  const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
  return request(`/admin/reports?${params}`);
}

export async function createPoi(payload) {
  return request("/admin/pois", { method: "POST", body: JSON.stringify(payload) });
}

export async function generateAudio(poiId, language) {
  return request(`/admin/pois/${encodeURIComponent(poiId)}/audio/${language}/generate`, { method: "POST" });
}
