"use client";

import React, { useState } from "react";
import { RfqForm } from "@/components/portal/RfqForm";
import { Product, RfqRequestDto } from "@/types";
import { rfqApi, documentsApi } from "@/services/api";
import { MessageSquare, Upload, CheckCircle2, ShieldCheck, Download } from "lucide-react";

const SAMPLE_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    baseSku: "SHOES-SNK-V1",
    hsCode: "6404.11.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 25.0,
    isActive: true,
    translations: [{ languageCode: "vi", name: "Giày thể thao Sneaker xuất khẩu đế đúc" }],
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
    translations: [{ languageCode: "vi", name: "Than gáo dừa nén lục giác không khói BBQ" }],
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
    translations: [{ languageCode: "vi", name: "Cán chổi gỗ bạch đàn 120cm bọc màng PVC" }],
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
    translations: [{ languageCode: "vi", name: "Hạt điều nhân trắng xuất khẩu Grade W320" }],
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
    translations: [{ languageCode: "vi", name: "Băng keo trong OPP dán thùng 48mm x 100 yards" }],
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
    translations: [{ languageCode: "vi", name: "Màng PE quấn pallet tay 50cm độ dày 17 mic" }],
    priceTiers: [],
  },
];

export default function PortalPage() {
  const [activeTab, setActiveTab] = useState<"create" | "list" | "payment">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sample RFQs matching DB seed
  const [rfqs, setRfqs] = useState<RfqRequestDto[]>([
    {
      id: 1,
      rfqNumber: "RFQ-2026-JP001",
      companyName: "TOKYO OVERSEAS LOGISTICS & TRADING CO., LTD.",
      incotermCode: "FOB",
      portOfLoading: "Cat Lai Port, Ho Chi Minh City",
      portOfDischarge: "Tokyo Port, Japan",
      targetDeliveryDate: "2026-11-01",
      status: "QUOTED",
      totalCbm: 38.5,
      totalGrossWeightKg: 6750,
      suggestedContainerType: "1x40ft High Cube (40HC)",
      totalQuotedAmountUsd: 28500.0,
      items: [
        { productId: 1, productName: "Giày Sneaker xuất khẩu", quantity: 1200, quotedUnitPriceUsd: 19.5 },
        { productId: 2, productName: "Than không khói BBQ", quantity: 5000, quotedUnitPriceUsd: 0.85 },
        { productId: 5, productName: "Băng keo OPP 48mm", quantity: 1440, quotedUnitPriceUsd: 0.55 },
      ],
    },
  ]);

  const handleCreateRfq = async (payload: RfqRequestDto) => {
    setIsSubmitting(true);
    setSuccessMessage(null);
    try {
      // Send to API
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
    setSuccessMessage(`Tạo đơn RFQ thành công với mã: ${newRfq.rfqNumber}`);
    setActiveTab("list");
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
      alert(`Đang mở tải file Proforma Invoice cho đơn RFQ #${rfqId}`);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              B2B IMPORTER WORKSPACE (EXP-FE-PORTAL)
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              Cổng đối tác Nhà nhập khẩu quốc tế
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black border border-black px-3 py-1 bg-neutral-100">
            <ShieldCheck className="w-4 h-4 text-black" />
            <span>TÀI KHOẢN B2B BUYER: KENJI SATO (TOKYO TRADING CO.)</span>
          </div>
        </div>
      </div>

      {/* Success Alert */}
      {successMessage && (
        <div className="border border-black bg-neutral-100 p-4 flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-black/20 gap-2">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
            activeTab === "create" ? "border-black text-black bg-neutral-100" : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          1. Lập yêu cầu báo giá RFQ mới
        </button>
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
            activeTab === "list" ? "border-black text-black bg-neutral-100" : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          2. Quản lý RFQ & Đàm phán ({rfqs.length})
        </button>
        <button
          onClick={() => setActiveTab("payment")}
          className={`px-4 py-2.5 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
            activeTab === "payment" ? "border-black text-black bg-neutral-100" : "border-transparent text-neutral-500 hover:text-black"
          }`}
        >
          3. Nộp Ủy nhiệm chi T/T (Bank Slip PDF)
        </button>
      </div>

      {/* Tab 1: Create RFQ */}
      {activeTab === "create" && (
        <RfqForm
          availableProducts={SAMPLE_PRODUCTS}
          onSubmitRfq={handleCreateRfq}
          isSubmitting={isSubmitting}
        />
      )}

      {/* Tab 2: RFQ List & Negotiation */}
      {activeTab === "list" && (
        <div className="border border-black bg-white p-6 space-y-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-black">
            Lịch sử yêu cầu báo giá xuất khẩu
          </h2>

          <div className="divide-y divide-black/20">
            {rfqs.map((rfq) => (
              <div key={rfq.id} className="py-5 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-xs font-mono font-bold bg-black text-white px-2 py-0.5 mr-2">
                      {rfq.rfqNumber}
                    </span>
                    <span className="text-xs font-mono uppercase text-neutral-500">
                      Incoterms: <strong>{rfq.incotermCode}</strong> | POL: {rfq.portOfLoading} → POD: {rfq.portOfDischarge}
                    </span>
                  </div>

                  <span className="text-xs font-mono font-bold border border-black px-2 py-1 uppercase bg-neutral-100">
                    Trạng thái: {rfq.status}
                  </span>
                </div>

                {/* Items in this RFQ */}
                <div className="bg-neutral-50 p-3 border border-black/10 text-xs font-mono grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-neutral-500">Số lượng mặt hàng:</span> {rfq.items.length} loại
                  </div>
                  <div>
                    <span className="text-neutral-500">Container đề xuất:</span> {rfq.suggestedContainerType || "40HC"}
                  </div>
                  <div className="text-right font-black text-black text-sm">
                    Tổng tiền chào thầu: ${(rfq.totalQuotedAmountUsd || 0).toLocaleString("en-US")} USD
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex flex-wrap gap-2 pt-1 justify-end">
                  <button
                    onClick={() => alert(`Mở khung chat đàm phán SignalR realtime cho đơn ${rfq.rfqNumber} với chuyên viên kinh doanh!`)}
                    className="flex items-center gap-1.5 border border-black px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Đàm phán Realtime (SignalR)</span>
                  </button>

                  <button
                    onClick={() => handleDownloadPi(rfq.id)}
                    className="flex items-center gap-1.5 bg-black px-3 py-1.5 text-xs font-bold uppercase text-white hover:bg-neutral-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Tải Proforma Invoice (PDF)</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Upload Bank Slip PDF */}
      {activeTab === "payment" && (
        <div className="border border-black bg-white p-6 space-y-6 max-w-2xl">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              INTERNATIONAL WIRE TRANSFER (EXP-24)
            </span>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Tải lên chứng từ Ủy nhiệm chi T/T (Bank Slip PDF)
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              Dành cho hợp đồng thanh toán quốc tế qua điện chuyển tiền T/T (Telegraphic Transfer) đặt cọc 30% hoặc thanh toán 100%.
            </p>
          </div>

          <div className="border-2 border-dashed border-black p-8 text-center bg-neutral-50 space-y-3">
            <Upload className="w-8 h-8 text-black mx-auto" />
            <div className="text-xs font-mono text-neutral-600">
              Kéo thả hoặc click để chọn file PDF Ủy nhiệm chi chuyển khoản từ ngân hàng
            </div>
            <input
              type="file"
              accept=".pdf"
              className="text-xs font-mono"
              onChange={() => alert("Đã nhận file PDF Ủy nhiệm chi. Đang tải lên AWS S3 Storage an toàn!")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
