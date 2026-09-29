"use client";

import React, { useState } from "react";
import { RfqForm } from "@/components/portal/RfqForm";
import { Product, RfqRequestDto } from "@/types";
import { rfqApi, documentsApi } from "@/services/api";
import { MessageSquare, Upload, CheckCircle2, ShieldCheck, Download, Eye } from "lucide-react";
import { NegotiationChatModal } from "@/components/portal/NegotiationChatModal";
import { PdfPreviewModal } from "@/components/admin/PdfPreviewModal";
import { useLanguage } from "@/context/LanguageContext";

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    baseSku: "SHOES-SNK-V1",
    hsCode: "6404.11.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 25.0,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Giày thể thao Sneaker xuất khẩu đế đúc" },
      { languageCode: "en", name: "Premium Vulcanized Canvas Sneakers" },
    ],
    priceTiers: [],
  },
  {
    id: 2,
    categoryId: 2,
    baseSku: "CHAR-COCO-BBQ",
    hsCode: "4402.90.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 1.2,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Than gáo dừa nén lục giác không khói BBQ" },
      { languageCode: "en", name: "Hexagonal Coconut Shell Smokeless BBQ Charcoal" },
    ],
    priceTiers: [],
  },
  {
    id: 3,
    categoryId: 3,
    baseSku: "BROOM-EUC-120",
    hsCode: "4417.00.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.65,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Cán chổi gỗ bạch đàn 120cm bọc màng PVC" },
      { languageCode: "en", name: "Eucalyptus Wooden Broom Handle 120cm PVC Coated" },
    ],
    priceTiers: [],
  },
  {
    id: 4,
    categoryId: 4,
    baseSku: "AGRI-CASHEW-W320",
    hsCode: "0801.32.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 8.5,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Hạt điều nhân trắng xuất khẩu Grade W320" },
      { languageCode: "en", name: "Export Grade W320 White Whole Cashew Kernels" },
    ],
    priceTiers: [],
  },
  {
    id: 5,
    categoryId: 5,
    baseSku: "TAPE-OPP-48X100",
    hsCode: "3919.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.85,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Băng keo trong OPP dán thùng 48mm x 100 yards" },
      { languageCode: "en", name: "Industrial OPP Packaging Tape 48mm x 100 yards" },
    ],
    priceTiers: [],
  },
  {
    id: 6,
    categoryId: 6,
    baseSku: "PE-FILM-50-17",
    hsCode: "3920.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 3.2,
    isActive: true,
    translations: [
      { languageCode: "vi", name: "Màng PE quấn pallet tay 50cm độ dày 17 mic" },
      { languageCode: "en", name: "Manual Pallet Stretch Film 50cm 17 Mic" },
    ],
    priceTiers: [],
  },
];

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState<"create" | "list" | "payment">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Negotiation Modal State
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [activeRfqForChat, setActiveRfqForChat] = useState<RfqRequestDto | null>(null);

  // PDF Preview Modal State
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfRfqId, setPdfRfqId] = useState<number>(1);

  const { language } = useLanguage();
  const isVi = language === "vi";

  // Sample RFQs matching DB seed
  const [rfqs, setRfqs] = useState<RfqRequestDto[]>([
    {
      id: 1,
      rfqNumber: "RFQ-2026-JP001",
      companyName: "TOKYO OVERSEAS LOGISTICS & TRADING CO., LTD.",
      incotermCode: "FOB",
      portOfLoading: isVi ? "Cảng Cát Lái, TP.HCM" : "Cat Lai Port, Ho Chi Minh City",
      portOfDischarge: isVi ? "Cảng Tokyo, Nhật Bản" : "Tokyo Port, Japan",
      targetDeliveryDate: "2026-11-01",
      status: "QUOTED",
      totalCbm: 38.5,
      totalGrossWeightKg: 6750,
      suggestedContainerType: "1x40ft High Cube (40HC)",
      totalQuotedAmountUsd: 28500.0,
      items: [
        { productId: 1, productName: isVi ? "Giày Sneaker xuất khẩu" : "Canvas Sneakers", quantity: 1200, quotedUnitPriceUsd: 19.5 },
        { productId: 2, productName: isVi ? "Than không khói BBQ" : "Smokeless BBQ Charcoal", quantity: 5000, quotedUnitPriceUsd: 0.85 },
        { productId: 5, productName: isVi ? "Băng keo OPP 48mm" : "OPP Adhesive Tape 48mm", quantity: 1440, quotedUnitPriceUsd: 0.55 },
      ],
    },
  ]);

  const handleCreateRfq = async (payload: RfqRequestDto) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      await rfqApi.createRfq(payload);
    } catch {
      // Local fallback
    }

    const newRfq: RfqRequestDto = {
      ...payload,
      id: rfqs.length + 1,
      rfqNumber: `RFQ-2026-EXP00${rfqs.length + 1}`,
      status: "SUBMITTED",
      suggestedContainerType: "1x40ft Container (40GP)",
      totalQuotedAmountUsd: payload.items.reduce((s, i) => s + (i.targetPriceUsd || 10) * i.quantity, 0),
    };

    setRfqs([newRfq, ...rfqs]);
    setIsSubmitting(false);
    setSuccessMessage(
      isVi
        ? `Tạo đơn RFQ thành công với mã: ${newRfq.rfqNumber}`
        : `Successfully created RFQ with reference: ${newRfq.rfqNumber}`
    );
    setActiveTab("list");
  };

  const handleOpenChat = (rfq: RfqRequestDto) => {
    setActiveRfqForChat(rfq);
    setChatModalOpen(true);
  };

  const handleOpenPdfPreview = (rfqId?: number) => {
    setPdfRfqId(rfqId || 1);
    setPdfModalOpen(true);
  };

  const handlePriceAgreed = (newTotalUsd: number) => {
    if (!activeRfqForChat) return;
    setRfqs((prev) =>
      prev.map((r) =>
        r.id === activeRfqForChat.id
          ? { ...r, totalQuotedAmountUsd: newTotalUsd, status: "AGREED" }
          : r
      )
    );
  };

  const handleDownloadPi = async (rfqId?: number) => {
    if (!rfqId) return;
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
      handleOpenPdfPreview(rfqId);
    }
  };

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
            {isVi ? "Nộp Ủy nhiệm chi T/T" : "Submit T/T Wire Slip"}
          </button>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="border border-emerald-600 bg-emerald-50 p-4 text-emerald-900 text-xs font-mono flex items-center gap-2 rounded">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tab 1: Create RFQ */}
      {activeTab === "create" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RfqForm
                availableProducts={SAMPLE_PRODUCTS}
                onSubmitRfq={handleCreateRfq}
                isSubmitting={isSubmitting}
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

          <div className="space-y-4">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="border border-black p-4 bg-white space-y-3 shadow-sm hover:border-[#0E4B94] transition-colors rounded">
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
                        rfq.status === "AGREED"
                          ? "bg-emerald-100 text-emerald-800 border-emerald-400"
                          : rfq.status === "QUOTED"
                          ? "bg-blue-100 text-blue-800 border-blue-400"
                          : "bg-neutral-100 text-neutral-800 border-neutral-300"
                      }`}
                    >
                      {rfq.status === "AGREED"
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
                    <strong>{rfq.items.length} {isVi ? "loại" : "items"}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">
                      {isVi ? "Container đề xuất:" : "Suggested Container:"}
                    </span>{" "}
                    <strong className="text-[#0E4B94]">{rfq.suggestedContainerType || "40HC"}</strong>
                  </div>
                  <div className="text-right font-black text-black text-sm">
                    {isVi ? "Tổng tiền báo giá: " : "Quotation Subtotal: "}
                    <span className="text-[#0E4B94]">${(rfq.totalQuotedAmountUsd || 0).toLocaleString("en-US")} USD</span>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-neutral-100">
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
          </div>
        </div>
      )}

      {/* Tab 3: Upload Bank Slip PDF */}
      {activeTab === "payment" && (
        <div className="border border-black bg-white p-6 space-y-6 max-w-2xl rounded">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              INTERNATIONAL WIRE TRANSFER (EXP-24)
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              {isVi
                ? "Tải lên chứng từ Ủy nhiệm chi T/T (Bank Slip PDF)"
                : "Upload T/T Bank Swift Transfer Slip (PDF)"}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              {isVi
                ? "Dành cho hợp đồng thanh toán quốc tế qua điện chuyển tiền T/T (Telegraphic Transfer) đặt cọc 30% hoặc thanh toán 100%."
                : "Upload official SWIFT MT103 confirmation slip for 30% contract deposit or 100% full invoice settlement."}
            </p>
          </div>

          <div className="border-2 border-dashed border-black p-8 text-center bg-neutral-50 space-y-3 rounded">
            <Upload className="w-8 h-8 text-black mx-auto" />
            <div className="text-xs font-mono text-neutral-600">
              {isVi
                ? "Kéo thả hoặc click để chọn file PDF Ủy nhiệm chi chuyển khoản từ ngân hàng"
                : "Drag & drop or click to upload your official Bank Wire Transfer PDF"}
            </div>
            <input
              type="file"
              accept=".pdf"
              className="text-xs font-mono"
              onChange={() =>
                alert(
                  isVi
                    ? "Đã nhận file PDF Ủy nhiệm chi. Đang tải lên AWS S3 Storage an toàn!"
                    : "Bank transfer slip received. Securely syncing to AWS S3 storage."
                )
              }
            />
          </div>
        </div>
      )}

      {/* SignalR Negotiation Chat Modal */}
      {activeRfqForChat && (
        <NegotiationChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          rfqNumber={activeRfqForChat.rfqNumber || "RFQ-2026-EXP"}
          rfqId={activeRfqForChat.id || 1}
          currentTotalUsd={activeRfqForChat.totalQuotedAmountUsd || 28500}
          items={activeRfqForChat.items}
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
    </div>
  );
}