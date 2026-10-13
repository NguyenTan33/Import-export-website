"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  User, 
  Building, 
  Package, 
  FileText, 
  CheckCircle2, 
  Clock, 
  Ship, 
  Globe, 
  Mail, 
  MapPin, 
  Download, 
  ExternalLink, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";

// Demo data for orders and RFQs if server response is not yet populated
const DEMO_B2C_ORDERS = [
  {
    id: "ORD-2026-8891",
    date: "2026-09-28",
    items: [
      { name: "Hạt Điều Rang Muối Xuất Khẩu Bình Phước (Hộp 500g)", qty: 10, priceUsd: 8.5 },
      { name: "Cà Phê Robusta Đặc Sản Cầu Đất Đóng Gói Chân Không (Túi 1kg)", qty: 5, priceUsd: 14.0 },
    ],
    totalUsd: 155.0,
    shippingFeeUsd: 25.0,
    paymentStatus: "PAID",
    orderStatus: "PACKING",
    trackingNo: "BL-CATLAI-TYO-9921",
    shippingAddress: "123 Omotesando, Shibuya-ku, Tokyo 150-0001, Japan",
  },
  {
    id: "ORD-2026-7732",
    date: "2026-09-15",
    items: [
      { name: "Trà Xanh Thái Nguyên Hảo Hạng Xuất Khẩu (Hộp Thiếc 250g)", qty: 20, priceUsd: 6.0 },
    ],
    totalUsd: 120.0,
    shippingFeeUsd: 22.0,
    paymentStatus: "PAID",
    orderStatus: "SHIPPED",
    trackingNo: "BL-CATLAI-LAX-4418",
    shippingAddress: "456 Sunset Boulevard, Los Angeles, CA 90028, USA",
  },
];

const DEMO_B2B_RFQS = [
  {
    id: "RFQ-2026-QTH-001",
    date: "2026-09-25",
    productName: "Hạt Điều Rang Muối Bình Phước Loại W240 (Thùng 20kg)",
    quantity: 500,
    unit: "Thùng",
    incoterm: "FOB Cát Lái (Hồ Chí Minh)",
    targetPort: "Tokyo Port (JP TYO)",
    totalCbm: "22.5 CBM (1 x 20GP Container)",
    status: "QUOTED",
    officialPriceUsd: 84500,
    statusTextVi: "Đã có báo giá chính thức",
    statusTextEn: "Official Quotation Available",
  },
  {
    id: "RFQ-2026-QTH-002",
    date: "2026-09-18",
    productName: "Cà Phê Robusta Đặc Sản Đắk Lắk Grade 1 S18",
    quantity: 1200,
    unit: "Bao 60kg",
    incoterm: "CIF Los Angeles (USA)",
    targetPort: "Los Angeles Port (US LAX)",
    totalCbm: "64.0 CBM (1 x 40HC Container)",
    status: "ACCEPTED",
    officialPriceUsd: 246000,
    statusTextVi: "Đã chốt thỏa thuận (Chờ cọc 30% T/T)",
    statusTextEn: "Quotation Accepted (Awaiting 30% T/T)",
  },
];

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated, loginAsDemo } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "rfqs">("overview");

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center text-sm text-slate-500 gap-2">
          <Link href="/" className="hover:text-[#0E4B94] transition-colors">
            {language === "vi" ? "Trang Chủ" : "Home"}
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-slate-800 font-medium">
            {t("profile.title")}
          </span>
        </nav>

        {/* Not Logged In Banner */}
        {!isAuthenticated && (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold tracking-wider uppercase border border-blue-400/30">
                  <Sparkles className="w-3.5 h-3.5" />
                  {language === "vi" ? "Chế độ kiểm thử nhanh" : "Fast Demo Mode"}
                </span>
                <h2 className="text-2xl font-bold">
                  {language === "vi" 
                    ? "Bạn chưa đăng nhập vào hệ thống WebXNK" 
                    : "You are not signed in to WebXNK"}
                </h2>
                <p className="text-blue-200 text-sm max-w-xl">
                  {language === "vi"
                    ? "Hãy chọn 1 trong 3 tài khoản Demo bên dưới để kiểm thử tính năng quản lý hồ sơ, đơn hàng B2C và RFQ B2B."
                    : "Choose one of the 3 pre-configured demo test accounts below to preview orders, RFQs, and corporate profiles."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => loginAsDemo("b2c")}
                  className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 transition-all flex items-center gap-2"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  {t("auth.demoB2c")}
                </button>
                <button
                  onClick={() => loginAsDemo("b2b")}
                  className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-2"
                >
                  <Building className="w-4 h-4 text-amber-300" />
                  {t("auth.demoB2b")}
                </button>
                <button
                  onClick={() => loginAsDemo("admin")}
                  className="px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-500/30 transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  {t("auth.demoAdmin")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#0E4B94] to-[#1E3A8A] flex items-center justify-center text-white font-bold text-2xl sm:text-3xl shadow-lg shadow-blue-900/20">
              {user ? user.fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                  {user ? user.fullName : (language === "vi" ? "Người dùng Khách" : "Guest User")}
                </h1>
                {user?.role === "B2B_BUYER" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0E4B94] border border-blue-200">
                    <Building className="w-3 h-3" />
                    {t("profile.roleB2b")}
                  </span>
                ) : user?.role === "SUPER_ADMIN" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-[#C9252C] border border-red-200">
                    <ShieldCheck className="w-3 h-3" />
                    {t("profile.roleAdmin")}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <User className="w-3 h-3" />
                    {t("profile.roleCustomer")}
                  </span>
                )}
                {user?.isVerifiedB2b && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <CheckCircle2 className="w-3 h-3 text-amber-600" />
                    {t("profile.verifiedBadge")}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5" />
                {user ? user.email : "guest@example.com"}
              </p>
              {user?.companyName && (
                <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-[#0E4B94]" />
                  {user.companyName} ({user.country || "Japan"})
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {user?.role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-red-600/20"
              >
                <ShieldCheck className="w-4 h-4" />
                {t("nav.admin")}
              </Link>
            )}
            <Link
              href="/portal"
              className="px-4 py-2 rounded-xl bg-[#0E4B94] hover:bg-[#0B3D78] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/20"
            >
              <FileText className="w-4 h-4" />
              {t("nav.portal")}
            </Link>
            <Link
              href="/tracking"
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
            >
              <Ship className="w-4 h-4 text-blue-600" />
              {t("nav.tracking")}
            </Link>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 gap-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "overview"
                ? "border-[#0E4B94] text-[#0E4B94]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-4 h-4" />
            {t("profile.tabOverview")}
          </button>
          <button
            onClick={() => setActiveTab("orders")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "orders"
                ? "border-[#0E4B94] text-[#0E4B94]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="w-4 h-4" />
            {t("profile.tabB2cOrders")}
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
              {DEMO_B2C_ORDERS.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("rfqs")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
              activeTab === "rfqs"
                ? "border-[#0E4B94] text-[#0E4B94]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText className="w-4 h-4" />
            {t("profile.tabB2bRfqs")}
            <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-blue-100 text-[#0E4B94]">
              {DEMO_B2B_RFQS.length}
            </span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personal Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="w-4 h-4 text-[#0E4B94]" />
                {t("profile.personalInfo")}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.fullName")}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.fullName || "John Doe"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.email")}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.email || "john.buyer@gmail.com"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.phone")}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.phone || "+81 90 1234 5678"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Vai trò hệ thống" : "System Role"}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">
                    {user?.role === "B2B_BUYER" ? t("profile.roleB2b") : user?.role === "SUPER_ADMIN" ? t("profile.roleAdmin") : t("profile.roleCustomer")}
                  </dd>
                </div>
              </dl>
            </div>

            {/* Corporate Details */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="w-4 h-4 text-[#0E4B94]" />
                {t("profile.companyInfo")}
              </h2>
              {user?.companyName ? (
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyName")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user.companyName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.taxId")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5 font-mono">{user.taxId || "JP-9010401012345"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.country")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user.country || "Japan"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyWebsite")}</dt>
                    <dd className="font-semibold text-blue-600 mt-0.5">
                      <a href={`https://${user.companyWebsite || "www.tokyotrading.co.jp"}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                        <Globe className="w-3.5 h-3.5" />
                        {user.companyWebsite || "www.tokyotrading.co.jp"}
                      </a>
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyAddress")}</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {user.companyAddress || "Chiyoda-ku, Tokyo, Japan"}
                    </dd>
                  </div>
                </dl>
              ) : (
                <div className="py-6 text-center text-slate-500 space-y-3">
                  <p className="text-sm">
                    {language === "vi" 
                      ? "Bạn đang đăng nhập bằng tài khoản Khách Mua Lẻ (B2C)."
                      : "You are currently signed in as a Retail Buyer (B2C)."}
                  </p>
                  <button
                    onClick={() => loginAsDemo("b2b")}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-[#0E4B94] text-xs font-semibold hover:bg-blue-100 transition-colors"
                  >
                    <Building className="w-4 h-4" />
                    {language === "vi" ? "Chuyển sang tài khoản B2B Partner Demo" : "Switch to B2B Partner Demo Account"}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: B2C ORDERS */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {DEMO_B2C_ORDERS.map((order) => (
              <div 
                key={order.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{order.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {t("profile.statusConfirmed")}
                      </span>
                      {order.orderStatus === "PACKING" && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {t("profile.statusPacking")}
                        </span>
                      )}
                      {order.orderStatus === "SHIPPED" && (
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                          <Ship className="w-3 h-3" />
                          {t("profile.statusShipped")}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("profile.orderDate")}: <span className="font-medium text-slate-700">{order.date}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{t("profile.orderTotal")}</p>
                    <p className="text-lg font-bold text-[#0E4B94]">
                      {formatPrice(order.totalUsd)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1">
                      <span className="text-slate-800 font-medium">
                        {item.name} <span className="text-slate-400">× {item.qty}</span>
                      </span>
                      <span className="text-slate-600 font-mono">
                        {formatPrice(item.priceUsd * item.qty)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Footer Controls */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Ship className="w-4 h-4 text-[#0E4B94]" />
                    <span>{t("profile.trackingNo")}:</span>
                    <span className="font-mono font-semibold text-slate-900">{order.trackingNo}</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <Link
                      href={`/tracking?query=${order.trackingNo}`}
                      className="px-3.5 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#0E4B94] font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      {t("profile.viewTracking")}
                    </Link>
                    <button
                      onClick={() => alert(language === "vi" ? `Đang phát hành Hóa đơn Thương mại QuestPDF cho đơn ${order.id}...` : `Generating QuestPDF Commercial Invoice for ${order.id}...`)}
                      className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      {t("profile.invoiceDownload")}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: B2B RFQS */}
        {activeTab === "rfqs" && (
          <div className="space-y-4">
            {DEMO_B2B_RFQS.map((rfq) => (
              <div 
                key={rfq.id}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{rfq.id}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0E4B94] border border-blue-200">
                        {language === "vi" ? rfq.statusTextVi : rfq.statusTextEn}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("profile.rfqDate")}: <span className="font-medium text-slate-700">{rfq.date}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Giá trị dự toán" : "Quotation Value"}</p>
                    <p className="text-lg font-bold text-[#C9252C]">
                      {formatPrice(rfq.officialPriceUsd)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-xs text-slate-400 block">{t("profile.orderItems")}</span>
                    <span className="font-semibold text-slate-800">{rfq.productName}</span>
                    <span className="text-xs text-slate-500 block">Số lượng: {rfq.quantity} {rfq.unit}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t("profile.rfqIncoterms")}</span>
                    <span className="font-semibold text-slate-800">{rfq.incoterm}</span>
                    <span className="text-xs text-slate-500 block">Cảng đích: {rfq.targetPort}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t("profile.rfqCbm")}</span>
                    <span className="font-semibold text-slate-800">{rfq.totalCbm}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Link
                    href={`/portal?rfqId=${rfq.id}`}
                    className="px-4 py-2 rounded-xl bg-[#0E4B94] hover:bg-[#0B3D78] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/10"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    {t("profile.openNegotiation")}
                  </Link>
                  <button
                    onClick={() => alert(language === "vi" ? `Đang tải Proforma Invoice chuẩn ICC cho ${rfq.id}...` : `Downloading ICC Proforma Invoice for ${rfq.id}...`)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {t("profile.viewPi")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
