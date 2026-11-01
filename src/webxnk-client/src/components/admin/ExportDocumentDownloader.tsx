"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  adminApi,
  ordersApi,
  documentsApi,
  RfqHistoryEntry,
  OrderHistoryEntry,
} from "@/services/api";
import { PdfPreviewModal } from "@/components/admin/PdfPreviewModal";
import {
  FileDown,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  Search,
  Building,
  Ship,
  Package,
  Layers,
  RefreshCw,
  FolderDown,
  ChevronDown,
  ChevronUp,
  Hash,
  ArrowRight,
  Sparkles,
  Check,
  Calendar,
  Globe,
  DollarSign,
  Loader2,
} from "lucide-react";

type SelectionMode = "RFQ" | "ORDER";

export const ExportDocumentDownloader: React.FC = () => {
  // Data states
  const [rfqs, setRfqs] = useState<RfqHistoryEntry[]>([]);
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState<boolean>(true);

  // Selection states
  const [mode, setMode] = useState<SelectionMode>("RFQ");
  const [selectedRfqId, setSelectedRfqId] = useState<number>(0);
  const [selectedOrderId, setSelectedOrderId] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Manual fallback inputs (collapsible)
  const [showManualInputs, setShowManualInputs] = useState<boolean>(false);
  const [manualRfqId, setManualRfqId] = useState<number>(0);
  const [manualOrderId, setManualOrderId] = useState<number>(0);

  // Actions & preview states
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [isDownloadingAll, setIsDownloadingAll] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean;
    type: "PI" | "CI" | "PKL";
    id: number;
  }>({
    isOpen: false,
    type: "PI",
    id: 0,
  });

  // Load RFQs and Orders on mount
  const loadData = async () => {
    setIsLoadingList(true);
    setErrorMessage(null);
    try {
      const [rfqData, orderData] = await Promise.all([
        adminApi.getAllRfqs().catch(() => []),
        ordersApi.getAllOrders().catch(() => []),
      ]);

      const validRfqs = Array.isArray(rfqData) ? (rfqData as RfqHistoryEntry[]) : [];
      const validOrders = Array.isArray(orderData) ? orderData : [];

      setRfqs(validRfqs);
      setOrders(validOrders);

      // Auto-select first item if available
      if (validRfqs.length > 0 && selectedRfqId === 0) {
        setSelectedRfqId(validRfqs[0].id);
        setManualRfqId(validRfqs[0].id);
      }
      if (validOrders.length > 0 && selectedOrderId === 0) {
        setSelectedOrderId(validOrders[0].id);
        setManualOrderId(validOrders[0].id);
      }
    } catch {
      setErrorMessage("Không thể tải danh sách đơn hàng hoặc RFQ từ máy chủ. Vui lòng thử lại.");
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filtered lists based on search
  const filteredRfqs = useMemo(() => {
    if (!searchTerm.trim()) return rfqs;
    const term = searchTerm.toLowerCase();
    return rfqs.filter(
      (r) =>
        (r.rfqNumber && r.rfqNumber.toLowerCase().includes(term)) ||
        (r.companyName && r.companyName.toLowerCase().includes(term)) ||
        (r.incotermCode && r.incotermCode.toLowerCase().includes(term)) ||
        (r.portOfDischarge && r.portOfDischarge.toLowerCase().includes(term)) ||
        String(r.id).includes(term)
    );
  }, [rfqs, searchTerm]);

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    const term = searchTerm.toLowerCase();
    return orders.filter(
      (o) =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.orderCode && o.orderCode.toLowerCase().includes(term)) ||
        (o.recipientName && o.recipientName.toLowerCase().includes(term)) ||
        (o.destinationCountryCode && o.destinationCountryCode.toLowerCase().includes(term)) ||
        String(o.id).includes(term)
    );
  }, [orders, searchTerm]);

  // Current active entity
  const activeRfq = useMemo(
    () => rfqs.find((r) => r.id === selectedRfqId) || (rfqs.length > 0 ? rfqs[0] : null),
    [rfqs, selectedRfqId]
  );

  const activeOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || (orders.length > 0 ? orders[0] : null),
    [orders, selectedOrderId]
  );

  // Active target ID based on mode
  const currentTargetId = useMemo(() => {
    if (showManualInputs) {
      return mode === "RFQ" ? manualRfqId : manualOrderId;
    }
    return mode === "RFQ"
      ? (activeRfq ? activeRfq.id : selectedRfqId)
      : (activeOrder ? activeOrder.id : selectedOrderId);
  }, [mode, showManualInputs, manualRfqId, manualOrderId, activeRfq, activeOrder, selectedRfqId, selectedOrderId]);

  // Single document download handler
  const handleDownload = async (type: "PI" | "CI" | "PKL") => {
    const idToUse = currentTargetId;
    if (!idToUse || idToUse < 1) {
      setErrorMessage("Vui lòng chọn một đơn báo giá hoặc đơn hàng hợp lệ.");
      return;
    }

    setLoadingDoc(type);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      let blob: Blob;
      let filename = "";

      const codeSuffix =
        mode === "RFQ"
          ? (activeRfq?.rfqNumber || `RFQ_${idToUse}`)
          : (activeOrder?.orderNumber || activeOrder?.orderCode || `ORD_${idToUse}`);

      if (type === "PI") {
        blob = await documentsApi.downloadProformaInvoice(idToUse);
        filename = `Proforma_Invoice_${codeSuffix}.pdf`;
      } else if (type === "CI") {
        blob = await documentsApi.downloadCommercialInvoice(idToUse);
        filename = `Commercial_Invoice_${codeSuffix}.pdf`;
      } else {
        blob = await documentsApi.downloadPackingList(idToUse);
        filename = `Packing_List_${codeSuffix}.pdf`;
      }

      // Trigger browser download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage(`Tải xuống thành công: ${filename}`);
    } catch (err: unknown) {
      console.error(err);
      setErrorMessage(
        `Không thể tạo chứng từ ${type} từ máy chủ. Vui lòng kiểm tra đơn hàng hoặc thử lại.`
      );
    } finally {
      setLoadingDoc(null);
    }
  };

  // Download all 3 documents at once
  const handleDownloadAll = async () => {
    const idToUse = currentTargetId;
    if (!idToUse || idToUse < 1) {
      setErrorMessage("Vui lòng chọn một đơn báo giá hoặc đơn hàng để tải trọn bộ chứng từ.");
      return;
    }

    setIsDownloadingAll(true);
    setStatusMessage(null);
    setErrorMessage(null);

    const types: Array<"PI" | "CI" | "PKL"> = ["PI", "CI", "PKL"];
    let successCount = 0;

    for (const type of types) {
      try {
        await handleDownload(type);
        successCount++;
        // Slight pause between downloads for smooth browser handling
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch {
        // continue with next document
      }
    }

    setIsDownloadingAll(false);
    if (successCount === 3) {
      setStatusMessage("Đã tải trọn bộ 3 chứng từ xuất khẩu (PI, CI, PKL) thành công!");
    } else {
      setStatusMessage(`Đã xử lý kết xuất ${successCount}/3 chứng từ.`);
    }
  };

  // Open Preview Modal
  const handleOpenPreview = (type: "PI" | "CI" | "PKL") => {
    const idToUse = currentTargetId;
    if (!idToUse || idToUse < 1) {
      setErrorMessage("Vui lòng chọn đơn hợp lệ để xem trước chứng từ.");
      return;
    }
    setPreviewModal({
      isOpen: true,
      type,
      id: idToUse,
    });
  };

  const formatUsd = (num?: number) => {
    if (num === undefined || num === null) return "$0.00";
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num);
  };

  return (
    <div className="border border-black bg-white p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-black pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono uppercase tracking-widest bg-[#0E4B94] text-white px-2 py-0.5 font-bold">
              QUESTPDF ENGINE V2024
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              INCOTERMS 2020 • ICC STANDARD
            </span>
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2 mt-1.5">
            <FileText className="w-5 h-5 text-[#0E4B94]" />
            Bộ 3 Chứng Từ Xuất Khẩu Thương Mại Quốc Tế
          </h2>
          <p className="text-xs text-neutral-600 font-sans mt-0.5">
            Tự động đồng bộ và kết xuất hồ sơ hải quan: Hóa đơn chiếu lệ (PI), Hóa đơn thương mại (CI) và Phiếu đóng gói (PKL).
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => void loadData()}
            disabled={isLoadingList}
            className="flex items-center gap-1.5 px-3 py-2 border border-black text-xs font-bold font-mono hover:bg-neutral-100 transition-colors disabled:opacity-50"
            title="Làm mới danh sách đơn từ hệ thống"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingList ? "animate-spin" : ""}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={isDownloadingAll || loadingDoc !== null || currentTargetId < 1}
            className="flex items-center gap-2 px-4 py-2 bg-[#0E4B94] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0a376d] transition-colors disabled:opacity-50 shadow-sm"
          >
            {isDownloadingAll ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải bộ 3 PDF...</span>
              </>
            ) : (
              <>
                <FolderDown className="w-4 h-4" />
                <span>Tải Trọn Bộ 3 Chứng Từ</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className="p-3 border border-emerald-600 bg-emerald-50 text-emerald-900 flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 border border-red-500 bg-red-50 text-red-900 flex items-center gap-2 text-xs font-mono">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* STEP 1: Interactive Order/RFQ Selector */}
      <div className="border border-neutral-300 bg-neutral-50/70 p-4 space-y-4 rounded-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold font-mono">
              1
            </span>
            <span className="text-sm font-bold uppercase text-black">
              Chọn đơn hàng cần xuất chứng từ (Không cần gõ ID)
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center border border-black bg-white text-xs font-mono">
            <button
              onClick={() => {
                setMode("RFQ");
                if (rfqs.length > 0 && selectedRfqId === 0) setSelectedRfqId(rfqs[0].id);
              }}
              className={`px-3 py-1.5 font-bold transition-colors ${
                mode === "RFQ"
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              📋 Đơn Báo Giá B2B (RFQ) ({rfqs.length})
            </button>
            <button
              onClick={() => {
                setMode("ORDER");
                if (orders.length > 0 && selectedOrderId === 0) setSelectedOrderId(orders[0].id);
              }}
              className={`px-3 py-1.5 font-bold transition-colors ${
                mode === "ORDER"
                  ? "bg-black text-white"
                  : "text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              📦 Đơn Hàng Xuất Khẩu (Orders) ({orders.length})
            </button>
          </div>
        </div>

        {/* Search bar & Dropdown picker */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={mode === "RFQ" ? "Tìm theo mã RFQ, tên công ty, cảng đến..." : "Tìm mã đơn hàng, người nhận, quốc gia..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-neutral-300 bg-white font-mono focus:border-black focus:outline-none"
            />
          </div>

          <div className="md:col-span-8">
            {mode === "RFQ" ? (
              <select
                value={selectedRfqId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedRfqId(id);
                  setManualRfqId(id);
                }}
                disabled={isLoadingList || rfqs.length === 0}
                className="w-full py-2 px-3 text-xs font-mono border border-black bg-white focus:outline-none"
              >
                {filteredRfqs.length === 0 ? (
                  <option value="">Không tìm thấy đơn RFQ phù hợp</option>
                ) : (
                  filteredRfqs.map((rfq) => (
                    <option key={rfq.id} value={rfq.id}>
                      [{rfq.rfqNumber || `RFQ-${rfq.id}`}] - {rfq.companyName || "Đối tác B2B"} • {rfq.incotermCode || "FOB"} ➔ {rfq.portOfDischarge || "Ngoại thương"} • {formatUsd(rfq.totalQuotedAmountUsd)}
                    </option>
                  ))
                )}
              </select>
            ) : (
              <select
                value={selectedOrderId || ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedOrderId(id);
                  setManualOrderId(id);
                }}
                disabled={isLoadingList || orders.length === 0}
                className="w-full py-2 px-3 text-xs font-mono border border-black bg-white focus:outline-none"
              >
                {filteredOrders.length === 0 ? (
                  <option value="">Không tìm thấy đơn hàng phù hợp</option>
                ) : (
                  filteredOrders.map((ord) => (
                    <option key={ord.id} value={ord.id}>
                      [{ord.orderNumber || ord.orderCode || `ORD-${ord.id}`}] - {ord.recipientName || "Khách hàng"} • Đến: {ord.destinationCountryCode || "GLOBAL"} • {formatUsd(ord.totalAmountUsd)} • {ord.status || ord.orderStatus}
                    </option>
                  ))
                )}
              </select>
            )}
          </div>
        </div>

        {/* Quick Select Pill Carousel / Mini-Grid for immediate clicking */}
        <div className="pt-1">
          <div className="text-[11px] font-mono text-neutral-500 mb-1.5 flex items-center justify-between">
            <span>HOẶC CHỌN TRỰC TIẾP TỪ DANH SÁCH GẦN NHẤT:</span>
            <span className="text-[10px] text-neutral-400">Click vào thẻ để kích hoạt xuất hồ sơ</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
            {mode === "RFQ" ? (
              filteredRfqs.slice(0, 6).map((rfq) => {
                const isSelected = selectedRfqId === rfq.id;
                return (
                  <div
                    key={rfq.id}
                    onClick={() => {
                      setSelectedRfqId(rfq.id);
                      setManualRfqId(rfq.id);
                    }}
                    className={`cursor-pointer p-2.5 border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? "border-[#0E4B94] bg-blue-50 ring-1 ring-[#0E4B94]"
                        : "border-neutral-200 bg-white hover:border-black"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0E4B94]">
                        {rfq.rfqNumber || `RFQ-${rfq.id}`}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] bg-[#0E4B94] text-white px-1.5 py-0.2 font-mono">
                          <Check className="w-3 h-3" /> Đang chọn
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase px-1.5 bg-neutral-100 text-neutral-600">
                          {rfq.status || "Chờ xử lý"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-black truncate mt-1">
                      {rfq.companyName || "Đối tác B2B"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mt-2 border-t border-neutral-100 pt-1">
                      <span>{rfq.incotermCode || "FOB"} ➔ {rfq.portOfDischarge || "Port"}</span>
                      <span className="font-bold text-black">{formatUsd(rfq.totalQuotedAmountUsd)}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              filteredOrders.slice(0, 6).map((ord) => {
                const isSelected = selectedOrderId === ord.id;
                return (
                  <div
                    key={ord.id}
                    onClick={() => {
                      setSelectedOrderId(ord.id);
                      setManualOrderId(ord.id);
                    }}
                    className={`cursor-pointer p-2.5 border transition-all text-left flex flex-col justify-between ${
                      isSelected
                        ? "border-[#0E4B94] bg-blue-50 ring-1 ring-[#0E4B94]"
                        : "border-neutral-200 bg-white hover:border-black"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-xs text-[#0E4B94]">
                        {ord.orderNumber || ord.orderCode || `ORD-${ord.id}`}
                      </span>
                      {isSelected ? (
                        <span className="flex items-center gap-1 text-[10px] bg-[#0E4B94] text-white px-1.5 py-0.2 font-mono">
                          <Check className="w-3 h-3" /> Đang chọn
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono uppercase px-1.5 bg-neutral-100 text-neutral-600">
                          {ord.status || ord.orderStatus || "PENDING"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-black truncate mt-1">
                      {ord.recipientName || "Khách hàng"}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500 mt-2 border-t border-neutral-100 pt-1">
                      <span>Quốc gia: {ord.destinationCountryCode || "GLOBAL"}</span>
                      <span className="font-bold text-black">{formatUsd(ord.totalAmountUsd)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Item Summary Showcase */}
        {mode === "RFQ" && activeRfq && (
          <div className="bg-white border-2 border-[#0E4B94] p-4 text-xs font-sans mt-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-2 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#0E4B94] text-white text-[11px] font-mono font-bold px-2 py-0.5">
                  ĐƠN ĐANG CHỌN (ACTIVE)
                </span>
                <span className="font-mono font-black text-sm text-black">
                  {activeRfq.rfqNumber || `RFQ-${activeRfq.id}`}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  (Database ID: {activeRfq.id})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-mono text-[11px]">Trạng thái:</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {activeRfq.status || "APPROVED"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 block text-[10px]">ĐỐI TÁC NHẬP KHẨU:</span>
                <span className="font-bold text-black truncate block">
                  {activeRfq.companyName || "Global Trading Partner"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">ĐIỀU KIỆN GIAO HÀNG:</span>
                <span className="font-bold text-[#0E4B94] block">
                  {activeRfq.incotermCode || "FOB"} • {activeRfq.portOfDischarge || "Port of Discharge"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">QUY MÔ LÔ HÀNG (CBM):</span>
                <span className="font-bold text-neutral-800 block">
                  {activeRfq.totalCbm ? `${activeRfq.totalCbm} m³` : "Theo tiêu chuẩn Pallet"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">TỔNG TRỊ GIÁ HỢP ĐỒNG:</span>
                <span className="font-black text-base text-[#0E4B94] block">
                  {formatUsd(activeRfq.totalQuotedAmountUsd)}
                </span>
              </div>
            </div>
          </div>
        )}

        {mode === "ORDER" && activeOrder && (
          <div className="bg-white border-2 border-[#0E4B94] p-4 text-xs font-sans mt-3 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-neutral-200 pb-2 mb-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-[#0E4B94] text-white text-[11px] font-mono font-bold px-2 py-0.5">
                  ĐƠN ĐANG CHỌN (ACTIVE)
                </span>
                <span className="font-mono font-black text-sm text-black">
                  {activeOrder.orderNumber || activeOrder.orderCode || `ORD-${activeOrder.id}`}
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  (Database ID: {activeOrder.id})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-neutral-500 font-mono text-[11px]">Trạng thái:</span>
                <span className="bg-blue-100 text-[#0E4B94] text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                  {activeOrder.status || activeOrder.orderStatus || "PAID"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 font-mono text-[11px]">
              <div>
                <span className="text-neutral-500 block text-[10px]">NGƯỜI NHẬN / KHÁCH:</span>
                <span className="font-bold text-black truncate block">
                  {activeOrder.recipientName || "Khách hàng quốc tế"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">QUỐC GIA ĐẾN:</span>
                <span className="font-bold text-[#0E4B94] block">
                  {activeOrder.destinationCountryCode || "GLOBAL DESTINATION"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">LOẠI ĐƠN HÀNG:</span>
                <span className="font-bold text-neutral-800 block">
                  {activeOrder.orderType || "B2B Export"}
                </span>
              </div>
              <div>
                <span className="text-neutral-500 block text-[10px]">TỔNG GIÁ TRỊ:</span>
                <span className="font-black text-base text-[#0E4B94] block">
                  {formatUsd(activeOrder.totalAmountUsd)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Collapsible Manual ID Input for Devs / Advanced Users */}
        <div className="pt-2 border-t border-neutral-200">
          <button
            onClick={() => setShowManualInputs(!showManualInputs)}
            className="flex items-center gap-1.5 text-xs font-mono text-neutral-600 hover:text-black font-semibold"
          >
            {showManualInputs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            <span>Tùy chọn nâng cao: Nhập ID cơ sở dữ liệu thủ công</span>
          </button>

          {showManualInputs && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3 bg-white p-3 border border-neutral-300">
              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-black mb-1">
                  Mã đơn báo giá (RFQ ID) cho Proforma Invoice
                </label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    value={manualRfqId || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setManualRfqId(val);
                      setSelectedRfqId(val);
                    }}
                    placeholder="Nhập ID (VD: 1, 2, 3...)"
                    className="w-full border border-black p-1.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono uppercase font-bold text-black mb-1">
                  Mã đơn hàng xuất khẩu (Order ID) cho CI & PKL
                </label>
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-neutral-400" />
                  <input
                    type="number"
                    value={manualOrderId || ""}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setManualOrderId(val);
                      setSelectedOrderId(val);
                    }}
                    placeholder="Nhập ID (VD: 1, 2, 3...)"
                    className="w-full border border-black p-1.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2: The 3 Export Document Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-black text-white text-xs font-bold font-mono">
              2
            </span>
            <span className="text-sm font-bold uppercase text-black">
              Bộ 3 chứng từ ngoại thương (Xem trước trực tiếp & Tải về)
            </span>
          </div>

          <span className="text-[11px] font-mono text-neutral-500 hidden sm:inline">
            Hỗ trợ xem trực tiếp không cần tải tệp
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Proforma Invoice Card */}
          <div className="border border-black p-5 flex flex-col justify-between hover:border-[#0E4B94] transition-all bg-white relative group shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block bg-[#0E4B94] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wide">
                  BƯỚC 1: BÁO GIÁ
                </span>
                <span className="text-[11px] font-mono text-neutral-500 font-bold">PI</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-black">Hóa đơn chiếu lệ (PI)</h3>
              <p className="mt-0.5 text-xs text-neutral-600 font-mono">Proforma Invoice</p>
              <p className="mt-2.5 text-xs text-neutral-500 leading-relaxed">
                Chứng từ xác nhận điều khoản giá ngoại thương, Incoterms 2020, thông tin tài khoản chuyển khoản T/T quốc tế (Vietcombank USD).
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => handleOpenPreview("PI")}
                disabled={currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 py-2 text-xs font-bold font-mono uppercase transition-colors disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-[#0E4B94]" />
                <span>Xem trước PDF</span>
              </button>

              <button
                onClick={() => handleDownload("PI")}
                disabled={loadingDoc !== null || currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-black py-2 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors font-mono"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{loadingDoc === "PI" ? "Đang tạo PDF..." : "Tải PDF"}</span>
              </button>
            </div>
          </div>

          {/* 2. Commercial Invoice Card */}
          <div className="border border-black p-5 flex flex-col justify-between hover:border-black transition-all bg-white relative group shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wide">
                  BƯỚC 2: HẢI QUAN
                </span>
                <span className="text-[11px] font-mono text-neutral-500 font-bold">CI</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-black">Hóa đơn thương mại (CI)</h3>
              <p className="mt-0.5 text-xs text-neutral-600 font-mono">Commercial Invoice</p>
              <p className="mt-2.5 text-xs text-neutral-500 leading-relaxed">
                Chứng từ pháp lý cốt lõi để thông quan hải quan xuất khẩu tại Cảng Cát Lái và mở tờ khai tính thuế nhập khẩu tại nước sở tại.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => handleOpenPreview("CI")}
                disabled={currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 py-2 text-xs font-bold font-mono uppercase transition-colors disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-black" />
                <span>Xem trước PDF</span>
              </button>

              <button
                onClick={() => handleDownload("CI")}
                disabled={loadingDoc !== null || currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-black py-2 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors font-mono"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{loadingDoc === "CI" ? "Đang tạo PDF..." : "Tải PDF"}</span>
              </button>
            </div>
          </div>

          {/* 3. Packing List Card */}
          <div className="border border-black p-5 flex flex-col justify-between hover:border-[#C9252C] transition-all bg-white relative group shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-block bg-[#C9252C] text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-wide">
                  BƯỚC 3: GIAO NHẬN
                </span>
                <span className="text-[11px] font-mono text-neutral-500 font-bold">PKL</span>
              </div>
              <h3 className="mt-3 text-base font-bold text-black">Phiếu đóng gói (PKL)</h3>
              <p className="mt-0.5 text-xs text-neutral-600 font-mono">Packing List</p>
              <p className="mt-2.5 text-xs text-neutral-500 leading-relaxed">
                Chi tiết quy cách số kiện thùng, tổng thể tích CBM, trọng lượng tịnh Net Weight và tổng trọng lượng Gross Weight từng pallet/container.
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-neutral-100 space-y-2">
              <button
                onClick={() => handleOpenPreview("PKL")}
                disabled={currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-black border border-neutral-300 py-2 text-xs font-bold font-mono uppercase transition-colors disabled:opacity-50"
              >
                <Eye className="w-3.5 h-3.5 text-[#C9252C]" />
                <span>Xem trước PDF</span>
              </button>

              <button
                onClick={() => handleDownload("PKL")}
                disabled={loadingDoc !== null || currentTargetId < 1}
                className="w-full flex items-center justify-center gap-1.5 bg-black py-2 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors font-mono"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{loadingDoc === "PKL" ? "Đang tạo PDF..." : "Tải PDF"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded High-Fidelity PDF Preview Modal */}
      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        onClose={() => setPreviewModal((prev) => ({ ...prev, isOpen: false }))}
        documentType={previewModal.type}
        id={previewModal.id}
      />
    </div>
  );
};
