export interface MarineWaypoint {
  name: string;
  nameVi: string;
  lat: number;
  lng: number;
  type: "PORT" | "WAYPOINT" | "STRAIT" | "CANAL";
  notesVi?: string;
  notesEn?: string;
}

export interface MarineRoute {
  id: string;
  blNumber: string;
  vesselName: string;
  carrierName: string;
  imoNumber: string;
  originPort: string;
  originPortVi: string;
  destinationPort: string;
  destinationPortVi: string;
  totalDistanceNm: number; // Nautical Miles
  waypoints: MarineWaypoint[];
}

export const MARINE_ROUTES: Record<string, MarineRoute> = {
  "QTH-BL-2026-JP01": {
    id: "route-tokyo",
    blNumber: "QTH-BL-2026-JP01",
    vesselName: "ONE APUS",
    carrierName: "Ocean Network Express (ONE)",
    imoNumber: "9806079",
    originPort: "Cat Lai Port, Ho Chi Minh City (VNM)",
    originPortVi: "Tân Cảng Cát Lái, TP. Hồ Chí Minh (VNM)",
    destinationPort: "Tokyo Port (JPN)",
    destinationPortVi: "Cảng Tokyo (Nhật Bản)",
    totalDistanceNm: 2420,
    waypoints: [
      {
        name: "Cat Lai Port (VNM)",
        nameVi: "Cảng Cát Lái (TP.HCM)",
        lat: 10.76,
        lng: 106.79,
        type: "PORT",
        notesVi: "Cảng bốc hàng chính ngạch (POL) • Chi cục Hải quan KV1",
        notesEn: "Port of Loading (POL) • Sailed from Terminal",
      },
      {
        name: "Vung Tau Pilot Station",
        nameVi: "Hoa tiêu Vũng Tàu",
        lat: 10.34,
        lng: 107.08,
        type: "WAYPOINT",
        notesVi: "Thuyền trưởng trả hoa tiêu, bắt đầu tăng tốc hải trình",
        notesEn: "Pilot disembarked, vessel at sea cruising speed",
      },
      {
        name: "South China Sea Open Waters",
        nameVi: "Vùng biển Nam Trung Bộ",
        lat: 13.5,
        lng: 111.5,
        type: "WAYPOINT",
        notesVi: "Điều kiện sóng biển cấp 3, thời tiết thuận lợi",
        notesEn: "Calm sea state 3, favorable tailwinds",
      },
      {
        name: "Luzon Strait / Bashi Channel",
        nameVi: "Eo biển Ba Sĩ (Luzon)",
        lat: 20.8,
        lng: 121.2,
        type: "STRAIT",
        notesVi: "Vượt qua eo biển quốc tế vào Tây Thái Bình Dương",
        notesEn: "Transiting deep international waterway into Pacific",
      },
      {
        name: "East China Sea",
        nameVi: "Biển Hoa Đông",
        lat: 25.5,
        lng: 127.2,
        type: "WAYPOINT",
        notesVi: "Vị trí tàu hiện tại • Tốc độ ổn định 18.4 hải lý/giờ",
        notesEn: "Current vessel position • Steady cruising at 18.4 knots",
      },
      {
        name: "Izu Islands Approach",
        nameVi: "Vùng biển quần đảo Izu",
        lat: 33.2,
        lng: 139.2,
        type: "WAYPOINT",
        notesVi: "Bắt đầu liên lạc Đài kiểm soát hàng hải Vịnh Tokyo",
        notesEn: "Contact established with Tokyo Bay Vessel Traffic Service",
      },
      {
        name: "Uraga Channel",
        nameVi: "Luồng hàng hải Uraga",
        lat: 35.15,
        lng: 139.75,
        type: "STRAIT",
        notesVi: "Đón hoa tiêu dẫn tàu cập bến cảng Tokyo",
        notesEn: "Inbound pilot boarding station",
      },
      {
        name: "Oi Container Terminal (Tokyo)",
        nameVi: "Cầu cảng Oi, Cảng Tokyo",
        lat: 35.62,
        lng: 139.77,
        type: "PORT",
        notesVi: "Cảng dỡ hàng (POD) • Hạ bãi chờ thông quan người mua",
        notesEn: "Port of Discharge (POD) • Container offloading",
      },
    ],
  },
  "QTH-BL-2026-US02": {
    id: "route-usa",
    blNumber: "QTH-BL-2026-US02",
    vesselName: "EVER GIVEN",
    carrierName: "Evergreen Marine Corporation (EMC)",
    imoNumber: "9811000",
    originPort: "Cat Lai Port, Ho Chi Minh City (VNM)",
    originPortVi: "Tân Cảng Cát Lái, TP. Hồ Chí Minh (VNM)",
    destinationPort: "Port of Los Angeles (USA)",
    destinationPortVi: "Cảng Los Angeles (Hoa Kỳ)",
    totalDistanceNm: 7300,
    waypoints: [
      {
        name: "Cat Lai Port (VNM)",
        nameVi: "Cảng Cát Lái (TP.HCM)",
        lat: 10.76,
        lng: 106.79,
        type: "PORT",
      },
      {
        name: "Vung Tau Pilot Station",
        nameVi: "Phao số 0 Vũng Tàu",
        lat: 10.34,
        lng: 107.08,
        type: "WAYPOINT",
      },
      {
        name: "Balabac Strait",
        nameVi: "Eo biển Balabac",
        lat: 7.9,
        lng: 117.1,
        type: "STRAIT",
      },
      {
        name: "San Bernardino Strait",
        nameVi: "Eo biển San Bernardino",
        lat: 12.6,
        lng: 124.3,
        type: "STRAIT",
      },
      {
        name: "Mid-Pacific Basin",
        nameVi: "Trung tâm Thái Bình Dương",
        lat: 22.0,
        lng: 165.0,
        type: "WAYPOINT",
      },
      {
        name: "International Date Line",
        nameVi: "Đường đổi ngày quốc tế (180°)",
        lat: 28.5,
        lng: -180.0,
        type: "WAYPOINT",
      },
      {
        name: "California Offshore Fairway",
        nameVi: "Vùng biển ngoài khơi California",
        lat: 33.2,
        lng: -121.5,
        type: "WAYPOINT",
      },
      {
        name: "Port of Los Angeles (USA)",
        nameVi: "Cảng Los Angeles (Hoa Kỳ)",
        lat: 33.74,
        lng: -118.25,
        type: "PORT",
      },
    ],
  },
  "QTH-BL-2026-EU03": {
    id: "route-europe",
    blNumber: "QTH-BL-2026-EU03",
    vesselName: "MSC OSCAR",
    carrierName: "Mediterranean Shipping Company (MSC)",
    imoNumber: "9703291",
    originPort: "Cat Lai Port, Ho Chi Minh City (VNM)",
    originPortVi: "Tân Cảng Cát Lái, TP. Hồ Chí Minh (VNM)",
    destinationPort: "Port of Rotterdam (NLD)",
    destinationPortVi: "Cảng Rotterdam (Hà Lan / Châu Âu)",
    totalDistanceNm: 8850,
    waypoints: [
      {
        name: "Cat Lai Port (VNM)",
        nameVi: "Cảng Cát Lái (TP.HCM)",
        lat: 10.76,
        lng: 106.79,
        type: "PORT",
      },
      {
        name: "Singapore Strait",
        nameVi: "Eo biển Singapore",
        lat: 1.25,
        lng: 103.8,
        type: "STRAIT",
      },
      {
        name: "Malacca Strait",
        nameVi: "Eo biển Malacca",
        lat: 4.5,
        lng: 99.0,
        type: "STRAIT",
      },
      {
        name: "Sri Lanka Offshore (Dondra Head)",
        nameVi: "Vùng biển phía Nam Sri Lanka",
        lat: 5.8,
        lng: 80.5,
        type: "WAYPOINT",
      },
      {
        name: "Bab-el-Mandeb Strait",
        nameVi: "Eo biển Bab-el-Mandeb",
        lat: 12.6,
        lng: 43.3,
        type: "STRAIT",
      },
      {
        name: "Red Sea Shipping Lane",
        nameVi: "Hải trình Biển Đỏ",
        lat: 21.0,
        lng: 38.5,
        type: "WAYPOINT",
      },
      {
        name: "Suez Canal (EGY)",
        nameVi: "Kênh đào Suez (Ai Cập)",
        lat: 29.93,
        lng: 32.55,
        type: "CANAL",
      },
      {
        name: "Mediterranean Sea",
        nameVi: "Địa Trung Hải",
        lat: 34.5,
        lng: 24.0,
        type: "WAYPOINT",
      },
      {
        name: "Strait of Gibraltar",
        nameVi: "Eo biển Gibraltar",
        lat: 35.95,
        lng: -5.6,
        type: "STRAIT",
      },
      {
        name: "English Channel",
        nameVi: "Eo biển Manche",
        lat: 50.1,
        lng: -0.5,
        type: "STRAIT",
      },
      {
        name: "Port of Rotterdam (NLD)",
        nameVi: "Cảng Rotterdam (Hà Lan)",
        lat: 51.95,
        lng: 4.05,
        type: "PORT",
      },
    ],
  },
};

/**
 * Tính toán vị trí nội suy của tàu biển trên hải đồ dựa theo % tiến độ (0% đến 100%)
 */
export function interpolateShipPosition(
  waypoints: MarineWaypoint[],
  progressPercent: number
): { lat: number; lng: number; bearing: number; currentSegmentIndex: number } {
  if (waypoints.length === 0) {
    return { lat: 10.76, lng: 106.79, bearing: 45, currentSegmentIndex: 0 };
  }
  if (waypoints.length === 1 || progressPercent <= 0) {
    return { lat: waypoints[0].lat, lng: waypoints[0].lng, bearing: 45, currentSegmentIndex: 0 };
  }
  if (progressPercent >= 100) {
    const last = waypoints[waypoints.length - 1];
    return { lat: last.lat, lng: last.lng, bearing: 45, currentSegmentIndex: waypoints.length - 2 };
  }

  const clampedProgress = Math.max(0, Math.min(100, progressPercent)) / 100;
  const totalSegments = waypoints.length - 1;
  const scaledIndex = clampedProgress * totalSegments;
  const segIndex = Math.min(Math.floor(scaledIndex), totalSegments - 1);
  const segFraction = scaledIndex - segIndex;

  const p1 = waypoints[segIndex];
  const p2 = waypoints[segIndex + 1];

  const lat = p1.lat + (p2.lat - p1.lat) * segFraction;
  const lng = p1.lng + (p2.lng - p1.lng) * segFraction;

  // Tính góc hướng la bàn (bearing 0-360)
  const dLng = (p2.lng - p1.lng) * (Math.PI / 180);
  const lat1 = p1.lat * (Math.PI / 180);
  const lat2 = p2.lat * (Math.PI / 180);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return {
    lat: Math.round(lat * 1000) / 1000,
    lng: Math.round(lng * 1000) / 1000,
    bearing: Math.round(bearing),
    currentSegmentIndex: segIndex,
  };
}
