"use client";

import React, { useEffect, useState, useMemo } from "react";
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
  Sparkles,
  FileSignature,
  CreditCard,
  Download,
  AlertCircle,
  FileCheck2,
  Clock
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useCurrency } from "@/context/CurrencyContext";
import { isValidEmail, isValidVietnamPhone } from "@/utils/validation";
import { 
  ordersApi, 
  rfqApi, 
  OrderHistoryEntry, 
  RfqHistoryEntry,
  contractsApi,
  documentsApi,
  paymentsApi
} from "@/services/api";
import { SalesContract, B2BPaymentSlip } from "@/types";
import { AddressBookPanel } from "@/components/profile/AddressBookPanel";
import { Pagination } from "@/components/common/Pagination";

export default function ProfilePage() {
  const { t, language } = useLanguage();
  const { user, isAuthenticated, loginAsDemo, loadProfile, updateProfile } = useAuth();
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<"overview" | "kyb" | "contracts" | "rfqs" | "payments" | "orders" | "addresses">("overview");
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

  // B2B specific contracts & payment slips state
  const [contractsList, setContractsList] = useState<SalesContract[]>([]);
  const [paymentSlips, setPaymentSlips] = useState<B2BPaymentSlip[]>([]);
  const [isLoadingB2bData, setIsLoadingB2bData] = useState(false);
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null);

  const [orderPage, setOrderPage] = useState(1);
  const [orderPageSize, setOrderPageSize] = useState(5);
  const [rfqPage, setRfqPage] = useState(1);
  const [rfqPageSize, setRfqPageSize] = useState(5);
  const [contractPage, setContractPage] = useState(1);
  const [contractPageSize, setContractPageSize] = useState(5);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize, setPaymentPageSize] = useState(5);

  const paginatedOrders = useMemo(() => {
    const start = (orderPage - 1) * orderPageSize;
    return orders.slice(start, start + orderPageSize);
  }, [orders, orderPage, orderPageSize]);

  const paginatedRfqs = useMemo(() => {
    const start = (rfqPage - 1) * rfqPageSize;
    return rfqs.slice(start, start + rfqPageSize);
  }, [rfqs, rfqPage, rfqPageSize]);

  const paginatedContracts = useMemo(() => {
    const start = (contractPage - 1) * contractPageSize;
    return contractsList.slice(start, start + contractPageSize);
  }, [contractsList, contractPage, contractPageSize]);

  const paginatedPaymentSlips = useMemo(() => {
    const start = (paymentPage - 1) * paymentPageSize;
    return paymentSlips.slice(start, start + paymentPageSize);
  }, [paymentSlips, paymentPage, paymentPageSize]);
  const isB2b = user?.role === "B2B_BUYER";
  const isB2c = user?.role === "B2C_CUSTOMER";
  const canViewCustomerFeatures = isB2b || isB2c;
  const canManageAddresses = canViewCustomerFeatures && !!user && !user.isDemo;

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
    if (!user || user.isDemo || !canViewCustomerFeatures) {
      setIsLoadingHistory(false);
      return () => { isActive = false; };
    }

    setIsLoadingHistory(true);
    void Promise.all([
      ordersApi.getMyOrders(),
      isB2b ? rfqApi.getMyRfqHistory() : Promise.resolve([] as RfqHistoryEntry[]),
    ])
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
  }, [user?.id, user?.isDemo, isB2b, canViewCustomerFeatures, language]);

  useEffect(() => {
    if (!isB2b || !rfqs.length) {
      setContractsList([]);
      setPaymentSlips([]);
      return;
    }
    let isActive = true;
    setIsLoadingB2bData(true);
    const validRfqs = rfqs.filter((r) => r.id);

    Promise.all([
      Promise.all(validRfqs.map((r) => contractsApi.getContractByRfqId(r.id!))),
      Promise.all(validRfqs.map((r) => paymentsApi.getB2BPaymentsByRfq(r.id!))),
    ])
      .then(([contractsResults, slipsResults]) => {
        if (!isActive) return;
        const contracts = contractsResults.filter((c): c is SalesContract => c !== null);
        setContractsList(contracts);
        setPaymentSlips(slipsResults.flat());
      })
      .catch(() => {
        // silent fallback
      })
      .finally(() => {
        if (isActive) setIsLoadingB2bData(false);
      });

    return () => {
      isActive = false;
    };
  }, [isB2b, rfqs]);

  useEffect(() => {
    if (activeTab === "orders" && !canViewCustomerFeatures) setActiveTab("overview");
    if (activeTab === "rfqs" && !isB2b) setActiveTab("overview");
    if (activeTab === "kyb" && !isB2b) setActiveTab("overview");
    if (activeTab === "contracts" && !isB2b) setActiveTab("overview");
    if (activeTab === "payments" && !isB2b) setActiveTab("overview");
    if (activeTab === "addresses" && !canManageAddresses) setActiveTab("overview");
  }, [activeTab, canManageAddresses, canViewCustomerFeatures, isB2b]);

  const handleDownloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const handleDownloadContract = async (contractId: number, contractNumber: string) => {
    setDownloadingDocId(`contract-${contractId}`);
    try {
      const blob = await contractsApi.downloadContractPdf(contractId);
      handleDownloadBlob(blob, `Sales_Contract_${contractNumber}.pdf`);
    } catch {
      alert(language === "vi" ? "Không thể tải file PDF hợp đồng từ máy chủ." : "Could not download contract PDF.");
    } finally {
      setDownloadingDocId(null);
    }
  };

  const handleDownloadPi = async (rfqId: number, rfqNumber: string) => {
    setDownloadingDocId(`pi-${rfqId}`);
    try {
      const blob = await documentsApi.downloadProformaInvoice(rfqId);
      handleDownloadBlob(blob, `Proforma_Invoice_${rfqNumber}.pdf`);
    } catch {
      alert(language === "vi" ? "Không thể tải Proforma Invoice từ máy chủ." : "Could not download Proforma Invoice.");
    } finally {
      setDownloadingDocId(null);
    }
  };

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
            {isB2b && (
              <Link
                href="/portal"
                className="px-4 py-2 rounded-xl bg-[#0E4B94] hover:bg-[#0B3D78] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md shadow-blue-900/20"
              >
                <FileText className="w-4 h-4" />
                {t("nav.portal")}
              </Link>
            )}
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

          {isB2b && (
            <button
              onClick={() => setActiveTab("kyb")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "kyb"
                  ? "border-[#0E4B94] text-[#0E4B94]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              {language === "vi" ? "Hồ sơ pháp lý (KYB)" : "KYB & Compliance"}
              {user?.isVerifiedB2b ? (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-700">✓</span>
              ) : (
                <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">!</span>
              )}
            </button>
          )}

          {isB2b && (
            <button
              onClick={() => setActiveTab("contracts")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "contracts"
                  ? "border-[#0E4B94] text-[#0E4B94]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <FileSignature className="w-4 h-4" />
              {language === "vi" ? "Hợp đồng & Chứng từ" : "Contracts & Docs"}
              {contractsList.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">
                  {contractsList.length}
                </span>
              )}
            </button>
          )}

          {isB2b && (
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
          )}

          {isB2b && (
            <button
              onClick={() => setActiveTab("payments")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "payments"
                  ? "border-[#0E4B94] text-[#0E4B94]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              {language === "vi" ? "Ủy nhiệm chi T/T" : "Wire Slips"}
              {paymentSlips.length > 0 && (
                <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                  {paymentSlips.length}
                </span>
              )}
            </button>
          )}

          {canViewCustomerFeatures && (
            <button
              onClick={() => setActiveTab("orders")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${
                activeTab === "orders"
                  ? "border-[#0E4B94] text-[#0E4B94]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Package className="w-4 h-4" />
              {isB2b ? (language === "vi" ? "Đơn hàng mẫu" : "Sample Orders") : t("profile.tabB2cOrders")}
              <span className="ml-1 px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                {orders.length}
              </span>
            </button>
          )}

          {canManageAddresses && (
            <button
              onClick={() => setActiveTab("addresses")}
              className={`pb-3 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap ${activeTab === "addresses" ? "border-[#0E4B94] text-[#0E4B94]" : "border-transparent text-slate-500 hover:text-slate-800"}`}
            >
              <MapPin className="w-4 h-4" />
              {isB2b ? (language === "vi" ? "Cảng / Kho giao hàng" : "Delivery Ports") : (language === "vi" ? "Sổ địa chỉ" : "Address book")}
            </button>
          )}
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

            {/* Corporate Details or Retail Member Perks */}
            {isB2b || user?.companyName ? (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#0E4B94]" />
                    {t("profile.companyInfo")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setActiveTab("kyb")}
                    className="text-xs font-semibold text-[#0E4B94] hover:underline flex items-center gap-1"
                  >
                    <span>{language === "vi" ? "Xem hồ sơ KYB" : "View KYB"}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyName")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user?.companyName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.taxId")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5 font-mono">{user?.taxId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.country")}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user?.country || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyWebsite")}</dt>
                    <dd className="font-semibold text-blue-600 mt-0.5">
                      {user?.companyWebsite ? (
                        <a href={`https://${user.companyWebsite}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                          <Globe className="w-3.5 h-3.5" />
                          {user.companyWebsite}
                        </a>
                      ) : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{t("auth.companyAddress")}</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {user?.companyAddress || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            ) : isB2c ? (
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b border-slate-200/60 pb-3">
                  <Package className="w-4 h-4 text-[#0E4B94]" />
                  {language === "vi" ? "Đặc quyền thành viên mua lẻ (B2C)" : "Retail Member Perks"}
                </h2>
                <div className="space-y-3.5 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{language === "vi" ? "Thanh toán an toàn quốc tế" : "Secure Global Checkout"}</p>
                      <p className="text-slate-500">{language === "vi" ? "Tích hợp cổng Stripe bảo mật 3D-Secure 2.0 cho mọi loại thẻ tín dụng & ghi nợ quốc tế." : "Stripe integration with 3D-Secure 2.0 for all credit & debit cards."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Ship className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{language === "vi" ? "Tra cứu hành trình vận đơn trực tiếp" : "Live Vessel & Order Tracking"}</p>
                      <p className="text-slate-500">{language === "vi" ? "Theo dõi trạng thái giao nhận và định vị hải trình tàu biển xuất nhập khẩu thời gian thực." : "Real-time vessel and parcel tracking from origin port to destination."}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-800">{language === "vi" ? "Sổ địa chỉ nhận hàng linh hoạt" : "Flexible Address Book"}</p>
                      <p className="text-slate-500">{language === "vi" ? "Lưu nhiều địa chỉ nhận hàng để thanh toán nhanh chóng chỉ với 1 click." : "Save multiple shipping destinations for instant 1-click checkout."}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB: B2B KYB & CORPORATE PROFILE */}
        {activeTab === "kyb" && isB2b && (
          <div className="space-y-6">
            {/* Status Banner */}
            <div className={`p-6 rounded-2xl border ${
              user?.isVerifiedB2b 
                ? "bg-emerald-50/80 border-emerald-200 text-emerald-900" 
                : "bg-amber-50/80 border-amber-200 text-amber-900"
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                    user?.isVerifiedB2b ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
                  }`}>
                    {user?.isVerifiedB2b ? <ShieldCheck className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">
                      {user?.isVerifiedB2b 
                        ? (language === "vi" ? "Doanh nghiệp đã được xác thực pháp lý (KYB Verified)" : "Enterprise Verified Partner (KYB)")
                        : (language === "vi" ? "Hồ sơ đang chờ xác thực pháp lý (Pending Verification)" : "Pending Corporate Verification")}
                    </h3>
                    <p className="text-xs mt-0.5 opacity-90">
                      {user?.isVerifiedB2b
                        ? (language === "vi" ? "Tài khoản có đầy đủ quyền ký hợp đồng ngoại thương ICC, mở đàm phán giá xuất khẩu và thanh toán T/T quốc tế." : "Full access to sign ICC sales contracts, direct Incoterms negotiation and wire transfer settlements.")
                        : (language === "vi" ? "Ban quản trị đang rà soát thông tin pháp nhân. Quý doanh nghiệp vẫn có thể gửi RFQ để nhận báo giá dự toán." : "Admin is reviewing company profile. You can still submit RFQs for initial estimate.")}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    user?.isVerifiedB2b ? "bg-emerald-100 text-emerald-800 border border-emerald-300" : "bg-amber-100 text-amber-800 border border-amber-300"
                  }`}>
                    {user?.isVerifiedB2b ? "Verified B2B" : "Verification Pending"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Card 1: Pháp nhân đăng ký */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Building className="w-4 h-4 text-[#0E4B94]" />
                  {language === "vi" ? "Thông tin pháp nhân đăng ký" : "Corporate Registration"}
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Tên doanh nghiệp" : "Company Name"}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">{user?.companyName || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Mã số thuế / Tax ID" : "Tax ID"}</dt>
                    <dd className="font-mono font-bold text-slate-800 mt-0.5">{user?.taxId || "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Quốc gia đăng ký" : "Country"}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">{user?.country || "Vietnam"}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Website chính thức" : "Website"}</dt>
                    <dd className="font-semibold text-blue-600 mt-0.5">
                      {user?.companyWebsite ? (
                        <a href={`https://${user.companyWebsite}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:underline">
                          <Globe className="w-3.5 h-3.5" />
                          {user.companyWebsite}
                        </a>
                      ) : "—"}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Địa chỉ trụ sở" : "Registered Address"}</dt>
                    <dd className="font-medium text-slate-700 mt-0.5 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      {user?.companyAddress || "—"}
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Card 2: Tài khoản thanh toán & Đối soát quốc tế */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CreditCard className="w-4 h-4 text-[#0E4B94]" />
                  {language === "vi" ? "Tài khoản đối soát thanh toán quốc tế" : "International Settlement Info"}
                </h3>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Ngân hàng thụ hưởng" : "Beneficiary Bank"}</dt>
                    <dd className="font-bold text-slate-900 mt-0.5">Vietcombank / MUFG Bank</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Mã SWIFT / BIC Code" : "SWIFT / BIC"}</dt>
                    <dd className="font-mono font-bold text-[#0E4B94] mt-0.5">BFTVVNVX</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Tiền tệ thanh toán" : "Settlement Currency"}</dt>
                    <dd className="font-mono font-bold text-slate-800 mt-0.5">USD, JPY, EUR</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Phương thức hỗ trợ" : "Supported Methods"}</dt>
                    <dd className="font-semibold text-slate-800 mt-0.5">T/T, L/C Irrevocable</dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Ghi chú đối soát" : "Settlement Note"}</dt>
                    <dd className="text-xs text-slate-500 mt-0.5">
                      {language === "vi" 
                        ? "Mọi khoản thanh toán T/T cọc 30% và thanh toán 70% còn lại theo vận đơn B/L đều được đối soát tự động qua mã tham chiếu RFQ."
                        : "All 30% deposit and 70% balance wire transfers are reconciled automatically using your unique RFQ code."}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Card 3: Hồ sơ năng lực & Tiêu chuẩn ngành */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
                <FileCheck2 className="w-4 h-4 text-[#0E4B94]" />
                {language === "vi" ? "Hồ sơ năng lực & Chứng nhận xuất nhập khẩu" : "Export Credentials & Compliance"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">Giấy ĐKKD (ERC)</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">Hợp lệ</span>
                  </div>
                  <p className="text-xs text-slate-500">Bản sao điện tử Giấy chứng nhận Đăng ký Doanh nghiệp.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">ISO 9001:2015</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">Đã kiểm tra</span>
                  </div>
                  <p className="text-xs text-slate-500">Tiêu chuẩn Hệ thống Quản lý Chất lượng xuất khẩu.</p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">HACCP / GlobalGAP</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700">Đạt chuẩn</span>
                  </div>
                  <p className="text-xs text-slate-500">Chứng nhận an toàn thực phẩm và chuỗi cung ứng nông sản.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: B2B CONTRACTS & DOCUMENTS */}
        {activeTab === "contracts" && isB2b && (
          <div className="space-y-4">
            {isLoadingB2bData ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {language === "vi" ? "Đang tải danh sách hợp đồng ngoại thương..." : "Loading trade contracts..."}
              </div>
            ) : contractsList.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 space-y-3">
                <FileSignature className="w-10 h-10 text-slate-300 mx-auto" />
                <p>
                  {language === "vi"
                    ? "Chưa có hợp đồng nào được khởi tạo. Sau khi đàm phán hoàn tất ở Cổng B2B, bạn có thể xem và tải hợp đồng tại đây."
                    : "No contracts generated yet. Once negotiation in B2B Portal concludes, contracts will appear here."}
                </p>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E4B94] text-white text-xs font-semibold hover:bg-[#0B3D78] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {language === "vi" ? "Mở Cổng đàm phán B2B Portal" : "Open B2B Portal"}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedContracts.map((c, cIdx) => (
                    <div 
                      key={c.id ?? `contract-${cIdx}`}
                      className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-base">{c.contractNumber}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              c.status === "LEGALLY_BINDING"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : c.status === "BUYER_SIGNED" || c.status === "SELLER_SIGNED"
                                ? "bg-blue-50 text-[#0E4B94] border border-blue-200"
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {c.status === "LEGALLY_BINDING"
                                ? (language === "vi" ? "Có hiệu lực pháp lý (2 bên đã ký)" : "Legally Binding")
                                : c.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {language === "vi" ? "Tham chiếu" : "Ref"}: <span className="font-medium text-slate-700">{c.rfqNumber}</span> · {language === "vi" ? "Cảng đến" : "Discharge"}: <span className="font-medium text-slate-700">{c.portOfDischarge}</span>
                          </p>
                        </div>

                        <div className="text-left sm:text-right">
                          <p className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Giá trị hợp đồng" : "Contract Value"}</p>
                          <p className="text-lg font-bold text-[#0E4B94]">
                            {formatPrice(c.totalAmountUsd)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
                        <div>
                          <span className="text-slate-400 block uppercase tracking-wider">Incoterms</span>
                          <span className="font-bold text-slate-800">{c.incotermCode}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase tracking-wider">{language === "vi" ? "Bên mua" : "Buyer"}</span>
                          <span className="font-semibold text-slate-800">{c.buyerCompanyName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block uppercase tracking-wider">{language === "vi" ? "Điều khoản thanh toán" : "Payment Terms"}</span>
                          <span className="font-semibold text-slate-800">{c.paymentTerms || "T/T 30/70"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadContract(c.id, c.contractNumber)}
                          disabled={downloadingDocId === `contract-${c.id}`}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5 text-[#0E4B94]" />
                          {downloadingDocId === `contract-${c.id}` ? "Đang tải..." : (language === "vi" ? "Tải PDF Hợp đồng ICC" : "Download ICC PDF")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDownloadPi(c.rfqRequestId, c.rfqNumber)}
                          disabled={downloadingDocId === `pi-${c.rfqRequestId}`}
                          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          {downloadingDocId === `pi-${c.rfqRequestId}` ? "Đang tải..." : (language === "vi" ? "Tải Proforma Invoice" : "Download P/I")}
                        </button>
                        <Link
                          href={`/portal?rfqId=${c.rfqRequestId}`}
                          className="px-4 py-2 rounded-xl bg-[#0E4B94] hover:bg-[#0B3D78] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {language === "vi" ? "Mở phòng ký điện tử" : "Open Negotiation"}
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <Pagination
                  currentPage={contractPage}
                  pageSize={contractPageSize}
                  totalItems={contractsList.length}
                  onPageChange={setContractPage}
                  onPageSizeChange={(newSize) => {
                    setContractPageSize(newSize);
                    setContractPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
          </div>
        )}

        {/* TAB: B2B PAYMENT SLIPS */}
        {activeTab === "payments" && isB2b && (
          <div className="space-y-4">
            {isLoadingB2bData ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
                {language === "vi" ? "Đang tải lịch sử thanh toán & ủy nhiệm chi..." : "Loading wire transfer slips..."}
              </div>
            ) : paymentSlips.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 space-y-3">
                <CreditCard className="w-10 h-10 text-slate-300 mx-auto" />
                <p>
                  {language === "vi"
                    ? "Bạn chưa có ủy nhiệm chi nào được tải lên hệ thống."
                    : "No wire transfer payment slips submitted yet."}
                </p>
                <Link
                  href="/portal"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0E4B94] text-white text-xs font-semibold hover:bg-[#0B3D78] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {language === "vi" ? "Tới Cổng B2B để nộp Ủy nhiệm chi" : "Go to B2B Portal to Submit Slip"}
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {paginatedPaymentSlips.map((slip, sIdx) => {
                    const status = slip.status || slip.verificationStatus || "PENDING";
                    const isApproved = status === "VERIFIED" || status === "APPROVED";
                    const isPending = status === "PENDING" || status === "PENDING_VERIFICATION";
                    return (
                      <div 
                        key={slip.id ?? `slip-${sIdx}`}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:border-blue-200 transition-all space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-base font-mono">{slip.swiftReference || `SLIP-#${slip.id}`}</span>
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                isApproved
                                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                  : isPending
                                  ? "bg-amber-50 text-amber-800 border border-amber-200"
                                  : "bg-red-50 text-red-800 border border-red-200"
                              }`}>
                                {isApproved
                                  ? (language === "vi" ? "Kế toán đã duyệt" : "Verified")
                                  : isPending
                                  ? (language === "vi" ? "Đang chờ đối soát" : "Pending")
                                  : (language === "vi" ? "Từ chối" : "Rejected")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {language === "vi" ? "RFQ tham chiếu" : "RFQ Ref"}: <span className="font-medium text-slate-700">{slip.rfqNumber || `RFQ #${slip.rfqId}`}</span>
                              {slip.submittedAt && ` · ${new Date(slip.submittedAt).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}`}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">{language === "vi" ? "Số tiền nộp" : "Amount"}</p>
                            <p className="text-lg font-bold text-[#0E4B94]">
                              {formatPrice(slip.amountUsd)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl">
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wider">{language === "vi" ? "Đợt thanh toán" : "Payment Stage"}</span>
                            <span className="font-bold text-slate-800">{slip.paymentStage}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wider">{language === "vi" ? "Phương thức" : "Method"}</span>
                            <span className="font-semibold text-slate-800">{slip.paymentMethod || "T/T Wire"}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block uppercase tracking-wider">{language === "vi" ? "Chứng từ đính kèm" : "Proof Document"}</span>
                            {slip.bankSlipFileUrl ? (
                              <a 
                                href={slip.bankSlipFileUrl} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                {language === "vi" ? "Xem file Ủy nhiệm chi" : "View Bank Slip File"}
                              </a>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Pagination
                  currentPage={paymentPage}
                  pageSize={paymentPageSize}
                  totalItems={paymentSlips.length}
                  onPageChange={setPaymentPage}
                  onPageSizeChange={(newSize) => {
                    setPaymentPageSize(newSize);
                    setPaymentPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
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
            ) : (
              <>
                {paginatedOrders.map((order, orderIndex) => (
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

                <Pagination
                  currentPage={orderPage}
                  pageSize={orderPageSize}
                  totalItems={orders.length}
                  onPageChange={setOrderPage}
                  onPageSizeChange={(newSize) => {
                    setOrderPageSize(newSize);
                    setOrderPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
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
            ) : (
              <>
                {paginatedRfqs.map((rfq, rfqIndex) => (
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

                <Pagination
                  currentPage={rfqPage}
                  pageSize={rfqPageSize}
                  totalItems={rfqs.length}
                  onPageChange={setRfqPage}
                  onPageSizeChange={(newSize) => {
                    setRfqPageSize(newSize);
                    setRfqPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                />
              </>
            )}
          </div>
        )}
        {activeTab === "addresses" && canManageAddresses && <AddressBookPanel />}
      </div>
    </div>
  );
}
