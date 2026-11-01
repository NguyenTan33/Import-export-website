"use client";

import React, { Suspense, useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useSearchParams } from "next/navigation";
import { RfqForm } from "@/components/portal/RfqForm";
import { Pagination } from "@/components/common/Pagination";
import {
  Product,
  RfqRequestDto,
  SalesContract,
  RfqCounterOffer,
  SubmitCounterOfferRequest,
  B2BPaymentSlip,
} from "@/types";
import {
  catalogApi,
  rfqApi,
  documentsApi,
  contractsApi,
  paymentsApi,
} from "@/services/api";
import {
  MessageSquare,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Download,
  Eye,
  FileSignature,
  GitCompare,
  X,
  DollarSign,
  Clock,
  FileText,
  XCircle,
  Box,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { NegotiationChatModal } from "@/components/portal/NegotiationChatModal";
import { PdfPreviewModal } from "@/components/admin/PdfPreviewModal";
import { SalesContractViewer } from "@/components/portal/SalesContractViewer";
import { CounterOfferTimeline } from "@/components/portal/CounterOfferTimeline";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

const getEffectiveRfqTotal = (rfq?: RfqRequestDto | null): number => {
  if (!rfq) return 0;
  if (rfq.totalQuotedAmountUsd && rfq.totalQuotedAmountUsd > 0) {
    return rfq.totalQuotedAmountUsd;
  }
  const itemsSubtotal = rfq.items?.reduce((sum, it) => {
    const price = it.quotedUnitPriceUsd || it.targetPriceUsd || 0;
    return sum + price * it.quantity;
  }, 0) || 0;
  return itemsSubtotal + (rfq.oceanFreightCostUsd || 0) + (rfq.marineInsuranceCostUsd || 0);
};

function PortalContent() {
  const searchParams = useSearchParams();
  const initialProductIdParam = searchParams?.get("productId")
    ? Number(searchParams.get("productId"))
    : undefined;
  const initialQuantityParam = searchParams?.get("quantity")
    ? Number(searchParams.get("quantity"))
    : undefined;

  const [activeTab, setActiveTab] = useState<"create" | "list" | "payment">("create");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  const [isLoadingRfqs, setIsLoadingRfqs] = useState(true);
  const [rfqRefreshKey, setRfqRefreshKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Negotiation Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeRfqForChat, setActiveRfqForChat] = useState<RfqRequestDto | null>(null);

  // PDF Preview Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfRfqId, setPdfRfqId] = useState<number>(0);

  // E-Contract & Negotiation States
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<SalesContract | null>(null);
  const [counterOfferModalOpen, setCounterOfferModalOpen] = useState(false);
  const [activeRfqForNegotiate, setActiveRfqForNegotiate] = useState<RfqRequestDto | null>(null);
  const [offersForActiveRfq, setOffersForActiveRfq] = useState<RfqCounterOffer[]>([]);
  const [isSigningBuyer, setIsSigningBuyer] = useState(false);

  const { language } = useLanguage();
  const { isAuthenticated, isLoading: isAuthLoading, user } = useAuth();
  const isVi = language === "vi";

  const [rfqs, setRfqs] = useState<RfqRequestDto[]>([]);
  const [rfqPage, setRfqPage] = useState<number>(1);
  const [rfqPageSize, setRfqPageSize] = useState<number>(5);

  // B2B T/T & L/C Payment Slip State
  const [selectedPaymentRfqId, setSelectedPaymentRfqId] = useState<number>(0);
  const [paymentStage, setPaymentStage] = useState<"DEPOSIT_30" | "BALANCE_70">("DEPOSIT_30");
  const [paymentMethod, setPaymentMethod] = useState<"T_T" | "L_C">("T_T");
  const [paymentAmountUsd, setPaymentAmountUsd] = useState<number>(0);
  const [swiftReference, setSwiftReference] = useState<string>("");
  const [selectedSlipFile, setSelectedSlipFile] = useState<File | null>(null);
  const [uploadedSlipUrl, setUploadedSlipUrl] = useState<string>("");
  const [isUploadingSlip, setIsUploadingSlip] = useState<boolean>(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState<boolean>(false);
  const [paymentSlips, setPaymentSlips] = useState<B2BPaymentSlip[]>([]);
  const [slipPage, setSlipPage] = useState<number>(1);
  const [slipPageSize, setSlipPageSize] = useState<number>(5);

  useEffect(() => {
    let cancelled = false;
    catalogApi.getProducts(undefined, undefined, language)
      .then((list) => { if (!cancelled) setAvailableProducts(Array.isArray(list) ? list : []); })
      .catch(() => { if (!cancelled) setAvailableProducts([]); });

    if (isAuthLoading) return () => { cancelled = true; };
    if (!isAuthenticated) {
      setRfqs([]);
      setPaymentSlips([]);
      setIsLoadingRfqs(false);
      return () => { cancelled = true; };
    }

    setIsLoadingRfqs(true);
    setErrorMessage(null);
    rfqApi.getMyRfqs()
      .then(async (loadedRfqs) => {
        if (cancelled) return;
        const safeRfqs = Array.isArray(loadedRfqs) ? loadedRfqs : [];
        setRfqs(safeRfqs);
        const firstPayableRfq = safeRfqs.find((rfq) => Number.isFinite(rfq.id) && (rfq.id ?? 0) > 0);
        if (firstPayableRfq?.id) {
          setSelectedPaymentRfqId(firstPayableRfq.id);
          setPaymentAmountUsd(Number((getEffectiveRfqTotal(firstPayableRfq) * 0.3).toFixed(2)));
        } else {
          setSelectedPaymentRfqId(0);
          setPaymentAmountUsd(0);
        }
        const slipsByRfq = await Promise.all(
          safeRfqs.filter((rfq) => rfq.id).map((rfq) => paymentsApi.getB2BPaymentsByRfq(rfq.id!)),
        );
        if (!cancelled) setPaymentSlips(slipsByRfq.flat());
      })
      .catch(() => {
        if (!cancelled) {
          setRfqs([]);
          setPaymentSlips([]);
          setErrorMessage(isVi ? "Không thể tải danh sách RFQ. Vui lòng thử lại." : "Could not load RFQs. Please try again.");
        }
      })
      .finally(() => { if (!cancelled) setIsLoadingRfqs(false); });

    return () => { cancelled = true; };
  }, [language, isAuthLoading, isAuthenticated, rfqRefreshKey, isVi]);

  const handleSelectRfqForPayment = (rfqId: number, stage: "DEPOSIT_30" | "BALANCE_70" = paymentStage) => {
    setSelectedPaymentRfqId(rfqId);
    setPaymentStage(stage);
    const targetRfq = rfqs.find((r) => r.id === rfqId);
    const totalUsd = getEffectiveRfqTotal(targetRfq);
    const ratio = stage === "DEPOSIT_30" ? 0.3 : 0.7;
    setPaymentAmountUsd(Number((totalUsd * ratio).toFixed(2)));
  };

  const handleSlipFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedSlipUrl("");
    setErrorMessage(null);
    setSelectedSlipFile(file);
    setIsUploadingSlip(true);
    try {
      const uploaded = await paymentsApi.uploadBankSlipFile(file);
      if (uploaded?.fileUrl) {
        setUploadedSlipUrl(uploaded.fileUrl);
      } else {
        setErrorMessage(isVi ? "Máy chủ không trả về đường dẫn chứng từ." : "The server did not return a file URL.");
      }
    } catch {
      setErrorMessage(isVi ? "Không thể tải chứng từ lên máy chủ." : "Could not upload the payment document.");
    } finally {
      setIsUploadingSlip(false);
    }
  };

  const handleSubmitPaymentSlip = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetRfq = rfqs.find((r) => r.id === selectedPaymentRfqId);
    if (!targetRfq || !uploadedSlipUrl || paymentAmountUsd <= 0 || !swiftReference.trim()) {
      setErrorMessage(isVi ? "Chọn yêu cầu báo giá, tải chứng từ và nhập mã tham chiếu hợp lệ trước khi gửi." : "Select an RFQ, upload the bank slip, and enter a valid reference before submitting.");
      return;
    }
    setIsSubmittingPayment(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const created = await paymentsApi.submitBankSlip({
        rfqId: selectedPaymentRfqId,
        paymentStage,
        paymentMethod,
        amountUsd: paymentAmountUsd,
        swiftReference,
        bankSlipFileUrl: uploadedSlipUrl,
      });
      setPaymentSlips((prev) => [created, ...prev]);
      setSuccessMessage(isVi ? "Đã gửi chứng từ thanh toán lên máy chủ." : "Payment document submitted to the server.");
    } catch {
      setErrorMessage(isVi ? "Không thể gửi chứng từ. Vui lòng thử lại." : "Could not submit the payment document. Please try again.");
    } finally {
      setIsSubmittingPayment(false);
      setSelectedSlipFile(null);
    }
  };

  const handleCreateRfq = async (payload: RfqRequestDto) => {
    if (!isAuthenticated) {
      setErrorMessage(isVi ? "Vui lòng đăng nhập trước khi gửi yêu cầu báo giá." : "Please sign in before submitting an RFQ.");
      return;
    }
    if (user?.isDemo) {
      setErrorMessage(isVi
        ? "Tài khoản dùng thử không có phiên đăng nhập trên máy chủ. Vui lòng đăng xuất và đăng nhập bằng tài khoản B2B đã đăng ký để gửi RFQ."
        : "Demo accounts are not authenticated on the server. Sign out and use a registered B2B account to submit an RFQ.");
      return;
    }
    if (user?.role === "B2C_CUSTOMER") {
      setErrorMessage(isVi ? "Tính năng RFQ yêu cầu tài khoản doanh nghiệp B2B." : "RFQ submission requires a B2B business account.");
      return;
    }
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      const createdRfq = await rfqApi.createRfq(payload);
      if (!createdRfq.rfqNumber) {
        throw new Error("The server returned an incomplete RFQ.");
      }
      setRfqs((previous) => [createdRfq, ...previous]);
      setIsLoadingRfqs(false);
      setSuccessMessage(isVi ? `Tạo đơn RFQ thành công với mã: ${createdRfq.rfqNumber}` : `Successfully created RFQ ${createdRfq.rfqNumber}.`);
      setActiveTab("list");
    } catch (error) {
      const responseData = axios.isAxiosError(error) ? error.response?.data : undefined;
      const apiMessage = responseData && typeof responseData === "object"
        ? ("message" in responseData && typeof responseData.message === "string" ? responseData.message : undefined)
          || ("errors" in responseData && Array.isArray(responseData.errors) ? responseData.errors.filter((item: unknown): item is string => typeof item === "string").join(" ") : undefined)
        : undefined;
      const message = apiMessage
        || (axios.isAxiosError(error) && error.code === "ECONNABORTED"
          ? (isVi ? "Máy chủ xử lý quá lâu. Vui lòng thử lại." : "The server took too long to respond. Please try again.")
          : (isVi ? "Không thể tạo RFQ trên máy chủ. Vui lòng kiểm tra thông tin doanh nghiệp, sản phẩm và số lượng tối thiểu (MOQ)." : "Could not create the RFQ. Check your business profile, selected products, and minimum order quantities (MOQ)."));
      setErrorMessage(message);
    } finally { setIsSubmitting(false); }
  };

  const handleOpenChat = (rfq: RfqRequestDto) => {
    if (!rfq.id) {
      setErrorMessage(isVi ? "RFQ này chưa có ID hợp lệ để mở phòng đàm phán." : "This RFQ has no valid ID for negotiation.");
      return;
    }
    setActiveRfqForChat(rfq);
    setChatModalOpen(true);
  };

  const handleOpenPdfPreview = (rfqId?: number) => {
    if (!rfqId) {
      setErrorMessage(isVi ? "RFQ không có ID hợp lệ để xem hóa đơn." : "This RFQ has no valid ID for invoice preview.");
      return;
    }
    setPdfRfqId(rfqId);
    setPdfModalOpen(true);
  };

  const handlePriceAgreed = () => {
    if (!activeRfqForChat?.id) return;
    void rfqApi.getRfqById(activeRfqForChat.id).then((updated) => {
      setRfqs((previous) => previous.map((rfq) => rfq.id === updated.id ? updated : rfq));
    }).catch(() => setErrorMessage(isVi ? "Không thể làm mới dữ liệu RFQ." : "Could not refresh the RFQ."));
  };

  const handleDownloadPi = async (rfqId?: number) => {
    if (!rfqId) {
      setErrorMessage(isVi ? "RFQ không có ID hợp lệ để tải hóa đơn." : "This RFQ has no valid ID for invoice download.");
      return;
    }
    try {
      const blob = await documentsApi.downloadProformaInvoice(rfqId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Proforma_Invoice_RFQ_${rfqId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMessage(isVi ? "Không thể tải hóa đơn từ máy chủ." : "Could not download the invoice from the server.");
    }
  };

  // E-Contract & Negotiation Handlers (EXP-80 -> 89)
  const handleOpenNegotiateModal = async (rfq: RfqRequestDto) => {
    if (!rfq.id) {
      setErrorMessage(isVi ? "RFQ không có ID hợp lệ để mở đàm phán." : "This RFQ has no valid ID for negotiation.");
      return;
    }
    setActiveRfqForNegotiate(rfq);
    setCounterOfferModalOpen(true);
    try {
      setOffersForActiveRfq(await contractsApi.getCounterOffers(rfq.id));
    } catch {
      setOffersForActiveRfq([]);
      setErrorMessage(isVi ? "Không thể tải lịch sử đàm phán." : "Could not load the negotiation history.");
    }
  };

  const handleSubmitBuyerCounterOffer = async (payload: SubmitCounterOfferRequest) => {
    if (!activeRfqForNegotiate) return;
    if (!activeRfqForNegotiate.id) return;
    try {
      const created = await contractsApi.submitCounterOffer(activeRfqForNegotiate.id, payload, "BUYER");
      setOffersForActiveRfq((prev) => [...prev, created]);
      setSuccessMessage(isVi ? "Đã gửi đề xuất thương lượng." : "Counter-offer submitted.");
    } catch {
      setErrorMessage(isVi ? "Không thể gửi đề xuất thương lượng." : "Could not submit the counter-offer.");
    }
  };

  const handleAcceptBuyerCounterOffer = async (offerId: number) => {
    if (!activeRfqForNegotiate) return;
    if (!activeRfqForNegotiate.id) return;
    try {
      await contractsApi.acceptCounterOffer(activeRfqForNegotiate.id, offerId);
      setOffersForActiveRfq((prev) => prev.map((offer) => offer.id === offerId ? { ...offer, status: "ACCEPTED" } : offer));
      setSuccessMessage(isVi ? "Đã chấp nhận đề xuất." : "Counter-offer accepted.");
    } catch {
      setErrorMessage(isVi ? "Không thể chấp nhận đề xuất." : "Could not accept the counter-offer.");
    }
  };

  const handleOpenContractModal = async (rfq: RfqRequestDto) => {
    if (!rfq.id) {
      setErrorMessage(isVi ? "RFQ không có ID hợp lệ để mở hợp đồng." : "This RFQ has no valid ID for the contract.");
      return;
    }
    try {
      const contract = await contractsApi.getContractByRfqId(rfq.id);
      if (!contract) throw new Error("No contract found for this RFQ.");
      setSelectedContract(contract);
      setContractModalOpen(true);
    } catch {
      setErrorMessage(isVi ? "Chưa có hợp đồng trên máy chủ cho yêu cầu này." : "No contract exists on the server for this RFQ yet.");
    }
  };

  const handleBuyerSignContract = async (
    signatureData: string,
    signerName: string,
    signerTitle: string
  ) => {
    if (!selectedContract) return;
    setIsSigningBuyer(true);
    try {
      const updated = await contractsApi.signContractBuyer(selectedContract.id, {
        signerName,
        signerTitle,
        signatureData,
      });
      setSelectedContract(updated);
      setSuccessMessage("Đại diện Bên Mua đã hoàn tất ký điện tử hợp đồng ngoại thương!");
    } catch {
      setErrorMessage(isVi ? "Không thể lưu chữ ký vào hợp đồng." : "Could not save the signature to the contract.");
    } finally {
      setIsSigningBuyer(false);
    }
  };

  const handleBuyerDownloadPdf = async () => {
    if (!selectedContract) return;
    try {
      const blob = await contractsApi.downloadContractPdf(selectedContract.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Sales_Contract_${selectedContract.contractNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setErrorMessage(isVi ? "Không thể tải hợp đồng từ máy chủ." : "Could not download the contract from the server.");
    }
  };

  const paginatedRfqs = useMemo(() => {
    return rfqs.slice(
      (rfqPage - 1) * rfqPageSize,
      rfqPage * rfqPageSize
    );
  }, [rfqs, rfqPage, rfqPageSize]);

  const paginatedSlips = useMemo(() => {
    return paymentSlips.slice(
      (slipPage - 1) * slipPageSize,
      slipPage * slipPageSize
    );
  }, [paymentSlips, slipPage, slipPageSize]);

  if (user?.role === "B2C_CUSTOMER") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center space-y-6">
        <div className="w-16 h-16 bg-blue-50 text-[#0E4B94] rounded-2xl flex items-center justify-center mx-auto border border-blue-200">
          <FileText className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            {isVi ? "Cổng Báo Giá B2B dành cho Doanh Nghiệp" : "B2B Portal is for Corporate Accounts"}
          </h1>
          <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            {isVi 
              ? "Bạn hiện đang đăng nhập bằng tài khoản Khách Mua Lẻ (B2C). Tính năng tạo yêu cầu báo giá sỉ RFQ, đàm phán hợp đồng quốc tế và nộp ủy nhiệm chi chỉ áp dụng cho tài khoản Doanh nghiệp B2B."
              : "You are currently signed in as a Retail Customer (B2C). Wholesale RFQs, trade contract negotiation, and wire slip submissions are restricted to B2B Corporate Accounts."}
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-[#0E4B94] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0a376d] transition-all shadow-md"
          >
            {isVi ? "Quay lại Cửa hàng" : "Browse Retail Store"}
          </Link>
          <Link
            href="/profile"
            className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-200 transition-all border border-slate-300"
          >
            {isVi ? "Hồ sơ của tôi" : "My Profile"}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
            {isVi
              ? "CỔNG ĐỐI TÁC THƯƠNG MẠI QUỐC TẾ B2B • QUANG TẤN HOÀNG"
              : "GLOBAL B2B TRADE & IMPORTER PORTAL • QUANG TAN HOANG"}
          </span>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black mt-1">
            {isVi ? "Cổng Báo Giá & Đàm Phán Ngoại Thương B2B" : "B2B RFQ & Foreign Trade Portal"}
          </h1>
          <p className="text-xs text-neutral-600 mt-1 font-mono">
            {isVi
              ? "Hệ thống tiếp nhận yêu cầu báo giá quốc tế đa điều kiện Incoterms 2020, đàm phán trực tuyến SignalR và xuất hóa đơn Proforma Invoice."
              : "Automated quotation system supporting Incoterms 2020, real-time SignalR negotiation, and instant Proforma Invoice generation."}
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex border border-black bg-white rounded overflow-hidden">
          <button
            onClick={() => setActiveTab("create")}
            className={`px-4 py-2 text-xs font-bold uppercase transition-colors ${
              activeTab === "create" ? "bg-black text-white" : "text-black hover:bg-neutral-100"
            }`}
          >
            {isVi ? "Tạo Báo Giá Mới" : "Create New RFQ"}
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-4 py-2 text-xs font-bold uppercase border-l border-black transition-colors ${
              activeTab === "list" ? "bg-black text-white" : "text-black hover:bg-neutral-100"
            }`}
          >
            {isVi ? `Đơn của tôi (${rfqs.length})` : `My RFQs (${rfqs.length})`}
          </button>
          <button
            onClick={() => setActiveTab("payment")}
            className={`px-4 py-2 text-xs font-bold uppercase border-l border-black transition-colors ${
              activeTab === "payment" ? "bg-black text-white" : "text-black hover:bg-neutral-100"
            }`}
          >
            {isVi
              ? `Nộp Ủy nhiệm chi T/T (${paymentSlips.length})`
              : `T/T & L/C Wire Slips (${paymentSlips.length})`}
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="border border-emerald-600 bg-emerald-50 p-4 text-emerald-900 text-xs font-mono flex items-center justify-between gap-2 rounded">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div role="alert" className="border border-red-500 bg-red-50 p-4 text-red-900 text-xs font-mono flex items-center justify-between gap-2 rounded">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-red-700 hover:text-red-950" aria-label={isVi ? "Đóng thông báo lỗi" : "Dismiss error"}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab 1: Create RFQ */}
      {activeTab === "create" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RfqForm
                availableProducts={availableProducts}
                onSubmitRfq={handleCreateRfq}
                isSubmitting={isSubmitting}
                canSubmit={isAuthenticated && !isAuthLoading && !user?.isDemo}
                submissionPrompt={user?.isDemo
                  ? (isVi ? "Tài khoản dùng thử không đăng nhập được vào máy chủ. Hãy đăng nhập bằng tài khoản B2B đã đăng ký." : "Demo accounts cannot authenticate with the server. Sign in with a registered B2B account.")
                  : undefined}
                authHref={isAuthenticated ? "/register" : "/login?returnTo=%2Fportal"}
                initialProductId={initialProductIdParam}
                initialQuantity={initialQuantityParam}
              />
            </div>

            <div className="space-y-4">
              <div className="border border-black bg-neutral-50 p-4 space-y-3 rounded">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94] font-bold block">
                  {isVi ? "QUY TRÌNH XỬ LÝ RFQ" : "B2B WORKFLOW"}
                </span>
                <h3 className="text-sm font-bold text-black uppercase">
                  {isVi ? "4 Bước Giao thương Quốc tế" : "4-Step Foreign Trade Flow"}
                </h3>
                <ol className="text-xs space-y-2 text-neutral-600 list-decimal list-inside font-mono">
                  <li>
                    {isVi
                      ? "Khách hàng gửi bảng kê sản phẩm & điều kiện Incoterms."
                      : "Submit product manifest with preferred Incoterms rule."}
                  </li>
                  <li>
                    {isVi
                      ? "Hệ thống tự động tính toán CBM và đề xuất loại Container."
                      : "System automatically computes CBM volume and recommends container."}
                  </li>
                  <li>
                    {isVi
                      ? "Phòng Kinh doanh Quang Tấn Hoàng đàm phán chốt giá qua SignalR."
                      : "Quang Tan Hoang trade department negotiates final quote via SignalR."}
                  </li>
                  <li>
                    {isVi
                      ? "Ký Proforma Invoice & nộp điện chuyển tiền T/T đặt cọc."
                      : "Download Proforma Invoice & submit T/T bank transfer deposit slip."}
                  </li>
                </ol>
              </div>

              <div className="border border-neutral-300 bg-white p-4 space-y-2 text-xs rounded">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isVi ? "Bảo đảm pháp lý quốc tế" : "International Compliance Assurance"}</span>
                </div>
                <p className="text-neutral-500 font-mono text-[11px] leading-relaxed">
                  {isVi
                    ? "Quang Tấn Hoàng cam kết chứng từ hải quan hợp lệ: CO Form E/AK/EUR.1, Phyto, Fumigation và Test Report theo yêu cầu nước nhập khẩu."
                    : "Quang Tan Hoang guarantees compliant trade documentation: CO Form E/AK/EUR.1, Phytosanitary, Fumigation, and Lab Test Reports."}
                </p>
              </div>

              <div className="border border-black bg-[#0E4B94]/5 p-4 space-y-2.5 text-xs rounded">
                <div className="flex items-center gap-2 text-[#0E4B94] font-bold uppercase font-mono">
                  <Box className="w-4 h-4 shrink-0" />
                  <span>
                    {isVi
                      ? "Mô phỏng 3D Container & Tính Thuế FTA"
                      : "3D Container & FTA Landed Cost"}
                  </span>
                </div>
                <p className="text-neutral-600 font-mono text-[11px] leading-relaxed">
                  {isVi
                    ? "Trực quan hóa cách xếp kiện hàng vào Container 20GP/40HC bằng 3D WebGL và tính toán biểu thuế ưu đãi C/O tại trang công cụ chuyên biệt."
                    : "Simulate 3D WebGL container stowage and FTA preferential customs duties on our dedicated logistics planner."}
                </p>
                <Link
                  href="/cbm-calculator"
                  className="inline-flex items-center gap-1.5 bg-[#0E4B94] hover:bg-black text-white text-[11px] font-mono font-bold uppercase px-3 py-2 rounded transition-colors"
                >
                  <span>
                    {isVi ? "Mở Công cụ Mô phỏng CBM & Thuế" : "Open 3D CBM & FTA Calculator"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: RFQ List */}
      {activeTab === "list" && (
        <div className="border border-black bg-white p-6 space-y-6 rounded">
          <div className="border-b border-black pb-3 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                ACTIVE B2B QUOTATIONS
              </span>
              <h2 className="text-xl font-black uppercase tracking-tight text-black">
                {isVi ? "Danh sách Đơn yêu cầu báo giá (RFQs)" : "Active RFQ Inquiries & Quotations"}
              </h2>
            </div>
            <span className="text-xs font-mono bg-neutral-100 border border-black px-2.5 py-1 rounded">
              {isVi ? `Tổng số: ${rfqs.length} đơn` : `Total: ${rfqs.length} inquiries`}
            </span>
          </div>

          {isAuthLoading || isLoadingRfqs ? (
            <p className="border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
              {isVi ? "Đang tải danh sách RFQ..." : "Loading RFQs..."}
            </p>
          ) : !isAuthenticated ? (
            <div className="border border-amber-300 bg-amber-50 p-6 text-center text-sm text-amber-900">
              <p>{isVi ? "Đăng nhập để xem các yêu cầu báo giá của bạn." : "Sign in to view your RFQs."}</p>
              <Link href="/login?returnTo=%2Fportal" className="mt-3 inline-block font-bold underline">
                {isVi ? "Đăng nhập" : "Sign in"}
              </Link>
            </div>
          ) : rfqs.length === 0 ? (
            <div className="border border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-600">
              <p>{isVi ? "Chưa có RFQ nào. Hãy tạo yêu cầu báo giá mới." : "No RFQs yet. Create a new quotation request to get started."}</p>
              <button type="button" onClick={() => setRfqRefreshKey((key) => key + 1)} className="mt-3 font-bold text-[#0E4B94] underline">
                {isVi ? "Tải lại" : "Retry"}
              </button>
            </div>
          ) : null}

          <div className="space-y-4">
            {paginatedRfqs.map((rfq, index) => (
              <div key={rfq.id ?? rfq.rfqNumber ?? `rfq-${index}`} className="border border-black p-4 bg-white space-y-3 shadow-sm hover:border-[#0E4B94] transition-colors rounded">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-neutral-200 pb-2">
                  <div>
                    <span className="text-xs font-mono font-black text-[#0E4B94]">
                      {rfq.rfqNumber}
                    </span>
                    <h3 className="text-sm font-bold text-black">{rfq.companyName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 uppercase font-bold border rounded ${
                        rfq.status === "AGREED" || rfq.status === "IN_PRODUCTION"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                          : rfq.status === "QUOTED"
                          ? "bg-blue-100 text-blue-800 border-blue-400"
                          : "bg-neutral-100 text-neutral-800 border-neutral-300"
                      }`}
                    >
                      {rfq.status === "IN_PRODUCTION"
                        ? (isVi ? "Đang sản xuất" : "In Production")
                        : rfq.status === "AGREED"
                        ? (isVi ? "Đã chốt giá ưu đãi" : "Price Agreed")
                        : rfq.status === "QUOTED"
                        ? (isVi ? "Đã có báo giá" : "Formal Quote Ready")
                        : (isVi ? "Đang xử lý" : "Under Review")}
                    </span>
                    <span className="bg-black text-white text-[10px] font-mono px-2 py-0.5 uppercase rounded">
                      Incoterm: {rfq.incotermCode}
                    </span>
                  </div>
                </div>

                {/* Logistics details */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono bg-neutral-50 p-2.5 border border-neutral-200 rounded">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      {isVi ? "CẢNG XUẤT (POL):" : "POL:"}
                    </span>
                    <span className="font-semibold truncate block">{rfq.portOfLoading}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      {isVi ? "CẢNG ĐẾN (POD):" : "POD:"}
                    </span>
                    <span className="font-semibold truncate block">{rfq.portOfDischarge}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      {isVi ? "TỔNG THỂ TÍCH (CBM):" : "TOTAL VOLUME (CBM):"}
                    </span>
                    <span className="font-semibold">{rfq.totalCbm?.toFixed(1)} m³</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase">
                      {isVi ? "TRỌNG LƯỢNG (GW):" : "GROSS WEIGHT (GW):"}
                    </span>
                    <span className="font-semibold">{rfq.totalGrossWeightKg?.toLocaleString()} kg</span>
                  </div>
                </div>

                {/* Line Items Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs font-mono pt-1">
                  <div>
                    <span className="text-neutral-500">
                      {isVi ? "Số lượng mặt hàng:" : "Line items:"}
                    </span>{" "}
                    <strong>{rfq.items?.length || 0} {isVi ? "loại" : "items"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">
                      {isVi ? "Container đề xuất:" : "Suggested Container:"}
                    </span>{" "}
                    <strong className="text-[#0E4B94]">{rfq.suggestedContainerType || "40HC"}</strong>
                  </div>
                  <div className="text-right font-black text-black text-sm">
                    {isVi ? "Tổng tiền báo giá: " : "Quotation Subtotal: "}
                    <span className="text-[#0E4B94]">${getEffectiveRfqTotal(rfq).toLocaleString("en-US")} USD</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-neutral-100">
                  <button
                    onClick={() => {
                      if (!rfq.id) {
                        setErrorMessage(isVi ? "RFQ không có ID hợp lệ." : "This RFQ has no valid ID.");
                        return;
                      }
                      handleSelectRfqForPayment(rfq.id, "DEPOSIT_30");
                      setActiveTab("payment");
                    }}
                    className="flex items-center gap-1.5 border border-emerald-600 bg-emerald-50 px-3.5 py-1.5 text-xs font-bold uppercase text-emerald-900 hover:bg-emerald-100 transition-colors shadow-sm rounded"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isVi ? "Nộp Ủy Nhiệm Chi T/T" : "Submit T/T Deposit"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenNegotiateModal(rfq)}
                    className="flex items-center gap-1.5 border border-indigo-600 bg-indigo-50 px-3.5 py-1.5 text-xs font-bold uppercase text-indigo-900 hover:bg-indigo-100 transition-colors shadow-sm rounded"
                  >
                    <GitCompare className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{isVi ? "Đàm phán Đa Vòng" : "Counter-Offer Engine"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenContractModal(rfq)}
                    className="flex items-center gap-1.5 border border-blue-600 bg-blue-50 px-3.5 py-1.5 text-xs font-bold uppercase text-blue-900 hover:bg-blue-100 transition-colors shadow-sm rounded"
                  >
                    <FileSignature className="w-3.5 h-3.5 text-blue-600" />
                    <span>{isVi ? "Ký Hợp Đồng Điện Tử" : "Sign E-Contract"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenChat(rfq)}
                    className="flex items-center gap-1.5 border border-black bg-white px-3.5 py-1.5 text-xs font-bold uppercase text-black hover:bg-neutral-100 transition-colors shadow-sm rounded"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#0E4B94]" />
                    <span>{isVi ? "Đàm phán Realtime (SignalR)" : "Negotiate via SignalR"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenPdfPreview(rfq.id)}
                    className="flex items-center gap-1.5 border border-[#0E4B94] bg-white px-3.5 py-1.5 text-xs font-bold uppercase text-[#0E4B94] hover:bg-blue-50 transition-colors shadow-sm rounded"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isVi ? "Xem trước PI (PDF)" : "Preview Proforma Invoice"}</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPi(rfq.id)}
                    className="flex items-center gap-1.5 bg-black px-3.5 py-1.5 text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors shadow-sm rounded"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isVi ? "Tải Proforma Invoice" : "Download PI (PDF)"}</span>
                  </button>
                </div>
              </div>
            ))}

            {rfqs.length > 0 && (
              <div className="border border-neutral-200 rounded overflow-hidden shadow-sm">
                <Pagination
                  currentPage={rfqPage}
                  totalItems={rfqs.length}
                  pageSize={rfqPageSize}
                  onPageChange={setRfqPage}
                  onPageSizeChange={(newSize) => {
                    setRfqPageSize(newSize);
                    setRfqPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  isVi={isVi}
                  itemLabel={isVi ? "yêu cầu RFQ" : "RFQs"}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Upload Bank Slip PDF & Track Reconciliation */}
      {activeTab === "payment" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Upload & Submit T/T or L/C Wire Slip Form */}
          <form
            onSubmit={handleSubmitPaymentSlip}
            className="lg:col-span-5 border border-black bg-white p-6 space-y-5 rounded shadow-sm"
          >
            <div className="border-b border-neutral-200 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
                INTERNATIONAL WIRE TRANSFER (EXP-24, EXP-60)
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight text-black mt-0.5">
                {isVi
                  ? "Nộp Chứng Từ Ủy Nhiệm Chi T/T & L/C"
                  : "Submit T/T SWIFT MT103 / L/C Slip"}
              </h2>
              <p className="text-xs text-neutral-600 mt-1">
                {isVi
                  ? "Tải lên điện chuyển tiền SWIFT MT103 đặt cọc 30% hoặc tất toán 70% để Phòng Kế toán đối soát và kích hoạt lệnh sản xuất."
                  : "Upload official SWIFT MT103 confirmation slip for 30% deposit or 70% balance settlement."}
              </p>
            </div>

            <div className="space-y-4 text-xs font-mono">
              {/* Select RFQ */}
              <div>
                <label className="block font-bold uppercase text-neutral-700 mb-1">
                  {isVi ? "Chọn Đơn Báo Giá / Hợp Đồng (RFQ) *" : "Select Quotation / Contract (RFQ) *"}
                </label>
                <select
                  value={selectedPaymentRfqId}
                  onChange={(e) => handleSelectRfqForPayment(Number(e.target.value))}
                  className="w-full border border-black p-2.5 rounded bg-white focus:outline-none"
                >
                  {rfqs.map((r, index) => (
                    <option key={r.id ?? r.rfqNumber ?? `payment-rfq-${index}`} value={r.id ?? ""}>
                      {r.rfqNumber} — ${getEffectiveRfqTotal(r).toLocaleString("en-US")} USD ({r.incotermCode})
                    </option>
                  ))}
                </select>
              </div>

              {/* Stage & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    {isVi ? "Giai đoạn thanh toán *" : "Payment Stage *"}
                  </label>
                  <select
                    value={paymentStage}
                    onChange={(e) =>
                      handleSelectRfqForPayment(
                        selectedPaymentRfqId,
                        e.target.value as "DEPOSIT_30" | "BALANCE_70"
                      )
                    }
                    className="w-full border border-black p-2.5 rounded bg-white focus:outline-none"
                  >
                    <option value="DEPOSIT_30">
                      {isVi ? "Đặt cọc 30% (Deposit)" : "30% Advance Deposit"}
                    </option>
                    <option value="BALANCE_70">
                      {isVi ? "Tất toán 70% (Balance B/L)" : "70% Balance against B/L"}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    {isVi ? "Phương thức *" : "Payment Method *"}
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as "T_T" | "L_C")}
                    className="w-full border border-black p-2.5 rounded bg-white focus:outline-none"
                  >
                    <option value="T_T">T/T (SWIFT Wire Transfer)</option>
                    <option value="L_C">L/C (Irrevocable Letter of Credit)</option>
                  </select>
                </div>
              </div>

              {/* Amount & SWIFT Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    {isVi ? "Số tiền chuyển (USD) *" : "Wire Amount (USD) *"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={paymentAmountUsd}
                    onChange={(e) => setPaymentAmountUsd(Number(e.target.value))}
                    className="w-full border border-black p-2.5 rounded focus:outline-none font-bold text-[#0E4B94]"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase text-neutral-700 mb-1">
                    {isVi ? "Mã tham chiếu SWIFT *" : "SWIFT MT103 Ref *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={swiftReference}
                    onChange={(e) => setSwiftReference(e.target.value)}
                    placeholder="SWIFT-MT103-..."
                    className="w-full border border-black p-2.5 rounded focus:outline-none"
                  />
                </div>
              </div>

              {/* File Upload */}
              <div className="border-2 border-dashed border-black p-5 text-center bg-neutral-50 space-y-2 rounded">
                <Upload className="w-6 h-6 text-[#0E4B94] mx-auto" />
                <div className="text-xs font-mono text-neutral-700">
                  {isVi
                    ? "Đính kèm bản scan Ủy nhiệm chi / Điện SWIFT MT103 (.pdf, .png, .jpg)"
                    : "Attach scanned Bank Wire Slip / SWIFT MT103 (.pdf, .png, .jpg)"}
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleSlipFileChange}
                  className="text-xs font-mono block w-full text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border file:border-black file:text-xs file:font-bold file:bg-white file:text-black hover:file:bg-neutral-100"
                />
                {isUploadingSlip && (
                  <p className="text-[11px] text-blue-600 font-bold">
                    {isVi ? "Đang tải chứng từ lên máy chủ..." : "Uploading slip to server..."}
                  </p>
                )}
                {selectedSlipFile && !isUploadingSlip && (
                  <p className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {selectedSlipFile.name} ({Math.round(selectedSlipFile.size / 1024)} KB)
                    </span>
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmittingPayment || isUploadingSlip}
                className="w-full bg-[#0E4B94] hover:bg-[#0a376d] text-white py-3 rounded font-black text-xs uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmittingPayment
                  ? isVi
                    ? "Đang gửi chứng từ thanh toán..."
                    : "Submitting Wire Slip..."
                  : isVi
                  ? "Xác nhận Nộp Ủy nhiệm chi Quốc tế"
                  : "Submit Official Wire Transfer Slip"}
              </button>
            </div>
          </form>

          {/* Right Column: Payment History & Verification Status */}
          <div className="lg:col-span-7 border border-black bg-white p-6 space-y-4 rounded shadow-sm">
            <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
                  WIRE TRANSFER LEDGER
                </span>
                <h3 className="text-base font-black uppercase tracking-tight text-black">
                  {isVi
                    ? "Lịch sử Ủy nhiệm chi & Trạng thái Đối soát Kế toán"
                    : "Submitted T/T & L/C Wire Slips"}
                </h3>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-[#0E4B94] font-bold px-2.5 py-1 rounded border border-blue-200">
                {paymentSlips.length} {isVi ? "giao dịch" : "records"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">RFQ / Stage</th>
                    <th className="py-2.5 px-3">{isVi ? "Số tiền (USD)" : "Amount"}</th>
                    <th className="py-2.5 px-3">SWIFT Reference</th>
                    <th className="py-2.5 px-3">{isVi ? "Trạng thái" : "Status"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {paginatedSlips.map((slip, index) => (
                    <tr key={slip.id ?? `${slip.rfqId}-${index}`} className="hover:bg-neutral-50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-[#0E4B94]">
                          {slip.rfqNumber || `RFQ #${slip.rfqId}`}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          {slip.paymentMethod} •{" "}
                          {slip.paymentStage === "DEPOSIT_30"
                            ? isVi
                              ? "Đặt cọc 30%"
                              : "30% Deposit"
                            : isVi
                            ? "Tất toán 70%"
                            : "70% Balance"}
                        </div>
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-700">
                        ${slip.amountUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-neutral-900">{slip.swiftReference}</div>
                        <div className="text-[10px] text-neutral-400">
                          {new Date(slip.submittedAt || slip.createdAt || Date.now()).toLocaleDateString(isVi ? "vi-VN" : "en-US")}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        {(slip.verificationStatus || slip.status) === "VERIFIED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            {isVi ? "Đã Duyệt Cọc" : "Verified"}
                          </span>
                        ) : (slip.verificationStatus || slip.status) === "REJECTED" ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[10px]">
                            <XCircle className="w-3 h-3" />
                            {isVi ? "Từ Chối" : "Rejected"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                            <Clock className="w-3 h-3" />
                            {isVi ? "Chờ Kế Toán Đối Soát" : "Pending Audit"}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paymentSlips.length > 0 && (
                <Pagination
                  currentPage={slipPage}
                  totalItems={paymentSlips.length}
                  pageSize={slipPageSize}
                  onPageChange={setSlipPage}
                  onPageSizeChange={(newSize) => {
                    setSlipPageSize(newSize);
                    setSlipPage(1);
                  }}
                  pageSizeOptions={[5, 10, 20]}
                  isVi={isVi}
                  itemLabel={isVi ? "giao dịch" : "records"}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* SignalR Negotiation Chat Modal */}
      {activeRfqForChat && (
        <NegotiationChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          rfqNumber={activeRfqForChat.rfqNumber || "RFQ-2026-EXP"}
          rfqId={activeRfqForChat.id ?? 0}
          currentTotalUsd={getEffectiveRfqTotal(activeRfqForChat)}
          items={Array.isArray(activeRfqForChat.items) ? activeRfqForChat.items : []}
          onAcceptPrice={handlePriceAgreed}
        />
      )}

      {/* PDF Preview Modal for Proforma Invoice */}
      <PdfPreviewModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        documentType="PI"
        id={pdfRfqId}
      />

      {/* Multi-Round Counter-Offer Modal (EXP-80 -> 84) */}
      {counterOfferModalOpen && activeRfqForNegotiate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-neutral-300">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between sticky top-0 z-10 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <GitCompare className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Đàm phán Đa Vòng (Counter-Offer Engine) — {activeRfqForNegotiate.rfqNumber}
                </h3>
              </div>
              <button
                onClick={() => setCounterOfferModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <CounterOfferTimeline
                rfqId={activeRfqForNegotiate.id ?? 0}
                currentStatus={activeRfqForNegotiate.status || "QUOTED"}
                offers={offersForActiveRfq}
                userRole="BUYER"
                currentUnitPrice={19.5}
                currentIncoterm={activeRfqForNegotiate.incotermCode || "FOB"}
                onSubmitCounterOffer={handleSubmitBuyerCounterOffer}
                onAcceptCounterOffer={handleAcceptBuyerCounterOffer}
                onGenerateContract={async () => {
                  setCounterOfferModalOpen(false);
                  handleOpenContractModal(activeRfqForNegotiate);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Bilingual E-Contract Viewer & Digital Signature Modal (EXP-85 -> 89) */}
      {contractModalOpen && selectedContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[95vh] overflow-y-auto border border-neutral-300">
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between sticky top-0 z-20 rounded-t-2xl border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider">
                  Hợp Đồng Mua Bán Hàng Hóa Quốc Tế Điện Tử (ICC Model E-Contract)
                </h3>
              </div>
              <button
                onClick={() => setContractModalOpen(false)}
                className="p-1 text-white/80 hover:text-white rounded-lg hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6">
              <SalesContractViewer
                contract={selectedContract}
                userRole="BUYER"
                onSignContract={handleBuyerSignContract}
                onDownloadPdf={handleBuyerDownloadPdf}
                isSigning={isSigningBuyer}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 py-24 text-center font-mono text-sm text-neutral-600">
          Loading B2B Trade Portal...
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
