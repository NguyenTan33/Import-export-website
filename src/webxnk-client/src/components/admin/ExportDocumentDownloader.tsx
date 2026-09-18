"use client";

import React, { useState } from "react";
import { documentsApi } from "@/services/api";
import { FileDown, FileText, CheckCircle2 } from "lucide-react";

export const ExportDocumentDownloader: React.FC = () => {
  const [rfqId, setRfqId] = useState<number>(1);
  const [orderId, setOrderId] = useState<number>(1);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDownload = async (type: "PI" | "CI" | "PKL") => {
    setLoadingDoc(type);
    setStatusMessage(null);
    try {
      let blob: Blob;
      let filename = "";

      if (type === "PI") {
        blob = await documentsApi.downloadProformaInvoice(rfqId);
        filename = `Proforma_Invoice_RFQ_${rfqId}.pdf`;
      } else if (type === "CI") {
        blob = await documentsApi.downloadCommercialInvoice(orderId);
        filename = `Commercial_Invoice_ORD_${orderId}.pdf`;
      } else {
        blob = await documentsApi.downloadPackingList(orderId);
        filename = `Packing_List_ORD_${orderId}.pdf`;
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
      setStatusMessage(`Lỗi xuất file PDF. Đang dùng mẫu PDF giả lập (Mock Document Preview).`);
    } finally {
      setLoadingDoc(null);
    }
  };

  return (
    <div className="border border-black bg-white p-6 space-y-6">
      <div className="border-b border-black pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          QUESTPDF DOCUMENT ENGINE (EXP-56, EXP-69)
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Xuất bộ 3 chứng từ xuất khẩu thương mại quốc tế
        </h2>
      </div>

      {/* Inputs for RFQ / Order ID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono uppercase font-bold text-black mb-1">
            Mã đơn báo giá (RFQ ID) cho Proforma Invoice
          </label>
          <input
            type="number"
            value={rfqId}
            onChange={(e) => setRfqId(Number(e.target.value))}
            className="w-full border border-black p-2 text-sm font-mono focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono uppercase font-bold text-black mb-1">
            Mã đơn hàng xuất khẩu (Order ID) cho CI & Packing List
          </label>
          <input
            type="number"
            value={orderId}
            onChange={(e) => setOrderId(Number(e.target.value))}
            className="w-full border border-black p-2 text-sm font-mono focus:outline-none"
          />
        </div>
      </div>

      {/* 3 Document Download Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {/* Proforma Invoice Card */}
        <div className="border border-black p-4 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
          <div>
            <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
              BƯỚC 1: BÁO GIÁ
            </span>
            <h3 className="mt-2 text-base font-bold text-black">Hóa đơn chiếu lệ (PI)</h3>
            <p className="mt-1 text-xs text-neutral-600 font-mono">Proforma Invoice</p>
            <p className="mt-2 text-xs text-neutral-500">
              Chứng từ xác nhận điều khoản giá, Incoterms, thông tin tài khoản chuyển tiền T/T quốc tế.
            </p>
          </div>
          <button
            onClick={() => handleDownload("PI")}
            disabled={loadingDoc !== null}
            className="mt-4 flex items-center justify-center gap-2 border border-black bg-black py-2.5 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{loadingDoc === "PI" ? "Đang tạo PDF..." : "Tải Proforma Invoice"}</span>
          </button>
        </div>

        {/* Commercial Invoice Card */}
        <div className="border border-black p-4 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
          <div>
            <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
              BƯỚC 2: HẢI QUAN
            </span>
            <h3 className="mt-2 text-base font-bold text-black">Hóa đơn thương mại (CI)</h3>
            <p className="mt-1 text-xs text-neutral-600 font-mono">Commercial Invoice</p>
            <p className="mt-2 text-xs text-neutral-500">
              Chứng từ pháp lý cốt lõi để thông quan hải quan xuất khẩu và khai báo thuế tại cảng đến.
            </p>
          </div>
          <button
            onClick={() => handleDownload("CI")}
            disabled={loadingDoc !== null}
            className="mt-4 flex items-center justify-center gap-2 border border-black bg-black py-2.5 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{loadingDoc === "CI" ? "Đang tạo PDF..." : "Tải Commercial Invoice"}</span>
          </button>
        </div>

        {/* Packing List Card */}
        <div className="border border-black p-4 flex flex-col justify-between hover:bg-neutral-50 transition-colors">
          <div>
            <span className="inline-block bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 uppercase">
              BƯỚC 3: GIAO NHẬN
            </span>
            <h3 className="mt-2 text-base font-bold text-black">Phiếu đóng gói (PKL)</h3>
            <p className="mt-1 text-xs text-neutral-600 font-mono">Packing List</p>
            <p className="mt-2 text-xs text-neutral-500">
              Chi tiết quy cách số kiện thùng, tổng CBM, Gross Weight và Net Weight từng pallet.
            </p>
          </div>
          <button
            onClick={() => handleDownload("PKL")}
            disabled={loadingDoc !== null}
            className="mt-4 flex items-center justify-center gap-2 border border-black bg-black py-2.5 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" />
            <span>{loadingDoc === "PKL" ? "Đang tạo PDF..." : "Tải Packing List"}</span>
          </button>
        </div>
      </div>

      {/* Status Feedback */}
      {statusMessage && (
        <div className="p-3 border border-black bg-neutral-100 flex items-center gap-2 text-xs font-mono">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
};
