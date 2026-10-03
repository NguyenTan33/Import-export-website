"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types";
import { TierPriceTable } from "@/components/store/TierPriceTable";
import { catalogApi } from "@/services/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  Box,
  Layers,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Truck,
  FileCheck,
  Share2,
  ChevronRight,
} from "lucide-react";

// Mock 6 core products for fallback with both VI and EN
const FALLBACK_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    baseSku: "SHOES-SNK-V1",
    hsCode: "6404.11.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 25.0,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Chất liệu thân (Upper)": "Vải Canvas dệt mật độ cao chống bám bẩn",
        "Đế ngoài (Outsole)": "Cao su tự nhiên lưu hóa chống trơn trượt đạt chuẩn ASTM",
        "Tiêu chuẩn xuất khẩu": "CE, REACH (Châu Âu), CPSIA (Hoa Kỳ)",
        "Quy cách đóng gói": "1 đôi/hộp quà tặng, 12 hộp/thùng carton 5 lớp",
        "Kích cỡ (Sizes)": "EU 38 - 44 / US 6 - 11",
        "Màu sắc": "Trắng / Đen xuất khẩu",
      },
      en: {
        "Upper Material": "High-density stain-resistant Canvas fabric",
        "Outsole": "Vulcanized natural rubber ASTM anti-slip compliant",
        "Export Standards": "CE, REACH (Europe), CPSIA (USA)",
        "Packaging Specification": "1 pair/inner box, 12 boxes/5-ply master carton",
        "Sizes": "EU 38 - 44 / US 6 - 11",
        "Colors": "Export White / Black",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Giày thể thao Sneaker xuất khẩu đế đúc cao cấp",
        shortDescription: "Giày vải canvas đế cao su lưu hóa tiêu chuẩn xuất khẩu EU/Mỹ, đóng gói 12 đôi/thùng.",
      },
      {
        languageCode: "en",
        name: "Premium Vulcanized Canvas Sneakers",
        shortDescription: "Export-grade vulcanized rubber canvas sneakers meeting EU/US standards. 12 pairs per carton.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 60,
      cartonWidthCm: 40,
      cartonHeightCm: 35,
      netWeightKg: 9.6,
      grossWeightKg: 11.2,
      pcsPerCarton: 12,
    },
    priceTiers: [
      { minQuantity: 120, maxQuantity: 499, unitPriceUsd: 22.0, discountPercentage: 12 },
      { minQuantity: 500, maxQuantity: 1999, unitPriceUsd: 19.5, discountPercentage: 22 },
      { minQuantity: 2000, maxQuantity: null, unitPriceUsd: 17.0, discountPercentage: 32 },
    ],
  },
  {
    id: 2,
    categoryId: 2,
    baseSku: "CHAR-COCO-BBQ",
    hsCode: "4402.90.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 1.2,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Hàm lượng Carbon cố định": "75% - 80%",
        "Nhiệt lượng": "7200 - 7500 kcal/kg",
        "Độ ẩm (Moisture)": "< 5%",
        "Độ tro (Ash content)": "< 3%",
        "Thời gian cháy liên tục": "3.5 - 4.5 giờ không mùi, không tia lửa",
      },
      en: {
        "Fixed Carbon Content": "75% - 80%",
        "Calorific Value": "7200 - 7500 kcal/kg",
        "Moisture Content": "< 5%",
        "Ash Content": "< 3%",
        "Burn Time": "3.5 - 4.5 hours smokeless, odorless, spark-free",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Than gáo dừa nén lục giác không khói BBQ xuất khẩu",
        shortDescription: "Than sinh thái không mùi, không tia lửa, thời gian cháy 4 giờ, xuất khẩu Trung Đông & Nhật.",
      },
      {
        languageCode: "en",
        name: "Hexagonal Coconut Shell Smokeless BBQ Charcoal",
        shortDescription: "Eco-friendly, odorless briquettes with 4 hours burn time, exported to Middle East & Japan.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 40,
      cartonWidthCm: 30,
      cartonHeightCm: 25,
      netWeightKg: 10.0,
      grossWeightKg: 10.6,
      pcsPerCarton: 10,
    },
    priceTiers: [
      { minQuantity: 500, maxQuantity: 1999, unitPriceUsd: 0.95, discountPercentage: 20 },
      { minQuantity: 2000, maxQuantity: null, unitPriceUsd: 0.85, discountPercentage: 29 },
    ],
  },
  {
    id: 3,
    categoryId: 3,
    baseSku: "BROOM-EUC-120",
    hsCode: "4417.00.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.65,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Chủng loại gỗ": "Bạch đàn rừng trồng tự nhiên (Eucalyptus)",
        "Chiều dài tiêu chuẩn": "120 cm (± 0.5 cm)",
        "Đường kính thân": "2.2 cm",
        "Xử lý bề mặt": "Sấy hơi nước chống mốc, bọc màng PVC hoa văn",
        "Phụ kiện đầu chổi": "Ren xoáy chuẩn Italy + Nắp móc treo nhựa",
      },
      en: {
        "Wood Species": "Plantation Eucalyptus Hardwood",
        "Standard Length": "120 cm (± 0.5 cm)",
        "Diameter": "2.2 cm",
        "Surface Treatment": "Kiln-dried anti-mildew, PVC film wrapped",
        "Cap & Thread": "Standard Italian screw thread + hanging plastic cap",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Cán chổi gỗ bạch đàn 120cm bọc màng PVC xuất khẩu",
        shortDescription: "Tiện tròn mịn, sấy chống mốc mối mọt, bọc màng PVC vân gỗ kèm móc treo nhựa.",
      },
      {
        languageCode: "en",
        name: "Eucalyptus Wooden Broom Handle 120cm PVC Coated",
        shortDescription: "Kiln-dried anti-mildew hardwood handle with woodgrain shrink PVC sleeve and hanging cap.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 122,
      cartonWidthCm: 25,
      cartonHeightCm: 25,
      netWeightKg: 22.0,
      grossWeightKg: 23.5,
      pcsPerCarton: 50,
    },
    priceTiers: [
      { minQuantity: 1000, maxQuantity: 4999, unitPriceUsd: 0.5, discountPercentage: 23 },
      { minQuantity: 5000, maxQuantity: null, unitPriceUsd: 0.42, discountPercentage: 35 },
    ],
  },
  {
    id: 4,
    categoryId: 4,
    baseSku: "AGRI-CASHEW-W320",
    hsCode: "0801.32.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 8.5,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Cấp chất lượng": "White Whole 320 hạt/pound (Grade W320)",
        "Vùng nguyên liệu": "Bình Phước, Việt Nam",
        "Độ ẩm (Moisture)": "< 5.0%",
        "Tiêu chuẩn an toàn": "FDA, HACCP, ISO 22000",
        "Quy cách bao gói": "Túi chân không PE/Alu 25 lbs (11.34 kg)",
      },
      en: {
        "Quality Grade": "White Whole 320 count/pound (Grade W320)",
        "Origin Region": "Binh Phuoc, Vietnam",
        "Moisture Content": "< 5.0%",
        "Food Safety Standards": "FDA Registered, HACCP, ISO 22000",
        "Packaging": "Vacuum packed PE/Alu pouch 25 lbs (11.34 kg)",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Hạt điều nhân trắng xuất khẩu Grade W320",
        shortDescription: "Hạt điều Bình Phước chất lượng cao đóng túi hút chân không 25lbs/thùng xuất khẩu.",
      },
      {
        languageCode: "en",
        name: "Export Grade W320 White Whole Cashew Kernels",
        shortDescription: "Premium Binh Duong whole cashew kernels vacuum packed in 25lbs master cartons.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 48,
      cartonWidthCm: 35,
      cartonHeightCm: 28,
      netWeightKg: 22.68,
      grossWeightKg: 24.2,
      pcsPerCarton: 2,
    },
    priceTiers: [
      { minQuantity: 100, maxQuantity: 499, unitPriceUsd: 7.8, discountPercentage: 8 },
      { minQuantity: 500, maxQuantity: null, unitPriceUsd: 7.2, discountPercentage: 15 },
    ],
  },
  {
    id: 5,
    categoryId: 5,
    baseSku: "TAPE-OPP-48X100",
    hsCode: "3919.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.85,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Bề rộng băng keo": "48 mm (2 inches)",
        "Chiều dài cuộn": "100 yards (~91.4 mét)",
        "Độ dày màng + keo": "50 micron",
        "Hệ keo dính": "Water-based Acrylic độ bám dính cực mạnh",
        "Quy cách đóng thùng": "6 cuộn/cây, 12 cây/thùng (72 cuộn/thùng)",
      },
      en: {
        "Tape Width": "48 mm (2 inches)",
        "Roll Length": "100 yards (~91.4 meters)",
        "Total Thickness": "50 microns",
        "Adhesive System": "Heavy-duty Water-based Acrylic adhesive",
        "Export Packing": "6 rolls/sleeve, 12 sleeves/carton (72 rolls)",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Băng keo trong OPP dán thùng 48mm x 100 yards",
        shortDescription: "Băng dính đóng gói công nghiệp độ dính cao 50 mic, quy cách 72 cuộn/thùng.",
      },
      {
        languageCode: "en",
        name: "Industrial OPP Packaging Tape 48mm x 100 yards",
        shortDescription: "High-tack 50-micron industrial carton sealing tape packed 72 rolls per export carton.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 33,
      cartonWidthCm: 33,
      cartonHeightCm: 30,
      netWeightKg: 13.5,
      grossWeightKg: 14.5,
      pcsPerCarton: 72,
    },
    priceTiers: [
      { minQuantity: 360, maxQuantity: 1439, unitPriceUsd: 0.65, discountPercentage: 23 },
      { minQuantity: 1440, maxQuantity: null, unitPriceUsd: 0.55, discountPercentage: 35 },
    ],
  },
  {
    id: 6,
    categoryId: 6,
    baseSku: "PE-FILM-50-17",
    hsCode: "3920.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 3.2,
    isActive: true,
    specificationsJson: JSON.stringify({
      vi: {
        "Khổ rộng màng": "500 mm (50 cm)",
        "Độ dày màng": "17 micron",
        "Trọng lượng cuộn": "2.8 kg (Màng 2.5kg + Lõi 0.3kg)",
        "Độ giãn dài": "300% - 350%",
        "Khả năng chịu kéo đứt": "Chống đâm thủng góc cạnh pallet hàng hóa",
      },
      en: {
        "Film Width": "500 mm (50 cm)",
        "Film Thickness": "17 microns",
        "Roll Gross Weight": "2.8 kg (Film 2.5kg + Core 0.3kg)",
        "Elongation Rate": "300% - 350%",
        "Puncture Resistance": "Heavy-duty anti-puncture for palletized containers",
      },
    }),
    translations: [
      {
        languageCode: "vi",
        name: "Màng PE quấn pallet tay 50cm độ dày 17 mic (Cuộn 2.8kg)",
        shortDescription: "Màng chít bọc hàng độ dai cao, chống bụi bẩn chống ẩm bảo vệ kiện hàng xuất khẩu.",
      },
      {
        languageCode: "en",
        name: "Manual Pallet Stretch Film 50cm 17 Mic (2.8kg Roll)",
        shortDescription: "High-tensile stretch film providing moisture, dust, and puncture protection for container cargo.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 35,
      cartonWidthCm: 25,
      cartonHeightCm: 52,
      netWeightKg: 15.0,
      grossWeightKg: 16.8,
      pcsPerCarton: 6,
    },
    priceTiers: [
      { minQuantity: 120, maxQuantity: 479, unitPriceUsd: 2.6, discountPercentage: 18 },
      { minQuantity: 480, maxQuantity: null, unitPriceUsd: 2.25, discountPercentage: 30 },
    ],
  },
];

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id || 1);

  const fallbackProduct = FALLBACK_PRODUCTS.find((p) => p.id === productId) || FALLBACK_PRODUCTS[0];
  const [product, setProduct] = useState<Product>(fallbackProduct);
  const [viewMode, setViewMode] = useState<"B2C" | "B2B">("B2C");
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState(false);

  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  useEffect(() => {
    const currentFallback = FALLBACK_PRODUCTS.find((p) => p.id === productId) || FALLBACK_PRODUCTS[0];
    setProduct(currentFallback);

    catalogApi
      .getProductById(productId)
      .then((res) => {
        if (res) setProduct(res);
      })
      .catch(() => {});
  }, [productId]);

  const currentTrans =
    product.translations.find((tr) => tr.languageCode === language) ||
    product.translations.find((tr) => tr.languageCode === "vi") ||
    product.translations[0];

  const name = currentTrans?.name || product.baseSku;
  const desc = currentTrans?.shortDescription || "";

  let specsObj: Record<string, string> = {};
  try {
    if (product.specificationsJson) {
      const parsed = JSON.parse(product.specificationsJson);
      if (parsed[language]) {
        specsObj = parsed[language];
      } else if (parsed.vi) {
        specsObj = parsed.vi;
      } else {
        specsObj = parsed;
      }
    }
  } catch {
    specsObj = {};
  }

  const currentTier = product.priceTiers?.find(
    (t) => quantity >= t.minQuantity && (!t.maxQuantity || quantity <= t.maxQuantity)
  );

  const effectiveUnitPrice =
    viewMode === "B2B" && currentTier
      ? currentTier.unitPriceUsd
      : product.defaultRetailPriceUsd;

  const totalPrice = effectiveUnitPrice * quantity;

  const pcsPerCarton = product.exportPackaging?.pcsPerCarton || 1;
  const totalCartons = Math.ceil(quantity / pcsPerCarton);
  const singleCartonCbm = product.exportPackaging
    ? (product.exportPackaging.cartonLengthCm *
        product.exportPackaging.cartonWidthCm *
        product.exportPackaging.cartonHeightCm) /
      1000000
    : 0.05;
  const totalCbm = totalCartons * singleCartonCbm;
  const totalGrossWeight = totalCartons * (product.exportPackaging?.grossWeightKg || 10);

  const handleAddToCart = () => {
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const handleBuyNow = () => {
    router.push(`/checkout?productId=${product.id}&quantity=${quantity}`);
  };

  const handleCreateRfq = () => {
    router.push(`/portal?productId=${product.id}&quantity=${quantity}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs font-mono text-neutral-500">
        <Link href="/" className="hover:text-black">
          {t("pdp.home")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/" className="hover:text-black">
          {t("pdp.exportProducts")}
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-black font-semibold truncate max-w-xs">{name}</span>
      </nav>

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Col: Visual Preview & Badges */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border border-neutral-300 bg-white p-8 relative flex flex-col items-center justify-center min-h-[380px] shadow-sm rounded">
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-black text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded">
                HS {product.hsCode}
              </span>
              <span className="bg-[#0E4B94] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded">
                {t("home.origin")} {product.countryOfOrigin}
              </span>
            </div>

            <div className="absolute top-4 right-4">
              <button
                onClick={() => alert(isVi ? "Đã sao chép liên kết sản phẩm!" : "Product link copied to clipboard!")}
                className="p-1.5 text-neutral-400 hover:text-black border border-neutral-200 rounded"
                title={isVi ? "Chia sẻ" : "Share"}
              >
                <Share2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center my-auto py-10">
              <div className="w-40 h-40 mx-auto rounded-full bg-neutral-100 border-2 border-neutral-200 flex items-center justify-center text-neutral-400 font-mono text-xs shadow-inner">
                <Box className="w-16 h-16 text-[#0E4B94]" />
              </div>
              <p className="mt-4 font-mono text-xs text-neutral-500">
                SKU: <strong className="text-black">{product.baseSku}</strong>
              </p>
            </div>

            <div className="w-full border-t border-neutral-200 pt-3 grid grid-cols-3 gap-2 text-center text-[10px] font-mono text-neutral-600">
              <div className="border-r border-neutral-200">ISO 9001:2015</div>
              <div className="border-r border-neutral-200">CE & FDA Pass</div>
              <div>{isVi ? "Cảng Cát Lái" : "Cat Lai Port"}</div>
            </div>
          </div>

          <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-xs rounded">
            <div className="flex items-center gap-2 text-neutral-800">
              <ShieldCheck className="w-4 h-4 text-[#0E4B94] shrink-0" />
              <span>
                {isVi
                  ? "Tiêu chuẩn xuất khẩu chất lượng cao kiểm định độc lập SGS / Intertek"
                  : "Certified export grade compliant with SGS / Intertek laboratory testing"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-800">
              <Truck className="w-4 h-4 text-[#0E4B94] shrink-0" />
              <span>
                {isVi
                  ? "Sẵn sàng đóng container 20ft / 40ft tại Kho Tổng VSIP 1 Bình Dương"
                  : "Stowage-ready for 20ft / 40ft containers at VSIP 1 Central Export Hub"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-neutral-800">
              <FileCheck className="w-4 h-4 text-[#0E4B94] shrink-0" />
              <span>
                {isVi
                  ? "Hỗ trợ cấp chứng nhận xuất xứ C/O Form D, Form E, Form B, EUR.1"
                  : "Certificate of Origin support: Form D, Form E, Form B, EUR.1"}
              </span>
            </div>
          </div>
        </div>

        {/* Right Col: Details, Dual Mode Switch & Pricing */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 leading-tight">
              {name}
            </h1>
            <p className="mt-2 text-sm text-neutral-600 leading-relaxed">{desc}</p>
          </div>

          {/* DUAL-MODE TOGGLE SWITCH */}
          <div className="border-2 border-neutral-900 p-1.5 bg-neutral-100 flex rounded">
            <button
              onClick={() => {
                setViewMode("B2C");
                if (quantity > 100) setQuantity(1);
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded ${
                viewMode === "B2C"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              {t("pdp.viewModeB2c")}
            </button>
            <button
              onClick={() => {
                setViewMode("B2B");
                if (quantity < 120) setQuantity(product.priceTiers[0]?.minQuantity || 120);
              }}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider transition-all rounded ${
                viewMode === "B2B"
                  ? "bg-[#0E4B94] text-white shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              {t("pdp.viewModeB2b")}
            </button>
          </div>

          {/* Price Banner */}
          <div className="border border-neutral-300 p-4 bg-white flex flex-col sm:flex-row justify-between sm:items-center gap-3 rounded">
            <div>
              <span className="text-[11px] font-mono text-neutral-500 uppercase">
                {viewMode === "B2C" ? t("pdp.retailPriceLabel") : t("pdp.wholesalePriceLabel")}
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="text-3xl font-black font-mono text-[#0E4B94]">
                  {formatPrice(effectiveUnitPrice)}
                </span>
                <span className="text-xs font-mono text-neutral-500">
                  {isVi ? "/ sản phẩm" : "/ unit"}
                </span>
                {viewMode === "B2B" && currentTier && (
                  <span className="text-xs font-bold font-mono text-[#C9252C] bg-[#C9252C]/10 px-2 py-0.5 rounded">
                    {isVi ? `Giảm ${currentTier.discountPercentage}%` : `-${currentTier.discountPercentage}% OFF`}
                  </span>
                )}
              </div>
            </div>

            <div className="text-left sm:text-right font-mono border-t sm:border-t-0 pt-2 sm:pt-0">
              <span className="text-[11px] text-neutral-500 uppercase">{t("pdp.orderSubtotal")}</span>
              <p className="text-xl font-black text-black">
                {formatPrice(totalPrice)}
              </p>
            </div>
          </div>

          {/* B2B Tier Pricing Table */}
          {viewMode === "B2B" && (
            <TierPriceTable
              tiers={product.priceTiers}
              retailPrice={product.defaultRetailPriceUsd}
              selectedQuantity={quantity}
              onSelectQuantity={(qty) => setQuantity(qty)}
            />
          )}

          {/* Quantity Selector & Action Controls */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-wrap items-center gap-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-neutral-700 mb-1">
                  {t("pdp.quantity")} ({viewMode === "B2B" ? (isVi ? "MOQ sỉ" : "MOQ wholesale") : (isVi ? "Cái/đôi" : "Units")}):
                </label>
                <div className="flex items-center border border-neutral-400 bg-white rounded">
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity(Math.max(viewMode === "B2B" ? (product.priceTiers[0]?.minQuantity || 10) : 1, quantity - (viewMode === "B2B" ? 50 : 1)))
                    }
                    className="px-3 py-2 text-sm font-bold hover:bg-neutral-100"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={viewMode === "B2B" ? (product.priceTiers[0]?.minQuantity || 1) : 1}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-24 text-center font-mono font-bold text-sm py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + (viewMode === "B2B" ? 50 : 1))}
                    className="px-3 py-2 text-sm font-bold hover:bg-neutral-100"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="bg-neutral-100 border border-neutral-300 p-2.5 rounded text-xs font-mono flex items-center gap-3">
                <div>
                  <span className="text-neutral-500 block text-[10px] uppercase">
                    {t("pdp.cartonCount")}
                  </span>
                  <strong>{totalCartons} {isVi ? "kiện thùng" : "cartons"}</strong>
                </div>
                <div className="border-l border-neutral-300 pl-3">
                  <span className="text-neutral-500 block text-[10px] uppercase">
                    {t("pdp.totalCbm")}
                  </span>
                  <strong className="text-[#0E4B94]">{totalCbm.toFixed(2)} m³</strong>
                </div>
                <div className="border-l border-neutral-300 pl-3">
                  <span className="text-neutral-500 block text-[10px] uppercase">
                    {t("pdp.totalGw")}
                  </span>
                  <strong>{totalGrossWeight.toFixed(1)} kg</strong>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {viewMode === "B2C" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex items-center justify-center gap-2 border-2 border-black bg-white py-3 text-xs font-bold uppercase text-black hover:bg-neutral-100 transition-colors rounded"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{t("pdp.addToCart")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleBuyNow}
                  className="flex items-center justify-center gap-2 bg-[#0E4B94] py-3 text-xs font-bold uppercase text-white hover:bg-[#0a376d] transition-colors shadow-sm rounded"
                >
                  <span>{isVi ? "Thanh toán ngay (Stripe)" : "Checkout with Stripe"}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCreateRfq}
                  className="w-full flex items-center justify-center gap-2 bg-[#0E4B94] py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0a376d] transition-colors shadow-md rounded"
                >
                  <span>
                    {isVi
                      ? `Đưa lô hàng (${quantity} sp / ${totalCbm.toFixed(2)} CBM) vào Form RFQ`
                      : `Add Cargo (${quantity} units / ${totalCbm.toFixed(2)} CBM) to RFQ Quote`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {addedToast && (
              <div className="p-3 border border-green-600 bg-green-50 text-green-800 text-xs font-mono flex items-center gap-2 rounded">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span>
                  {isVi
                    ? `Đã thêm ${quantity} sản phẩm vào giỏ hàng thành công!`
                    : `Successfully added ${quantity} units to shopping cart!`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs: Specifications & Export Packaging Matrix */}
      <div className="border border-neutral-300 bg-white p-6 space-y-6 mt-12 shadow-sm rounded">
        <div className="border-b border-neutral-300 pb-3">
          <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#0E4B94]" />
            {isVi
              ? "Thông số kỹ thuật & Quy cách đóng thùng xuất khẩu"
              : "Technical Specifications & Export Packaging Matrix"}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 mb-3">
              {isVi ? "1. Thông số kỹ thuật sản phẩm" : "1. Technical Specifications"}
            </h3>
            <table className="w-full text-xs font-mono border border-neutral-200">
              <tbody className="divide-y divide-neutral-200">
                {Object.entries(specsObj).map(([key, val], idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? "bg-neutral-50" : "bg-white"}>
                    <td className="p-2.5 font-bold text-neutral-700 w-1/2">{key}</td>
                    <td className="p-2.5 text-black">{val}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-neutral-500 mb-3">
              {isVi ? "2. Quy cách đóng kiện Container" : "2. Container Packaging Specifications"}
            </h3>
            {product.exportPackaging ? (
              <table className="w-full text-xs font-mono border border-neutral-200">
                <tbody className="divide-y divide-neutral-200">
                  <tr className="bg-neutral-50">
                    <td className="p-2.5 font-bold text-neutral-700 w-1/2">
                      {isVi ? "Kích thước thùng carton" : "Master Carton Dimensions"}
                    </td>
                    <td className="p-2.5 text-black">
                      {product.exportPackaging.cartonLengthCm} x {product.exportPackaging.cartonWidthCm} x {product.exportPackaging.cartonHeightCm} cm
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-700">
                      {isVi ? "Thể tích 1 thùng (CBM)" : "Single Carton Volume (CBM)"}
                    </td>
                    <td className="p-2.5 font-black text-[#0E4B94]">{singleCartonCbm.toFixed(4)} m³</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="p-2.5 font-bold text-neutral-700">
                      {isVi ? "Quy cách số lượng" : "Packing Capacity"}
                    </td>
                    <td className="p-2.5 text-black">
                      {product.exportPackaging.pcsPerCarton} {isVi ? "sản phẩm / thùng" : "units / carton"}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-700">
                      {isVi ? "Trọng lượng tịnh (Net Weight)" : "Net Weight (NW)"}
                    </td>
                    <td className="p-2.5 text-black">{product.exportPackaging.netWeightKg} kg / {isVi ? "thùng" : "ctn"}</td>
                  </tr>
                  <tr className="bg-neutral-50">
                    <td className="p-2.5 font-bold text-neutral-700">
                      {isVi ? "Trọng lượng cả bì (Gross Weight)" : "Gross Weight (GW)"}
                    </td>
                    <td className="p-2.5 text-black">{product.exportPackaging.grossWeightKg} kg / {isVi ? "thùng" : "ctn"}</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold text-neutral-700">
                      {isVi ? "Khả năng chứa trong cont 40HC (76 CBM)" : "Estimated 40HC Container Capacity (76 CBM)"}
                    </td>
                    <td className="p-2.5 font-bold text-neutral-800">
                      ~ {Math.floor(76 / singleCartonCbm)} {isVi ? "thùng" : "cartons"} ({Math.floor(76 / singleCartonCbm) * product.exportPackaging.pcsPerCarton} {isVi ? "sp" : "units"})
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-neutral-500 font-mono">
                {isVi ? "Đang cập nhật quy cách đóng gói." : "Packaging matrix is being updated."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}