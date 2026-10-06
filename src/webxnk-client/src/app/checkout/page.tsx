"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Product } from "@/types";
import { catalogApi } from "@/services/api";
import { StripeCheckoutForm } from "@/components/checkout/StripeCheckoutForm";
import {
  ShieldCheck,
  Lock,
  ArrowLeft,
  Truck,
  FileCheck2,
  HelpCircle,
  Clock,
  Package,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

const FALLBACK_PRODUCT: Product = {
  id: 1,
  categoryId: 1,
  baseSku: "SHOES-SNK-V1",
  hsCode: "6404.11.00",
  countryOfOrigin: "VNM",
  defaultRetailPriceUsd: 25.0,
  isActive: true,
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
  ],
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const productId = Number(searchParams?.get("productId") || "1");
  const initialQty = Math.max(1, Number(searchParams?.get("quantity") || "1"));

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity] = useState<number>(initialQty);
  const [loading, setLoading] = useState<boolean>(true);
  const { formatPrice, currency } = useCurrency();
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  useEffect(() => {
    catalogApi
      .getProductById(productId)
      .then((res) => {
        setProduct(res || FALLBACK_PRODUCT);
      })
      .catch(() => {
        setProduct(FALLBACK_PRODUCT);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#0E4B94] border-r-transparent"></div>
        <p className="mt-4 font-mono text-sm text-neutral-600">
          {isVi
            ? "Đang tải thông tin đơn hàng thanh toán quốc tế..."
            : "Loading checkout and inventory reservation details..."}
        </p>
      </div>
    );
  }

  const currentProduct = product || FALLBACK_PRODUCT;
  const productName =
    currentProduct.translations?.find((tr) => tr.languageCode === language)?.name ||
    currentProduct.translations?.[0]?.name ||
    currentProduct.baseSku;

  const unitPrice = currentProduct.defaultRetailPriceUsd;
  const subtotal = unitPrice * quantity;
  const shippingFee = subtotal > 100 ? 0 : 15;
  const taxEst = subtotal * 0.08;
  const total = subtotal + shippingFee + taxEst;
  const totalVnd = Math.round(total * 25400);

  return (
    <div className="min-h-screen bg-neutral-50 pb-16 pt-6">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Navigation */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-neutral-200 pb-4">
          <Link
            href={`/product/${currentProduct.id}`}
            className="inline-flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>{t("checkout.backToPdp")}</span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono text-neutral-500">
            <span className="flex items-center gap-1 text-emerald-700">
              <ShieldCheck className="h-4 w-4" />
              {t("checkout.sslNotice")}
            </span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:flex items-center gap-1 text-neutral-700">
              <Lock className="h-3.5 w-3.5" />
              {t("checkout.pciNotice")}
            </span>
          </div>
        </div>

        {/* Security Announcement Banner */}
        <div className="mb-8 rounded border-l-4 border-[#0E4B94] bg-blue-50 p-4">
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 h-5 w-5 text-[#0E4B94] shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-[#0E4B94]">
                {t("checkout.reservationBannerTitle")}
              </h3>
              <p className="mt-1 text-xs text-neutral-700">
                {t("checkout.reservationBannerDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Two-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Stripe Form Column */}
          <div className="lg:col-span-8">
            <StripeCheckoutForm product={currentProduct} quantity={quantity} />
          </div>

          {/* Right Sidebar: Order Summary & Logistics Details */}
          <div className="lg:col-span-4 space-y-6">
            <div className="border border-neutral-200 bg-white p-5 shadow-sm rounded">
              <h3 className="border-b border-neutral-200 pb-3 text-xs font-mono font-bold uppercase tracking-wider text-black">
                {t("checkout.cartDetails")}
              </h3>

              <div className="mt-4 flex gap-4 border-b border-neutral-100 pb-4">
                <div className="h-16 w-16 shrink-0 border border-neutral-200 bg-neutral-100 flex items-center justify-center rounded">
                  <Package className="h-8 w-8 text-[#0E4B94]" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-neutral-900 leading-snug">
                    {productName}
                  </h4>
                  <p className="mt-1 text-[11px] font-mono text-neutral-500">
                    SKU: {currentProduct.baseSku}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500">
                    HS: {currentProduct.hsCode} | {t("home.origin")} {currentProduct.countryOfOrigin}
                  </p>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-mono text-neutral-600">
                      {formatPrice(unitPrice)} x {quantity}
                    </span>
                    <span className="font-mono font-bold text-neutral-900">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee Breakdown */}
              <div className="mt-4 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-neutral-600">
                  <span>{t("checkout.subtotal")}</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>{t("checkout.shipping")}</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-emerald-600 font-bold">{t("checkout.freeShipping")}</span>
                    ) : (
                      formatPrice(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>{t("checkout.customsTax")}</span>
                  <span>{formatPrice(taxEst)}</span>
                </div>
                <div className="border-t border-dashed border-neutral-300 pt-3 flex justify-between items-baseline">
                  <span className="font-bold text-neutral-900">{t("checkout.totalPayment")}</span>
                  <div className="text-right">
                    <div className="text-lg font-black text-[#0E4B94]">
                      {formatPrice(total)}
                    </div>
                    {currency !== "VND" && (
                      <div className="text-[11px] text-neutral-500">
                        ≈ {totalVnd.toLocaleString("vi-VN")} ₫
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Packaging & Logistics Box */}
            {currentProduct.exportPackaging && (
              <div className="border border-neutral-200 bg-white p-5 shadow-sm space-y-3 rounded">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                  <Truck className="h-4 w-4 text-[#0E4B94]" />
                  {isVi ? "Quy cách kiện hàng xuất khẩu" : "Export Packaging Specification"}
                </h4>
                <div className="text-xs font-mono space-y-1.5 text-neutral-600 bg-neutral-50 p-3 border border-neutral-100 rounded">
                  <div className="flex justify-between">
                    <span>{isVi ? "Đóng gói:" : "Packaging:"}</span>
                    <span className="font-semibold">
                      {currentProduct.exportPackaging.pcsPerCarton} {isVi ? "sản phẩm / Thùng" : "units / Carton"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? "Kích thước thùng:" : "Carton Dimensions:"}</span>
                    <span className="font-semibold">
                      {currentProduct.exportPackaging.cartonLengthCm} x {currentProduct.exportPackaging.cartonWidthCm} x {currentProduct.exportPackaging.cartonHeightCm} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? "Trọng lượng cả bì (GW):" : "Gross Weight (GW):"}</span>
                    <span className="font-semibold">{currentProduct.exportPackaging.grossWeightKg} kg/{isVi ? "thùng" : "ctn"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quang Tấn Hoàng Guarantee */}
            <div className="border border-neutral-200 bg-white p-5 shadow-sm space-y-3 rounded">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-emerald-600" />
                {isVi ? "Cam kết từ Quang Tấn Hoàng" : "Quang Tan Hoang Assurance"}
              </h4>
              <ul className="text-xs space-y-2 text-neutral-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    {isVi
                      ? "100% Sản phẩm chính ngạch, cung cấp hóa đơn thương mại (CI) và CO."
                      : "100% Legally certified cargo, providing Commercial Invoice (CI) & Certificate of Origin."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    {isVi
                      ? "Đổi trả và bồi thường nếu hàng hóa không đúng tiêu chuẩn xuất khẩu."
                      : "Full replacement warranty and compensation if cargo deviates from export specifications."}
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>
                    {isVi
                      ? "Hỗ trợ thủ tục thông quan và giao Door-to-Door theo điều kiện Incoterms."
                      : "Direct customs clearance support and Door-to-Door logistics under Incoterms 2020."}
                  </span>
                </li>
              </ul>
            </div>

            {/* Need Help Box */}
            <div className="border border-neutral-200 bg-neutral-100 p-4 text-xs font-mono text-neutral-600 flex items-center gap-3 rounded">
              <HelpCircle className="h-5 w-5 text-neutral-500 shrink-0" />
              <div>
                <span>
                  {isVi
                    ? "Cần hỗ trợ hợp đồng B2B hoặc thanh toán L/C?"
                    : "Need corporate B2B contracts or Letter of Credit (L/C)?"}
                </span>
                <Link href="/portal" className="block text-[#0E4B94] font-bold hover:underline">
                  {isVi ? "Chuyển sang Cổng B2B RFQ →" : "Switch to B2B RFQ Portal →"}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-24 text-center font-mono text-sm text-neutral-600">
          Loading checkout...
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}