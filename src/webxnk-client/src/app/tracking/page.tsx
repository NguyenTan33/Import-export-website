"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Ship,
  Search,
  Compass,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from "lucide-react";
import { VesselTrackingTimeline, ShipmentData } from "@/components/tracking/VesselTrackingTimeline";
import { useLanguage } from "@/context/LanguageContext";

const SAMPLE_SHIPMENTS: Record<string, ShipmentData> = {
  "QTH-BL-2026-JP01": {
    blNumber: "QTH-BL-2026-JP01",
    bookingNumber: "BKG-ONE-889102",
    carrierName: "Ocean Network Express (ONE)",
    vesselName: "ONE APUS",
    voyageNumber: "088E",
    imoNumber: "9806079",
    callSign: "7KTI",
    portOfLoading: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfLoadingVi: "Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
    portOfLoadingEn: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfDischarge: "Tokyo Port (JP)",
    portOfDischargeVi: "Cảng Tokyo (Nhật Bản)",
    portOfDischargeEn: "Tokyo Port (Japan)",
    etd: "2026-09-24 14:00",
    eta: "2026-10-04 08:00",
    currentCoordinates: { lat: 21.85, lng: 124.62 },
    speedKnots: 18.4,
    routeProgressPercent: 65,
    containers: [
      {
        containerNumber: "ONEU-892145-0",
        sizeType: "40HC",
        sealNumber: "VN-CL-99218",
        cargoDescription: "Giày thể thao Sneaker xuất khẩu đế đúc cao cấp (1,200 đôi / 100 CTNS)",
        cargoDescriptionVi: "Giày thể thao Sneaker xuất khẩu đế đúc cao cấp (1,200 đôi / 100 thùng)",
        cargoDescriptionEn: "Premium Molded Sole Sneaker Shoes for Export (1,200 pairs / 100 cartons)",
        vgmWeightKg: 11200,
        tareWeightKg: 3900,
        status: "Đang trên biển (On Sea)",
        statusVi: "Đang trên biển",
        statusEn: "On Sea (Transiting)",
      },
      {
        containerNumber: "ONEU-892146-6",
        sizeType: "40HC",
        sealNumber: "VN-CL-99219",
        cargoDescription: "Than không khói BBQ ép mùn cưa xuất khẩu (5,000 kg / 500 CTNS)",
        cargoDescriptionVi: "Than không khói BBQ ép mùn cưa mùn mùn xuất khẩu (5,000 kg / 500 thùng)",
        cargoDescriptionEn: "Sawdust Briquette Smokeless BBQ Charcoal (5,000 kg / 500 cartons)",
        vgmWeightKg: 15400,
        tareWeightKg: 3900,
        status: "Đang trên biển (On Sea)",
        statusVi: "Đang trên biển",
        statusEn: "On Sea (Transiting)",
      },
    ],
    milestones: [
      {
        stage: "FACTORY_READY",
        titleVi: "Hoàn tất đóng thùng & Kiểm định tại Nhà máy",
        titleEn: "Factory Packaging & Quality Inspection",
        location: "Xưởng Quang Tấn Hoàng, KCN Sóng Thần, Bình Dương",
        timestamp: "2026-09-21 16:30",
        isCompleted: true,
        isCurrent: false,
        notesVi: "Kiểm tra độ ẩm đạt tiêu chuẩn xuất khẩu, đóng gói thùng carton 5 lớp chống sốc.",
        notesEn: "Moisture tested compliant with JIS export standards, packed in 5-ply shock-resistant cartons.",
      },
      {
        stage: "CUSTOMS_CLEARED",
        titleVi: "Thông quan Hải quan Cảng Cát Lái",
        titleEn: "Export Customs Clearance at Cat Lai Port",
        location: "Chi cục Hải quan Cửa khẩu Cảng Sài Gòn KV1 (Cát Lái)",
        timestamp: "2026-09-23 10:15",
        isCompleted: true,
        isCurrent: false,
        notesVi: "Tờ khai xuất khẩu điện tử luồng xanh số 300189234500 đã được phê duyệt.",
        notesEn: "Electronic green-lane export customs declaration No. 300189234500 formally approved.",
      },
      {
        stage: "VESSEL_DEPARTED",
        titleVi: "Bốc dỡ container lên tàu & Rời cảng bốc",
        titleEn: "Container Stowed Onboard & Vessel Departed",
        location: "Cầu cảng Cát Lái - Tàu ONE APUS (Voyage 088E)",
        timestamp: "2026-09-24 14:00",
        isCompleted: true,
        isCurrent: false,
        notesVi: "Toàn bộ 2 container 40HC đã được hạ neo an toàn vào khoang số 3.",
        notesEn: "Both 40HC containers lashed securely in Bay 03 under deck.",
      },
      {
        stage: "ON_SEA",
        titleVi: "Đang hải trình trên vùng biển quốc tế",
        titleEn: "Vessel Underway Transiting International Waters",
        location: "Vùng biển Hoa Đông (East China Sea) • 18.4 knots",
        timestamp: "2026-09-29 08:30",
        isCompleted: false,
        isCurrent: true,
        notesVi: "Điều kiện thời tiết thuận lợi, dự kiến đến eo biển Tokyo theo đúng kế hoạch.",
        notesEn: "Favorable sea state and weather conditions. ETA Tokyo Bay maintained on schedule.",
      },
      {
        stage: "PORT_ARRIVED",
        titleVi: "Cập Cảng Đích Tokyo Port",
        titleEn: "Arrival at Port of Discharge Tokyo",
        location: "Oi Container Terminal, Port of Tokyo, Japan",
        timestamp: "2026-10-04 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
      {
        stage: "DELIVERED",
        titleVi: "Thông quan nhập khẩu & Giao kho người mua",
        titleEn: "Import Clearance & Final Consignee Delivery",
        location: "Tokyo Overseas Trading Co., Koto City, Tokyo",
        timestamp: "2026-10-06 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
    ],
  },
  "QTH-BL-2026-US02": {
    blNumber: "QTH-BL-2026-US02",
    bookingNumber: "BKG-EMC-440129",
    carrierName: "Evergreen Marine Corporation (EMC)",
    vesselName: "EVER GIVEN",
    voyageNumber: "042N",
    imoNumber: "9811000",
    callSign: "H3RC",
    portOfLoading: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfLoadingVi: "Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
    portOfLoadingEn: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfDischarge: "Port of Los Angeles (US)",
    portOfDischargeVi: "Cảng Los Angeles (Hoa Kỳ)",
    portOfDischargeEn: "Port of Los Angeles (USA)",
    etd: "2026-10-02 20:00",
    eta: "2026-10-22 06:00",
    currentCoordinates: { lat: 10.76, lng: 106.79 },
    speedKnots: 0,
    routeProgressPercent: 25,
    containers: [
      {
        containerNumber: "EITU-102938-4",
        sizeType: "40HC",
        sealNumber: "US-CBP-44129",
        cargoDescription: "Hạt điều nhân trắng xuất khẩu Grade W320 đóng túi hút chân không 25lbs",
        cargoDescriptionVi: "Hạt điều nhân trắng xuất khẩu Grade W320 đóng túi hút chân không 25lbs",
        cargoDescriptionEn: "Cashew Kernel W320 Grade Vacuum Packed in 25lbs Export Cartons",
        vgmWeightKg: 24200,
        tareWeightKg: 3950,
        status: "Đã vào bãi chờ xếp tàu (CY Gate-in)",
        statusVi: "Đã vào bãi chờ xếp tàu",
        statusEn: "CY Gate-in (Awaiting Loading)",
      },
    ],
    milestones: [
      {
        stage: "FACTORY_READY",
        titleVi: "Đóng gói & Chứng nhận FDA / HACCP",
        titleEn: "Factory Packaging & FDA / HACCP Certification",
        location: "Nhà máy Chế biến Nông sản Bình Phước",
        timestamp: "2026-09-27 11:00",
        isCompleted: true,
        isCurrent: false,
      },
      {
        stage: "CUSTOMS_CLEARED",
        titleVi: "Thông quan Hải quan & Hạ bãi cảng Cát Lái",
        titleEn: "Customs Cleared & Gate-in at Cat Lai Terminal",
        location: "Bãi container Cảng Cát Lái (Khu vực C1)",
        timestamp: "2026-09-29 15:45",
        isCompleted: false,
        isCurrent: true,
        notesVi: "Đã nộp chứng chỉ kiểm dịch thực vật (Phytosanitary Certificate) và CO Form B.",
        notesEn: "Phytosanitary Certificate and Certificate of Origin Form B submitted to US Customs broker.",
      },
      {
        stage: "VESSEL_DEPARTED",
        titleVi: "Bốc xếp lên tàu EVER GIVEN",
        titleEn: "Vessel Loading & Departure",
        location: "Cát Lái, TP.HCM",
        timestamp: "2026-10-02 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
      {
        stage: "ON_SEA",
        titleVi: "Hành trình vượt Thái Bình Dương",
        titleEn: "Trans-Pacific Ocean Voyage",
        location: "Thái Bình Dương (Pacific Ocean)",
        timestamp: "2026-10-03 -> 2026-10-21",
        isCompleted: false,
        isCurrent: false,
      },
      {
        stage: "PORT_ARRIVED",
        titleVi: "Cập Cảng Los Angeles",
        titleEn: "Arrival at Port of Los Angeles",
        location: "Pier 400, Los Angeles, CA, USA",
        timestamp: "2026-10-22 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
      {
        stage: "DELIVERED",
        titleVi: "Giao nhận hàng tại kho bờ Tây Hoa Kỳ",
        titleEn: "Inland Delivery to Consignee Facility",
        location: "Global Trading Logistics LLC, California",
        timestamp: "2026-10-24 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
    ],
  },
  "QTH-BL-2026-EU03": {
    blNumber: "QTH-BL-2026-EU03",
    bookingNumber: "BKG-MSK-990182",
    carrierName: "Maersk Line (MSK)",
    vesselName: "MAERSK MC-KINNEY MOLLER",
    voyageNumber: "2401",
    imoNumber: "9619907",
    callSign: "OUJD2",
    portOfLoading: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfLoadingVi: "Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
    portOfLoadingEn: "Cat Lai Port, Ho Chi Minh City (VN)",
    portOfDischarge: "Port of Rotterdam (NL)",
    portOfDischargeVi: "Cảng Rotterdam (Hà Lan)",
    portOfDischargeEn: "Port of Rotterdam (Netherlands)",
    etd: "2026-09-02 06:00",
    eta: "2026-10-01 10:00",
    currentCoordinates: { lat: 51.98, lng: 4.12 },
    speedKnots: 11.2,
    routeProgressPercent: 95,
    containers: [
      {
        containerNumber: "MSKU-781920-3",
        sizeType: "40GP",
        sealNumber: "NL-MSK-11029",
        cargoDescription: "Màng PE quấn pallet và Băng keo dán thùng xuất khẩu Châu Âu",
        cargoDescriptionVi: "Màng PE quấn pallet và Băng keo dán thùng xuất khẩu Châu Âu",
        cargoDescriptionEn: "Industrial Stretch Film & Packaging Tapes REACH Compliant",
        vgmWeightKg: 19800,
        tareWeightKg: 3750,
        status: "Đang làm thủ tục cập cầu cảng (Berthing)",
        statusVi: "Đang làm thủ tục cập cầu cảng",
        statusEn: "Berthing in progress at terminal",
      },
    ],
    milestones: [
      {
        stage: "FACTORY_READY",
        titleVi: "Đóng kiện tiêu chuẩn REACH / CE",
        titleEn: "Factory Packaging REACH Compliant",
        location: "Nhà máy Bao Bì Xuất Khẩu Quang Tấn Hoàng",
        timestamp: "2026-08-30 09:00",
        isCompleted: true,
        isCurrent: false,
      },
      {
        stage: "CUSTOMS_CLEARED",
        titleVi: "Thông quan & Cấp chứng nhận EUR.1",
        titleEn: "Customs Clearance & EUR.1 Certificate",
        location: "Chi cục Hải quan Cát Lái",
        timestamp: "2026-09-01 14:20",
        isCompleted: true,
        isCurrent: false,
      },
      {
        stage: "VESSEL_DEPARTED",
        titleVi: "Rời Cảng Cát Lái - Tàu MAERSK MC-KINNEY",
        titleEn: "Vessel Departed Cat Lai Port",
        location: "Cát Lái, TP.HCM",
        timestamp: "2026-09-02 06:00",
        isCompleted: true,
        isCurrent: false,
      },
      {
        stage: "ON_SEA",
        titleVi: "Hành trình qua Kênh đào Suez đến Bắc Hải",
        titleEn: "Transit via Suez Canal to North Sea",
        location: "Biển Bắc (North Sea)",
        timestamp: "2026-09-28 12:00",
        isCompleted: true,
        isCurrent: false,
      },
      {
        stage: "PORT_ARRIVED",
        titleVi: "Tiến vào luồng Cảng Rotterdam",
        titleEn: "Approach Maasvlakte Rotterdam Terminal",
        location: "APM Terminals Maasvlakte II, Rotterdam",
        timestamp: "2026-09-30 22:00",
        isCompleted: false,
        isCurrent: true,
        notesVi: "Hoa tiêu cảng đã lên tàu, hoa tiêu lai dắt đang hỗ trợ cập bến.",
        notesEn: "Port pilot onboard, tugs assisting final approach into Maasvlakte quay.",
      },
      {
        stage: "DELIVERED",
        titleVi: "Giao nhận nội địa Châu Âu",
        titleEn: "Inland Delivery Across EU Hubs",
        location: "Rotterdam Central Logistics Park",
        timestamp: "2026-10-02 (ETA)",
        isCompleted: false,
        isCurrent: false,
      },
    ],
  },
};

function TrackingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get("q");
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  const initialShipment =
    (queryParam && SAMPLE_SHIPMENTS[queryParam]) ||
    SAMPLE_SHIPMENTS["QTH-BL-2026-JP01"];

  const [searchCode, setSearchCode] = useState(queryParam || "QTH-BL-2026-JP01");
  const [activeShipment, setActiveShipment] = useState<ShipmentData | null>(initialShipment);
  const [notFound, setNotFound] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase();
    if (!query) return;

    let found = SAMPLE_SHIPMENTS[query];
    if (!found) {
      const key = Object.keys(SAMPLE_SHIPMENTS).find(
        (k) =>
          k.includes(query) ||
          SAMPLE_SHIPMENTS[k].bookingNumber.toUpperCase().includes(query) ||
          SAMPLE_SHIPMENTS[k].containers.some((c) => c.containerNumber.toUpperCase().includes(query))
      );
      if (key) {
        found = SAMPLE_SHIPMENTS[key];
      }
    }

    if (found) {
      setActiveShipment(found);
      setNotFound(false);
      router.push(`/tracking?q=${found.blNumber}`);
    } else {
      setNotFound(true);
    }
  };

  const selectSample = (code: string) => {
    setSearchCode(code);
    setActiveShipment(SAMPLE_SHIPMENTS[code]);
    setNotFound(false);
    router.push(`/tracking?q=${code}`);
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20 pt-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="border-b border-black pb-5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
              {t("tracking.subtitle")}
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-neutral-900 mt-1 flex items-center gap-3">
            <Ship className="w-8 h-8 text-[#0E4B94]" />
            {t("tracking.title")}
          </h1>
          <p className="mt-1 text-xs text-neutral-600 font-mono">
            {t("tracking.desc")}
          </p>
        </div>

        {/* Search Bar & Quick Sample Selector */}
        <div className="border border-neutral-300 bg-white p-6 shadow-sm space-y-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-neutral-400" />
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder={t("tracking.searchPlaceholder")}
                className="w-full border border-neutral-300 pl-11 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:border-black uppercase"
              />
            </div>
            <button
              type="submit"
              className="flex items-center justify-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] text-white px-6 py-2.5 text-xs font-bold uppercase font-mono transition-colors shadow-sm"
            >
              <Compass className="w-4 h-4" />
              <span>{t("tracking.searchBtn")}</span>
            </button>
          </form>

          {/* Quick Click Demo Pills */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs font-mono">
            <span className="text-neutral-500 text-[11px] font-bold uppercase">
              {t("tracking.sampleShipments")}
            </span>
            <button
              type="button"
              onClick={() => selectSample("QTH-BL-2026-JP01")}
              className={`px-3 py-1 rounded border text-[11px] font-bold transition-colors ${
                activeShipment?.blNumber === "QTH-BL-2026-JP01"
                  ? "bg-[#0E4B94] text-white border-[#0E4B94]"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"
              }`}
            >
              🇯🇵 Tokyo Port (ONE APUS - {isVi ? "65% trên biển" : "65% In Transit"})
            </button>
            <button
              type="button"
              onClick={() => selectSample("QTH-BL-2026-US02")}
              className={`px-3 py-1 rounded border text-[11px] font-bold transition-colors ${
                activeShipment?.blNumber === "QTH-BL-2026-US02"
                  ? "bg-[#0E4B94] text-white border-[#0E4B94]"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"
              }`}
            >
              🇺🇸 Los Angeles (EVER GIVEN - {isVi ? "Chờ bốc tàu" : "CY Gate-in"})
            </button>
            <button
              type="button"
              onClick={() => selectSample("QTH-BL-2026-EU03")}
              className={`px-3 py-1 rounded border text-[11px] font-bold transition-colors ${
                activeShipment?.blNumber === "QTH-BL-2026-EU03"
                  ? "bg-[#0E4B94] text-white border-[#0E4B94]"
                  : "bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border-neutral-300"
              }`}
            >
              🇪🇺 Rotterdam (MAERSK - {isVi ? "95% Cập cảng" : "95% Approaching Port"})
            </button>
          </div>
        </div>

        {/* Not Found Alert */}
        {notFound && (
          <div className="border border-red-300 bg-red-50 p-4 rounded text-xs font-mono text-red-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
            <div>
              {t("tracking.notFound")}
            </div>
          </div>
        )}

        {/* Main Timeline Card */}
        {activeShipment && <VesselTrackingTimeline shipment={activeShipment} />}

        {/* Support & Documents Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-neutral-300 bg-white p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-[#0E4B94] font-bold text-xs uppercase font-mono">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              {t("tracking.insuranceTitle")}
            </div>
            <p className="text-xs text-neutral-600 font-mono leading-relaxed">
              {t("tracking.insuranceDesc")}
            </p>
          </div>

          <div className="border border-neutral-300 bg-neutral-100 p-5 shadow-sm flex items-center justify-between">
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-neutral-900">
                {t("tracking.needHelp")}
              </h4>
              <p className="text-xs text-neutral-500 font-mono mt-1">
                {t("tracking.needHelpSub")}
              </p>
            </div>
            <Link
              href="/portal"
              className="inline-flex items-center gap-1.5 bg-black hover:bg-neutral-800 text-white text-xs font-bold font-mono uppercase px-4 py-2.5 transition-colors shrink-0"
            >
              <span>{t("tracking.goToPortal")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TrackingPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-24 text-center font-mono text-sm text-neutral-600">
          Loading shipment telemetry data...
        </div>
      }
    >
      <TrackingContent />
    </Suspense>
  );
}