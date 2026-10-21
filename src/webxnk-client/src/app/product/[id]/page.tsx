"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { TierPriceTable } from "@/components/store/TierPriceTable";
import { catalogApi } from "@/services/api";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useProductImage, getDefaultProductImageUrl } from "@/utils/productImages";
import { ProductImageEditModal } from "@/components/admin/ProductImageEditModal";
import { LandedCostCalculator } from "@/components/logistics/LandedCostCalculator";
import { CbmVisualizer } from "@/components/portal/CbmVisualizer";
import {
  Layers,
  ShoppingBag,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Truck,
  FileCheck,
  Share2,
  ChevronRight,
  Camera,
  Calculator,
  Box,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = Number(params?.id || 1);

  const [product, setProduct] = useState<import("@/types").Product | null>(null);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productLoadError, setProductLoadError] = useState(false);
  const [viewMode, setViewMode] = useState<"B2C" | "B2B">("B2C");
  const [quantity, setQuantity] = useState<number>(1);
  const [addedToast, setAddedToast] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [logisticsToolTab, setLogisticsToolTab] = useState<"landed_cost" | "container_3d">("landed_cost");

  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { imageUrl } = useProductImage(product || { id: productId, baseSku: "", imageUrl: undefined });
  const isVi = language === "vi";
  const isAdmin = user?.role === "SUPER_ADMIN" && !user.isDemo;

  useEffect(() => {
    let active = true;
    setIsLoadingProduct(true);
    setProductLoadError(false);
    catalogApi.getProductById(productId, language).then((result) => {
      if (!active) return;
      setProduct(result);
      setProductLoadError(!result);
    }).catch(() => {
      if (active) setProductLoadError(true);
    }).finally(() => { if (active) setIsLoadingProduct(false); });
    return () => { active = false; };
  }, [productId, language]);

  if (!product) {
    return <main className="mx-auto max-w-3xl px-4 py-24 text-center">{isLoadingProduct ? <p className="text-slate-500">{isVi ? "Đang tải sản phẩm..." : "Loading product..."}</p> : <div className="space-y-4"><h1 className="text-2xl font-bold">{productLoadError ? (isVi ? "Không thể tải sản phẩm." : "Could not load this product.") : (isVi ? "Không tìm thấy sản phẩm." : "Product not found.")}</h1><Link href="/" className="inline-flex rounded bg-[#0E4B94] px-4 py-2 text-white">{isVi ? "Về trang chủ" : "Back to home"}</Link></div>}</main>;
  }

  const currentTrans =
    product.translations?.find((tr) => tr.languageCode === language) ||
    product.translations?.find((tr) => tr.languageCode === "vi") ||
    product.translations?.[0];

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
    addItem(product, quantity, true);
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
          <div className="border border-neutral-300 bg-white overflow-hidden relative flex flex-col justify-between shadow-sm rounded">
            <div className="relative aspect-[4/3] w-full bg-neutral-100 overflow-hidden">
              <img
                src={imageUrl}
                alt={name}
                onError={(e) => {
                  const fallback = getDefaultProductImageUrl(product);
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-3 left-3 flex gap-2">
                <span className="bg-black/85 backdrop-blur-sm text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded shadow-sm">
                  HS {product.hsCode}
                </span>
                <span className="bg-[#0E4B94] text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded shadow-sm">
                  {t("home.origin")} {product.countryOfOrigin}
                </span>
              </div>

              <div className="absolute top-3 right-3">
                <button
                  onClick={() => alert(isVi ? "Đã sao chép liên kết sản phẩm!" : "Product link copied to clipboard!")}
                  className="p-1.5 bg-white/90 text-neutral-700 hover:text-black border border-neutral-300 rounded shadow-sm"
                  title={isVi ? "Chia sẻ" : "Share"}
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setEditModalOpen(true)}
                  className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-[#0E4B94] hover:bg-black text-white text-xs font-bold px-3 py-1.5 rounded shadow-lg border border-white/80 transition-all"
                >
                  <Camera className="w-4 h-4" />
                  <span>
                    {isVi
                      ? "Đổi ảnh từ thiết bị (Admin)"
                      : "Change Image from Device (Admin)"}
                  </span>
                </button>
              )}
            </div>

            <div className="p-3 bg-white border-t border-neutral-200 flex items-center justify-between text-xs font-mono text-neutral-600">
              <span>
                SKU: <strong className="text-black">{product.baseSku}</strong>
              </span>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded">ISO 9001:2015</span>
                <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded">CE & FDA Pass</span>
                <span className="px-2 py-0.5 bg-neutral-100 border border-neutral-200 rounded">{isVi ? "Cảng Cát Lái" : "Cat Lai Port"}</span>
              </div>
            </div>
          </div>

          {isAdmin && editModalOpen && (
            <ProductImageEditModal
              product={product}
              isOpen={editModalOpen}
              onClose={() => setEditModalOpen(false)}
            />
          )}

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

      {/* Phase 2: Interactive B2B Logistics Suite (Landed Cost FTA & 3D Container Load Planner) */}
      <div className="space-y-4 mt-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-2 border-black pb-3">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
              {isVi
                ? "BỘ CÔNG CỤ LOGISTICS & THUẾ QUAN NGOẠI THƯƠNG (PHASE 2)"
                : "B2B EXPORT LOGISTICS & FTA TARIFF INTELLIGENCE SUITE"}
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-black mt-0.5">
              {isVi
                ? "Mô phỏng Giá vốn Nhập khẩu (Landed Cost) & Đóng hàng Container 3D"
                : "Landed Cost Simulator & 3D WebGL Container Load Planner"}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Lot Size Presets for B2B Simulation */}
            <div className="flex items-center gap-1 text-[11px] font-mono bg-neutral-100 border border-neutral-300 px-2 py-1 rounded">
              <span className="text-neutral-500">{isVi ? "Lô mô phỏng:" : "Lot Size:"}</span>
              <button
                type="button"
                onClick={() => {
                  setViewMode("B2B");
                  setQuantity(product.priceTiers?.[0]?.minQuantity || 500);
                }}
                className="px-2 py-0.5 bg-white border border-neutral-300 hover:border-black font-bold rounded"
              >
                MOQ ({product.priceTiers?.[0]?.minQuantity || 500})
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("B2B");
                  const qty20gp = Math.max(500, Math.floor(28 / singleCartonCbm) * pcsPerCarton);
                  setQuantity(qty20gp);
                }}
                className="px-2 py-0.5 bg-white border border-neutral-300 hover:border-black font-bold rounded"
              >
                Full 20GP
              </button>
              <button
                type="button"
                onClick={() => {
                  setViewMode("B2B");
                  const qty40hc = Math.max(1000, Math.floor(65 / singleCartonCbm) * pcsPerCarton);
                  setQuantity(qty40hc);
                }}
                className="px-2 py-0.5 bg-white border border-neutral-300 hover:border-black font-bold rounded"
              >
                Full 40HC
              </button>
            </div>

            {/* Tool Switcher Tabs */}
            <div className="flex border border-black bg-white rounded overflow-hidden text-xs font-mono font-bold">
              <button
                type="button"
                onClick={() => setLogisticsToolTab("landed_cost")}
                className={`px-3.5 py-2 flex items-center gap-1.5 uppercase transition-colors ${
                  logisticsToolTab === "landed_cost"
                    ? "bg-[#0E4B94] text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <Calculator className="w-3.5 h-3.5" />
                <span>{isVi ? "Tính Giá Vốn & Thuế FTA" : "Landed Cost & FTA Duty"}</span>
              </button>
              <button
                type="button"
                onClick={() => setLogisticsToolTab("container_3d")}
                className={`px-3.5 py-2 flex items-center gap-1.5 uppercase border-l border-black transition-colors ${
                  logisticsToolTab === "container_3d"
                    ? "bg-[#0E4B94] text-white"
                    : "text-neutral-700 hover:bg-neutral-100"
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{isVi ? "Mô phỏng Cont 3D WebGL" : "3D Container Planner"}</span>
              </button>
            </div>
          </div>
        </div>

        {logisticsToolTab === "landed_cost" ? (
          <LandedCostCalculator
            productId={product.id}
            sku={product.baseSku}
            hsCode={product.hsCode}
            productName={name}
            quantity={Math.max(quantity, viewMode === "B2B" ? quantity : product.priceTiers?.[0]?.minQuantity || 120)}
            unitPriceUsd={
              viewMode === "B2B"
                ? effectiveUnitPrice
                : product.priceTiers?.[0]?.unitPriceUsd || product.defaultRetailPriceUsd
            }
          />
        ) : (
          <CbmVisualizer
            items={[
              {
                productId: product.id,
                quantity: Math.max(
                  quantity,
                  viewMode === "B2B" ? quantity : product.priceTiers?.[0]?.minQuantity || 120
                ),
              },
            ]}
          />
        )}
      </div>
    </div>
  );
}
