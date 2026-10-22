"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  User, 
  Building, 
  Package, 
  FileText, 
  CheckCircle2, 
  Ship,
  Globe, 
  Mail, 
  MapPin, 
  ExternalLink, 
  ShieldCheck,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { isValidEmail, isValidVietnamPhone } from "@/utils/validation";
import { ordersApi, rfqApi, OrderHistoryEntry, RfqHistoryEntry } from "@/services/api";

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated, loginAsDemo, loadProfile, updateProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "rfqs">("overview");
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [rfqs, setRfqs] = useState<RfqHistoryEntry[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    if (!user) return;
    setProfileName(user.fullName);
    setProfileEmail(user.email);
    setProfilePhone(user.phone || "");
    void loadProfile();
  }, [user?.id]);

  useEffect(() => {
    let isActive = true;
    setOrders([]);
    setRfqs([]);
    setHistoryError("");

    // Demo identities do not represent database accounts and must not load real customer history.
    if (!user || user.isDemo) {
      setIsLoadingHistory(false);
      return () => { isActive = false; };
    }

    setIsLoadingHistory(true);
    void Promise.all([ordersApi.getMyOrders(), rfqApi.getMyRfqHistory()])
      .then(([orderHistory, rfqHistory]) => {
        if (!isActive) return;
        setOrders(orderHistory);
        setRfqs(rfqHistory);
      })
      .catch(() => {
        if (isActive) setHistoryError(language === "vi"
          ? "Không thể tải lịch sử tài khoản. Vui lòng thử lại sau."
          : "Could not load account history. Please try again later.");
      })
      .finally(() => {
        if (isActive) setIsLoadingHistory(false);
      });

    return () => { isActive = false; };
  }, [user?.id, user?.isDemo, language]);

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setProfileError("");
    setProfileMessage("");
    if (!profileName.trim()) return setProfileError("Vui lòng nhập họ tên.");
    if (!isValidEmail(profileEmail)) return setProfileError("Email không đúng định dạng.");
    if (!isValidVietnamPhone(profilePhone)) return setProfileError("Số điện thoại phải gồm 10 số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.");

    setIsSavingProfile(true);
    const success = await updateProfile({ fullName: profileName, email: profileEmail, phone: profilePhone });
    setIsSavingProfile(false);
    if (success) {
      setIsEditingProfile(false);
      setProfileMessage("Thông tin cá nhân đã được cập nhật.");
    } else {
      setProfileError("Không thể cập nhật hồ sơ. Email có thể đã được sử dụng hoặc API chưa sẵn sàng.");
    }
  };

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
              {orders.length}
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
              {rfqs.length}
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
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.fullName || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.email")}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.email || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.phone")}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">{user?.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Vai trò hệ thống" : "System Role"}</dt>
                  <dd className="font-semibold text-slate-800 mt-0.5">
                    {user?.role === "B2B_BUYER" ? t("profile.roleB2b") : user?.role === "SUPER_ADMIN" ? t("profile.roleAdmin") : t("profile.roleCustomer")}
                  </dd>
                </div>
              </dl>
              {user && (
                <div className="border-t border-slate-100 pt-4">
                  {!isEditingProfile ? (
                    <button
                      type="button"
                      onClick={() => { setProfileError(""); setIsEditingProfile(true); }}
                      className="rounded-lg bg-[#0E4B94] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0B3D78]"
                    >
                      {language === "vi" ? "Chỉnh sửa thông tin" : "Edit profile"}
                    </button>
                  ) : (
                    <form onSubmit={handleProfileSave} className="space-y-3">
                      <label className="block text-xs font-semibold text-slate-600">
                        {t("auth.fullName")}
                        <input value={profileName} onChange={(e) => setProfileName(e.target.value)} maxLength={150} required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        {t("auth.email")}
                        <input type="email" value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        {t("auth.phone")}
                        <input type="tel" inputMode="numeric" maxLength={10} value={profilePhone} onChange={(e) => setProfilePhone(e.target.value)} required className="mt-1 w-full rounded border border-slate-300 px-3 py-2 text-sm" />
                      </label>
                      {profileError && <p role="alert" className="text-xs text-red-700">{profileError}</p>}
                      <div className="flex gap-2">
                        <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-[#0E4B94] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50">
                          {isSavingProfile ? "Đang lưu..." : "Lưu thay đổi"}
                        </button>
                        <button type="button" onClick={() => { setIsEditingProfile(false); setProfileError(""); }} className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700">
                          Hủy
                        </button>
                      </div>
                    </form>
                  )}
                  {profileMessage && <p role="status" className="mt-2 text-xs text-emerald-700">{profileMessage}</p>}
                </div>
              )}
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
                    <dd className="font-semibold text-slate-800 mt-0.5 font-mono">{user.taxId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.country")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user.country || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyWebsite")}</dt>
                    <dd className="font-semibold text-blue-600 mt-0.5">
                      {user.companyWebsite ? <a href={`https://${user.companyWebsite}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                        <Globe className="w-3.5 h-3.5" />
                        {user.companyWebsite}
                      </a> : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyAddress")}</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {user.companyAddress || "—"}
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
            {historyError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{historyError}</p>}
            {isLoadingHistory ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{language === "vi" ? "Đang tải lịch sử đơn hàng..." : "Loading order history..."}</div>
            ) : historyError ? null : orders.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {user?.isDemo
                  ? (language === "vi" ? "Tài khoản demo không có lịch sử đơn hàng thật." : "Demo accounts have no real order history.")
                  : (language === "vi" ? "Bạn chưa có đơn hàng nào." : "You have no orders yet.")}
              </div>
            ) : orders.map((order, orderIndex) => (
              <div 
                key={order.id ?? order.orderNumber ?? `order-${orderIndex}`}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{order.orderCode}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">{order.orderStatus}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("profile.orderDate")}: <span className="font-medium text-slate-700">{new Date(order.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{t("profile.orderTotal")}</p>
                    <p className="text-lg font-bold text-[#0E4B94]">
                      {formatPrice(order.totalAmountUsd)}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {(Array.isArray(order.items) ? order.items : []).map((item, itemIndex) => (
                    <div key={item.id ?? `${order.id ?? orderIndex}-item-${itemIndex}`} className="flex items-center justify-between text-sm py-1">
                      <span className="text-slate-800 font-medium">
                        {item.productName} <span className="text-slate-400">× {item.quantity}</span>
                      </span>
                      <span className="text-slate-600 font-mono">
                        {formatPrice(item.totalPriceUsd)}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="border-t border-slate-100 pt-3 text-xs text-slate-500">
                  {language === "vi" ? "Thanh toán" : "Payment"}: {order.paymentStatus} · {order.recipientName} · {order.shippingAddressLine}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: B2B RFQS */}
        {activeTab === "rfqs" && (
          <div className="space-y-4">
            {historyError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{historyError}</p>}
            {isLoadingHistory ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">{language === "vi" ? "Đang tải yêu cầu báo giá..." : "Loading quotation requests..."}</div>
            ) : historyError ? null : rfqs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {user?.isDemo
                  ? (language === "vi" ? "Tài khoản demo không có yêu cầu báo giá thật." : "Demo accounts have no real quotation requests.")
                  : (language === "vi" ? "Bạn chưa gửi yêu cầu báo giá nào." : "You have not submitted any quotation requests.")}
              </div>
            ) : rfqs.map((rfq, rfqIndex) => (
              <div 
                key={rfq.id ?? rfq.rfqNumber ?? `rfq-${rfqIndex}`}
                className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-base">{rfq.rfqNumber}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#0E4B94] border border-blue-200">
                        {rfq.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {t("profile.rfqDate")}: <span className="font-medium text-slate-700">{new Date(rfq.createdAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Giá trị dự toán" : "Quotation Value"}</p>
                    <p className="text-lg font-bold text-[#C9252C]">
                      {formatPrice(rfq.totalQuotedAmountUsd)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm bg-slate-50 p-4 rounded-xl">
                  <div>
                    <span className="text-xs text-slate-400 block">{t("profile.rfqIncoterms")}</span>
                    <span className="font-semibold text-slate-800">{rfq.incotermCode}</span>
                    <span className="text-xs text-slate-500 block">Cảng đích: {rfq.portOfDischarge}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">{t("profile.rfqCbm")}</span>
                    <span className="font-semibold text-slate-800">{rfq.totalCbm} CBM</span>
                    <span className="text-xs text-slate-500 block">{rfq.companyName}</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                  <Link href={`/portal?rfqId=${rfq.id}`} className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5" />
                    {t("profile.openNegotiation")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
