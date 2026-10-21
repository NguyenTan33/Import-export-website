import { StowedBoxCoordinate, CenterOfGravity } from "@/types";

export interface ItemStowageSpec {
  productId?: number;
  itemName: string;
  cartonLengthM: number;
  cartonWidthM: number;
  cartonHeightM: number;
  weightKgPerCarton: number;
  totalCartons: number;
  colorHex: string;
}

/**
 * Tạo mô hình xếp thùng 3D (3D Container Bin Packing) thực tế cho container 20GP, 40GP, hoặc 40HC.
 * Giúp hiển thị trực quan không gian xếp dỡ ngay cả khi offline hoặc tính toán sơ bộ.
 */
export function generateRealisticStowedBoxes(
  containerType: "20GP" | "40GP" | "40HC",
  customItems?: ItemStowageSpec[]
): { stowedBoxes: StowedBoxCoordinate[]; centerOfGravity: CenterOfGravity } {
  const containerLength = containerType === "20GP" ? 5.9 : 12.03;
  const containerWidth = 2.35;
  const containerHeight = containerType === "40HC" ? 2.69 : 2.39;

  const defaultItems: ItemStowageSpec[] = [
    {
      productId: 1,
      itemName: "Giày sneaker xuất khẩu (12 đôi/thùng)",
      cartonLengthM: 0.6,
      cartonWidthM: 0.4,
      cartonHeightM: 0.35,
      weightKgPerCarton: 12.5,
      totalCartons: 100,
      colorHex: "#0E4B94", // Classic Blue
    },
    {
      productId: 2,
      itemName: "Than không khói BBQ (10 hộp/thùng)",
      cartonLengthM: 0.45,
      cartonWidthM: 0.35,
      cartonHeightM: 0.28,
      weightKgPerCarton: 10.0,
      totalCartons: 180,
      colorHex: "#D97706", // Amber
    },
    {
      productId: 5,
      itemName: "Băng keo OPP 48mm (72 cuộn/thùng)",
      cartonLengthM: 0.4,
      cartonWidthM: 0.4,
      cartonHeightM: 0.25,
      weightKgPerCarton: 14.0,
      totalCartons: 60,
      colorHex: "#059669", // Emerald Green
    },
  ];

  const itemsToStow = customItems && customItems.length > 0 ? customItems : defaultItems;
  const stowedBoxes: StowedBoxCoordinate[] = [];

  let curX = 0.05; // 5cm clearance from front bulkhead
  let curY = 0.0;  // Floor
  let curZ = 0.05; // 5cm clearance from left wall
  let currentLayer = 1;
  let maxLayerHeightInRow = 0;

  for (const item of itemsToStow) {
    const l = item.cartonLengthM;
    const w = item.cartonWidthM;
    const h = item.cartonHeightM;

    for (let c = 0; c < item.totalCartons; c++) {
      // Check if box exceeds container width
      if (curZ + w > containerWidth - 0.05) {
        curZ = 0.05;
        curX += l;
      }

      // Check if row exceeds container length
      if (curX + l > containerLength - 0.15) {
        curX = 0.05;
        curZ = 0.05;
        curY += maxLayerHeightInRow > 0 ? maxLayerHeightInRow : h;
        currentLayer++;
        maxLayerHeightInRow = 0;
      }

      // Check if height exceeds container ceiling
      if (curY + h > containerHeight - 0.05) {
        break; // Filled to capacity
      }

      stowedBoxes.push({
        productId: item.productId,
        itemName: item.itemName,
        x: Math.round(curX * 1000) / 1000,
        y: Math.round(curY * 1000) / 1000,
        z: Math.round(curZ * 1000) / 1000,
        lengthM: l,
        widthM: w,
        heightM: h,
        weightKg: item.weightKgPerCarton,
        colorHex: item.colorHex,
        layerIndex: currentLayer,
      });

      maxLayerHeightInRow = Math.max(maxLayerHeightInRow, h);
      curZ += w;
    }
  }

  // Calculate Center of Gravity (CoG)
  const centerOfGravity = calculateClientCoG(stowedBoxes, containerLength, containerWidth, containerHeight);

  return { stowedBoxes, centerOfGravity };
}

function calculateClientCoG(
  boxes: StowedBoxCoordinate[],
  containerLength: number,
  containerWidth: number,
  containerHeight: number
): CenterOfGravity {
  if (boxes.length === 0) {
    return {
      centerXM: Number((containerLength / 2).toFixed(2)),
      centerYM: 0.1,
      centerZM: Number((containerWidth / 2).toFixed(2)),
      longitudeDeviationPercent: 0,
      lateralDeviationPercent: 0,
      balanceStatus: "BALANCED_SAFE",
      statusTextVi: "Trọng tâm cân bằng an toàn",
      statusTextEn: "Center of Gravity Safe & Balanced",
      safetyAdvice: "Lực phân bố đều khắp mặt sàn container theo tiêu chuẩn IMO/CSC.",
    };
  }

  let totalWeight = 0;
  let sumWeightX = 0;
  let sumWeightY = 0;
  let sumWeightZ = 0;

  for (const b of boxes) {
    const w = b.weightKg || 10;
    const cx = b.x + b.lengthM / 2;
    const cy = b.y + b.heightM / 2;
    const cz = b.z + b.widthM / 2;

    totalWeight += w;
    sumWeightX += w * cx;
    sumWeightY += w * cy;
    sumWeightZ += w * cz;
  }

  const cogX = sumWeightX / totalWeight;
  const cogY = sumWeightY / totalWeight;
  const cogZ = sumWeightZ / totalWeight;

  const idealX = containerLength / 2;
  const idealZ = containerWidth / 2;

  const longDev = ((cogX - idealX) / containerLength) * 100;
  const latDev = ((cogZ - idealZ) / containerWidth) * 100;

  let balanceStatus = "BALANCED_SAFE";
  let statusTextVi = "Trọng tâm cân bằng hoàn hảo (Safe)";
  let statusTextEn = "Balanced & Safe Center of Gravity";
  let safetyAdvice = "Hàng hóa phân bố đều, đảm bảo an toàn tuyệt đối khi cẩu hạ bốc dỡ và vận tải biển.";

  if (Math.abs(latDev) > 5) {
    if (latDev > 0) {
      balanceStatus = "WARNING_STARBOARD_HEAVY";
      statusTextVi = "Cảnh báo: Lệch mạn phải (+Z)";
      statusTextEn = "Warning: Starboard Heavy Tilt";
      safetyAdvice = "Trọng tâm dồn về mạn phải container. Cần phân bổ đều các kiện nặng sang bên trái.";
    } else {
      balanceStatus = "WARNING_PORT_HEAVY";
      statusTextVi = "Cảnh báo: Lệch mạn trái (-Z)";
      statusTextEn = "Warning: Port Heavy Tilt";
      safetyAdvice = "Trọng tâm dồn về mạn trái container. Cần dịch chuyển kiện hàng nặng về trục giữa.";
    }
  } else if (Math.abs(longDev) > 8) {
    if (longDev > 0) {
      balanceStatus = "WARNING_AFT_HEAVY";
      statusTextVi = "Cảnh báo: Lệch về phía cửa sau";
      statusTextEn = "Warning: Aft Heavy (Rear Door)";
      safetyAdvice = "Hàng nặng dồn nhiều ở cửa sau, nguy cơ đổ vỡ khi mở cửa cont tại cảng đích.";
    } else {
      balanceStatus = "WARNING_BOW_HEAVY";
      statusTextVi = "Cảnh báo: Lệch về phía vách trước";
      statusTextEn = "Warning: Bow Heavy (Front Bulkhead)";
      safetyAdvice = "Hàng nặng dồn về vách đầu container. Cần dàn trải đều dọc chiều dài xe kéo container.";
    }
  }

  return {
    centerXM: Number(cogX.toFixed(2)),
    centerYM: Number(cogY.toFixed(2)),
    centerZM: Number(cogZ.toFixed(2)),
    longitudeDeviationPercent: Number(longDev.toFixed(1)),
    lateralDeviationPercent: Number(latDev.toFixed(1)),
    balanceStatus,
    statusTextVi,
    statusTextEn,
    safetyAdvice,
  };
}
