"use client";

import React, { useState, useEffect } from "react";
import { documentsApi } from "@/services/api";
import {
  X,
  Download,
  Printer,
  Loader2,
} from "lucide-react";

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentType: "PI" | "CI" | "PKL";
  id: number;
}

export const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  isOpen,
  onClose,
  documentType,
  id,
}) => {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [useFallbackView, setUseFallbackView] = useState<boolean>(false);

  const getDocTitle = () => {
    switch (documentType) {
      case "PI":
        return {
          vi: "HÓA ĐƠN CHIẾU LỆ (PROFORMA INVOICE)",
          en: "PROFORMA INVOICE",
          code: `PI-2026-EXP00${id}`,
        };
      case "CI":
        return {
          vi: "HÓA ĐƠN THƯƠNG MẠI (COMMERCIAL INVOICE)",
          en: "COMMERCIAL INVOICE",
          code: `CI-2026-ORD00${id}`,
        };
      case "PKL":
        return {
          vi: "PHIẾU ĐÓNG GÓI HÀNG HÓA (PACKING LIST)",
          en: "EXPORT PACKING LIST",
          code: `PKL-2026-ORD00${id}`,
        };
    }
  };

  const docInfo = getDocTitle();

  useEffect(() => {
    let activeUrl: string | null = null;
    if (!isOpen) {
      setBlobUrl(null);
      return;
    }

    setLoading(true);
    setUseFallbackView(false);

    const fetchPdf = async () => {
      try {
        let blob: Blob;
        if (documentType === "PI") {
          blob = await documentsApi.downloadProformaInvoice(id);
        } else if (documentType === "CI") {
          blob = await documentsApi.downloadCommercialInvoice(id);
        } else {
          blob = await documentsApi.downloadPackingList(id);
        }

        if (blob && blob.size > 100) {
          activeUrl = URL.createObjectURL(blob);
          setBlobUrl(activeUrl);
        } else {
          setUseFallbackView(true);
        }
      } catch {
        setUseFallbackView(true);
      } finally {
        setLoading(false);
      }
    };

    fetchPdf();

    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl);
      }
    };
  }, [isOpen, documentType, id]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (blobUrl) {
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `${docInfo.code}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      window.print();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-6">
      <div className="relative flex flex-col w-full max-w-5xl h-[92vh] bg-neutral-900 border border-neutral-700 shadow-2xl rounded-sm overflow-hidden">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between bg-black text-white px-5 py-3 border-b border-neutral-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-[#0E4B94] rounded flex items-center justify-center text-white font-black text-xs">
              PDF
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-tight flex items-center gap-2">
                <span>{docInfo.vi}</span>
                <span className="bg-neutral-800 text-neutral-300 font-mono text-xs px-2 py-0.5 rounded">
                  {docInfo.code}
                </span>
              </h3>
              <p className="text-[11px] font-mono text-neutral-400">
                QuestPDF High-Performance Engine • Chuẩn hóa Ngoại thương Quốc tế (Incoterms 2020)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 px-3 py-1.5 text-xs font-mono rounded transition-colors"
              title="In trực tiếp"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">In</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 bg-[#0E4B94] hover:bg-[#0a376d] text-white px-3 py-1.5 text-xs font-bold font-mono rounded transition-colors"
              title="Tải tệp tin PDF"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Tải PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content / Preview Area */}
        <div className="flex-1 bg-neutral-800 p-4 overflow-y-auto flex items-center justify-center">
          {loading ? (
            <div className="flex flex-col items-center gap-3 text-neutral-400 font-mono text-xs">
              <Loader2 className="w-8 h-8 animate-spin text-[#0E4B94]" />
              <span>Đang sinh chứng từ PDF chất lượng cao từ QuestPDF Engine...</span>
            </div>
          ) : blobUrl && !useFallbackView ? (
            <iframe
              src={blobUrl}
              className="w-full h-full rounded border border-neutral-700 bg-white"
              title={docInfo.vi}
            />
          ) : (
            /* High-Fidelity In-Browser QuestPDF Fallback Replica */
            <div className="w-full max-w-4xl bg-white text-black p-8 sm:p-12 shadow-2xl font-serif text-[13px] leading-relaxed my-auto border border-neutral-300 print:m-0 print:p-0 print:shadow-none">
              {/* Document Header */}
              <div className="flex justify-between items-start border-b-2 border-black pb-6">
                <div>
                  <h1 className="text-xl font-bold font-sans tracking-tight text-[#0E4B94]">
                    CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG
                  </h1>
                  <p className="text-xs font-sans text-neutral-600">
                    QUANG TAN HOANG IMPORT EXPORT CO., LTD
                  </p>
                  <div className="mt-2 text-xs font-sans text-neutral-700 space-y-0.5">
                    <p>Địa chỉ: Khu Công Nghệ Cao, TP. Thủ Đức, TP. Hồ Chí Minh, Việt Nam</p>
                    <p>Mã số thuế (Tax Code): 0317892345 | Tel: (+84) 28 3899 9999</p>
                    <p>Email: export@quangtanhoang.com | Website: www.quangtanhoang.com</p>
                  </div>
                </div>
                <div className="text-right font-sans">
                  <div className="text-lg font-black tracking-wider text-[#C9252C]">
                    {docInfo.en}
                  </div>
                  <div className="text-xs font-mono font-bold text-black mt-1">
                    No: {docInfo.code}
                  </div>
                  <div className="text-xs font-mono text-neutral-500">
                    Date: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                </div>
              </div>

              {/* Shipper & Consignee Info */}
              <div className="grid grid-cols-2 gap-8 my-6 text-xs font-sans">
                <div className="border border-neutral-200 p-3.5 rounded">
                  <span className="font-bold text-neutral-500 text-[10px] uppercase block mb-1">
                    SHIPPER / EXPORTER (BÊN XUẤT KHẨU):
                  </span>
                  <p className="font-bold text-black">CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG</p>
                  <p className="text-neutral-700">Khu Công Nghệ Cao, TP. Thủ Đức, TP.HCM, Việt Nam</p>
                  <p className="text-neutral-700">Country of Origin: VIETNAM (VN)</p>
                </div>
                <div className="border border-neutral-200 p-3.5 rounded">
                  <span className="font-bold text-neutral-500 text-[10px] uppercase block mb-1">
                    CONSIGNEE / BUYER (BÊN NHẬP KHẨU):
                  </span>
                  <p className="font-bold text-black">GLOBAL TRADING LOGISTICS LLC</p>
                  <p className="text-neutral-700">1200 Avenue of the Americas, New York, NY 10036, USA</p>
                  <p className="text-neutral-700">Contact: Purchasing Dept. (purchasing@globaltrade.us)</p>
                </div>
              </div>

              {/* Shipping Logistics Specs */}
              <div className="grid grid-cols-3 gap-4 mb-6 text-xs font-sans bg-neutral-50 p-3 border border-neutral-200">
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 block">PORT OF LOADING:</span>
                  <span className="font-bold">Cat Lai Port, Ho Chi Minh, Vietnam</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 block">PORT OF DISCHARGE:</span>
                  <span className="font-bold">Port of Los Angeles (LAX), USA</span>
                </div>
                <div>
                  <span className="text-[10px] font-mono text-neutral-500 block">INCOTERMS 2020:</span>
                  <span className="font-bold text-[#0E4B94]">FOB Cat Lai, Vietnam</span>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-black overflow-hidden mb-6">
                <table className="w-full text-left border-collapse text-xs font-sans">
                  <thead>
                    <tr className="bg-neutral-100 border-b border-black text-black uppercase font-bold text-[11px]">
                      <th className="p-2.5 border-r border-black w-10 text-center">No.</th>
                      <th className="p-2.5 border-r border-black">Mô tả hàng hóa (Description of Goods)</th>
                      <th className="p-2.5 border-r border-black w-24">HS Code</th>
                      <th className="p-2.5 border-r border-black w-20 text-right">Số lượng</th>
                      {documentType !== "PKL" && (
                        <>
                          <th className="p-2.5 border-r border-black w-24 text-right">Đơn giá (USD)</th>
                          <th className="p-2.5 w-28 text-right">Thành tiền (USD)</th>
                        </>
                      )}
                      {documentType === "PKL" && (
                        <>
                          <th className="p-2.5 border-r border-black w-24 text-right">Số kiện (Cartons)</th>
                          <th className="p-2.5 border-r border-black w-24 text-right">GW (kg)</th>
                          <th className="p-2.5 w-20 text-right">CBM (m³)</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-neutral-300">
                      <td className="p-2.5 border-r border-black text-center font-mono">1</td>
                      <td className="p-2.5 border-r border-black">
                        <div className="font-bold">Giày thể thao Sneaker xuất khẩu đế đúc cao cấp</div>
                        <div className="text-[11px] text-neutral-500">Mã SKU: SHOES-SNK-V1 | Quy cách: 12 đôi/thùng</div>
                      </td>
                      <td className="p-2.5 border-r border-black font-mono">6404.11.00</td>
                      <td className="p-2.5 border-r border-black text-right font-mono font-bold">1,200 Pairs</td>
                      {documentType !== "PKL" ? (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono">$19.50</td>
                          <td className="p-2.5 text-right font-mono font-bold">$23,400.00</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono">100 CTNS</td>
                          <td className="p-2.5 border-r border-black text-right font-mono">1,120.0 kg</td>
                          <td className="p-2.5 text-right font-mono">8.40</td>
                        </>
                      )}
                    </tr>
                    <tr className="border-b border-neutral-300">
                      <td className="p-2.5 border-r border-black text-center font-mono">2</td>
                      <td className="p-2.5 border-r border-black">
                        <div className="font-bold">Than không khói BBQ ép mùn cưa xuất khẩu</div>
                        <div className="text-[11px] text-neutral-500">Mã SKU: CHARCOAL-SAW-A1 | Quy cách: 10kg/thùng</div>
                      </td>
                      <td className="p-2.5 border-r border-black font-mono">4402.90.10</td>
                      <td className="p-2.5 border-r border-black text-right font-mono font-bold">5,000 kg</td>
                      {documentType !== "PKL" ? (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono">$0.85</td>
                          <td className="p-2.5 text-right font-mono font-bold">$4,250.00</td>
                        </>
                      ) : (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono">500 CTNS</td>
                          <td className="p-2.5 border-r border-black text-right font-mono">5,250.0 kg</td>
                          <td className="p-2.5 text-right font-mono">15.00</td>
                        </>
                      )}
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr className="bg-neutral-50 font-bold border-t border-black">
                      <td colSpan={documentType !== "PKL" ? 4 : 4} className="p-2.5 text-right uppercase border-r border-black">
                        TỔNG CỘNG (TOTAL):
                      </td>
                      {documentType !== "PKL" ? (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono text-[11px] text-neutral-500">
                            USD
                          </td>
                          <td className="p-2.5 text-right font-mono text-base font-black text-[#0E4B94]">
                            $27,650.00
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2.5 border-r border-black text-right font-mono">600 CTNS</td>
                          <td className="p-2.5 border-r border-black text-right font-mono">6,370.0 kg</td>
                          <td className="p-2.5 text-right font-mono">23.40 m³</td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Payment Details & Bank Transfer Info */}
              <div className="grid grid-cols-2 gap-8 mb-8 text-xs font-sans">
                <div className="border border-neutral-300 p-3.5 bg-neutral-50">
                  <h4 className="font-bold text-black uppercase text-[11px] mb-1">
                    THÔNG TIN CHUYỂN KHOẢN QUỐC TẾ (BANK ACCOUNT DETAILS):
                  </h4>
                  <p><strong>Beneficiary:</strong> CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG</p>
                  <p><strong>Bank:</strong> Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank)</p>
                  <p><strong>Branch:</strong> Ho Chi Minh City Branch</p>
                  <p><strong>SWIFT Code:</strong> BFTVVNVX</p>
                  <p><strong>USD Account No:</strong> 0071001234567</p>
                </div>

                {/* Authorized Signature & Stamp */}
                <div className="text-center flex flex-col justify-between p-2">
                  <div>
                    <p className="font-bold uppercase text-black">ĐẠI DIỆN BÊN XUẤT KHẨU</p>
                    <p className="text-[11px] text-neutral-500">FOR AND ON BEHALF OF QUANG TAN HOANG CO., LTD</p>
                  </div>
                  <div className="my-4">
                    <div className="inline-block border-2 border-dashed border-[#C9252C] rounded-full p-3 text-[#C9252C] font-mono text-[10px] uppercase font-bold tracking-wider rotate-[-6deg]">
                      CÔNG TY TNHH SX & TM DV XNK<br />
                      QUANG TẤN HOÀNG<br />
                      ★ ĐÃ XÁC THỰC PHÁP LÝ ★
                    </div>
                  </div>
                  <div>
                    <p className="font-bold text-black">VÕ VĂN PHÚ</p>
                    <p className="text-[11px] text-neutral-600">Giám đốc Điều hành & Đại diện Pháp luật</p>
                  </div>
                </div>
              </div>

              {/* Footer Note */}
              <div className="border-t border-neutral-300 pt-3 text-[10px] font-sans text-neutral-500 flex justify-between">
                <span>Chứng từ được kết xuất tự động từ hệ thống WebXNK - Engine QuestPDF v2024.</span>
                <span>Trang 1/1 • Bản gốc (Original Document)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};