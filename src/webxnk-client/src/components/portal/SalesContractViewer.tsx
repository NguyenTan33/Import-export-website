"use client";

import React, { useState } from "react";
import { SalesContract } from "@/types";
import { SignaturePadModal } from "./SignaturePadModal";
import {
  FileCheck,
  Download,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  Printer,
  Clock,
  Building2,
  Globe,
  DollarSign,
  Truck,
} from "lucide-react";

interface SalesContractViewerProps {
  contract: SalesContract;
  userRole: "SELLER" | "BUYER" | "ADMIN";
  onSignContract?: (
    signatureData: string,
    signerName: string,
    signerTitle: string,
    includeCompanyStamp?: boolean
  ) => Promise<void>;
  onDownloadPdf?: () => Promise<void>;
  onRefresh?: () => void;
  isSigning?: boolean;
}

export const SalesContractViewer: React.FC<SalesContractViewerProps> = ({
  contract,
  userRole,
  onSignContract,
  onDownloadPdf,
  isSigning = false,
}) => {
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const canSignAsBuyer =
    (userRole === "BUYER" || userRole === "ADMIN") &&
    contract.status !== "BUYER_SIGNED" &&
    contract.status !== "LEGALLY_BINDING" &&
    contract.status !== "CANCELLED";

  const canSignAsSeller =
    (userRole === "SELLER" || userRole === "ADMIN") &&
    contract.status !== "SELLER_SIGNED" &&
    contract.status !== "LEGALLY_BINDING" &&
    contract.status !== "CANCELLED";

  const handleDownload = async () => {
    if (!onDownloadPdf) return;
    try {
      setIsDownloading(true);
      await onDownloadPdf();
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = () => {
    switch (contract.status) {
      case "LEGALLY_BINDING":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            LEGALLY BINDING / ĐÃ KÝ KẾT HỢP LỆ
          </span>
        );
      case "SELLER_SIGNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            BÊN BÁN ĐÃ KÝ (CHỜ BÊN MUA)
          </span>
        );
      case "BUYER_SIGNED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Clock className="w-4 h-4 text-blue-600" />
            BÊN MUA ĐÃ KÝ (CHỜ BÊN BÁN)
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-300">
            HỢP ĐỒNG ĐÃ HỦY
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            <FileCheck className="w-4 h-4 text-slate-500" />
            BẢN THẢO (DRAFT)
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden font-sans">
      {/* Top Banner Toolbar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <h2 className="text-lg font-bold tracking-tight">HỢP ĐỒNG NGOẠI THƯƠNG ĐIỆN TỬ</h2>
            <span className="text-xs font-mono bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded border border-blue-500/30">
              E-CONTRACT
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Số Hợp đồng: <strong className="text-white font-mono">{contract.contractNumber}</strong> | Ngày lập:{" "}
            {new Date(contract.createdAt).toLocaleDateString("vi-VN")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {getStatusBadge()}

          {onDownloadPdf && (
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition disabled:opacity-50"
            >
              {isDownloading ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Tải PDF Hợp đồng (ICC Standard)
            </button>
          )}

          <button
            onClick={() => window.print()}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
            title="In hợp đồng"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contract Document Body (Paper-like aesthetic) */}
      <div className="p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/30">
        {/* Document Header */}
        <div className="text-center pb-6 border-b border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            MẪU HỢP ĐỒNG MUA BÁN QUỐC TẾ THEO TIÊU CHUẨN ICC MODEL CONTRACT
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            HỢP ĐỒNG MUA BÁN HÀNG HÓA QUỐC TẾ
          </h1>
          <h2 className="text-sm font-semibold text-blue-900 uppercase tracking-widest mt-0.5">
            INTERNATIONAL SALE CONTRACT
          </h2>
          <div className="text-xs text-slate-600 mt-2">
            Số / No: <span className="font-mono font-bold text-slate-900">{contract.contractNumber}</span> — Căn
            cứ RFQ: <span className="font-mono">{contract.rfqNumber}</span>
          </div>
        </div>

        {/* Both Parties Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SELLER */}
          <div className="p-5 bg-white rounded-xl border border-blue-100 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm border-b border-blue-50 pb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <span>BÊN BÁN / THE SELLER:</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{contract.sellerCompanyName}</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <span className="font-medium text-slate-700">Mã số thuế / Tax ID:</span> {contract.sellerTaxCode}
              </div>
              <div>
                <span className="font-medium text-slate-700">Địa chỉ / Address:</span> {contract.sellerAddress}
              </div>
              <div>
                <span className="font-medium text-slate-700">Đại diện / Representative:</span>{" "}
                <strong className="text-slate-800">{contract.sellerRepresentative}</strong> ({contract.sellerTitle})
              </div>
            </div>
          </div>

          {/* BUYER */}
          <div className="p-5 bg-white rounded-xl border border-indigo-100 shadow-sm space-y-2.5">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm border-b border-indigo-50 pb-2">
              <Globe className="w-5 h-5 text-indigo-600" />
              <span>BÊN MUA / THE BUYER:</span>
            </div>
            <div className="text-sm font-bold text-slate-900">{contract.buyerCompanyName}</div>
            <div className="text-xs text-slate-600 space-y-1">
              <div>
                <span className="font-medium text-slate-700">Mã số thuế / Tax ID:</span> {contract.buyerTaxCode}
              </div>
              <div>
                <span className="font-medium text-slate-700">Địa chỉ / Address:</span> {contract.buyerAddress}
              </div>
              <div>
                <span className="font-medium text-slate-700">Đại diện / Representative:</span>{" "}
                <strong className="text-slate-800">{contract.buyerRepresentative}</strong> ({contract.buyerTitle})
              </div>
            </div>
          </div>
        </div>

        {/* Commercial & Shipping Terms Summary */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Điều khoản thương mại & Vận chuyển / Commercial & Delivery Terms
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
                <Truck className="w-4 h-4 text-blue-600" />
                Incoterms 2020
              </div>
              <div className="font-bold text-slate-900 text-sm">{contract.incotermCode}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-slate-500 font-medium mb-1">Cảng xếp / POL</div>
              <div className="font-semibold text-slate-900">{contract.portOfLoading}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="text-slate-500 font-medium mb-1">Cảng dỡ / POD</div>
              <div className="font-semibold text-slate-900">{contract.portOfDischarge}</div>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-1.5 text-slate-500 font-medium mb-1">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                Thanh toán / Payment
              </div>
              <div className="font-semibold text-slate-900 truncate" title={contract.paymentTerms}>
                {contract.paymentTerms}
              </div>
            </div>
          </div>
        </div>

        {/* Article 1 & 2: Commodity & Price Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Điều 1 & 2: Hàng hóa, Số lượng & Giá trị / Goods, Quantity & Price
            </h3>
            <span className="text-xs text-slate-500 font-mono">Currency: {contract.currency}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-4 w-12 text-center">STT</th>
                  <th className="py-2.5 px-4">Tên Sản Phẩm / Description</th>
                  <th className="py-2.5 px-4">Mã SKU</th>
                  <th className="py-2.5 px-4">Quy Cách Đóng Gói</th>
                  <th className="py-2.5 px-4 text-right">Số Lượng</th>
                  <th className="py-2.5 px-4 text-right">Đơn Giá ({contract.currency})</th>
                  <th className="py-2.5 px-4 text-right">Thành Tiền ({contract.currency})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(contract.items) ? contract.items : []).map((item, idx) => (
                  <tr key={item.productId ?? `contract-item-${idx}`} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-4 text-center font-medium text-slate-500">{idx + 1}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{item.productName}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{item.sku}</td>
                    <td className="py-3 px-4 text-slate-600">{item.packagingSpec || "Export Standard Carton"}</td>
                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      {item.quantity.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-800">
                      ${item.unitPriceUsd.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${item.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                <tr>
                  <td colSpan={6} className="py-3 px-4 text-right font-bold text-slate-900 uppercase text-xs">
                    TỔNG CỘNG GIÁ TRỊ HỢP ĐỒNG / TOTAL CONTRACT VALUE:
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-sm text-blue-900">
                    ${contract.totalAmountUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}{" "}
                    {contract.currency}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* General Legal Articles Preview */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm text-xs text-slate-600 space-y-2 leading-relaxed">
          <div className="font-bold text-slate-800 uppercase">Các điều khoản chuẩn ICC Model Contract:</div>
          <p>
            <strong>Điều 3 (Chất lượng & Kiểm định):</strong> Hàng hóa tuân thủ theo tiêu chuẩn xuất khẩu của Bên
            Bán hoặc thỏa thuận kỹ thuật kèm theo. Giấy chứng nhận chất lượng (C/Q) do Bên Bán hoặc cơ quan giám
            định độc lập (SGS/Bureau Veritas) cấp tại cảng bốc.
          </p>
          <p>
            <strong>Điều 4 (Bất khả kháng):</strong> Áp dụng điều khoản Bất Khả Kháng của Phòng Thương Mại Quốc
            Tế (ICC Force Majeure Clause 2020).
          </p>
          <p>
            <strong>Điều 5 (Trọng tài giải quyết tranh chấp):</strong> Mọi tranh chấp phát sinh sẽ được giải quyết
            chung thẩm tại Trung tâm Trọng tài Quốc tế Việt Nam (VIAC) hoặc ICC Court of Arbitration.
          </p>
        </div>

        {/* Dual Electronic Signatures Section */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4 text-center">
            Điều 6: Đại Diện Ký Kết Hợp Đồng & Xác Thực Điện Tử / Electronic Execution & Signatures
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
            {/* BUYER SIGNATURE BOX */}
            <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/50 min-h-[260px]">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                  ĐẠI DIỆN BÊN MUA / FOR AND ON BEHALF OF THE BUYER
                </div>
                <div className="text-xs text-slate-500 text-center mt-0.5">{contract.buyerCompanyName}</div>
              </div>

              <div className="my-4 flex flex-col items-center justify-center min-h-[110px]">
                {contract.buyerSignatureData ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={contract.buyerSignatureData}
                      alt="Buyer Signature"
                      className="max-h-24 max-w-[220px] object-contain drop-shadow-sm"
                    />
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-2">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Đã ký số: {new Date(contract.buyerSignedAt!).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-xs text-slate-400 mb-2">Chưa có chữ ký điện tử của Bên Mua</div>
                    {canSignAsBuyer && onSignContract && (
                      <button
                        onClick={() => setIsSignModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition"
                      >
                        <Edit3 className="w-4 h-4" />
                        Ký Điện Tử Bên Mua
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center border-t border-slate-200 pt-3">
                <div className="text-xs font-bold text-slate-900">
                  {contract.buyerSignedBy || contract.buyerRepresentative}
                </div>
                <div className="text-[11px] text-slate-500">{contract.buyerTitle}</div>
              </div>
            </div>

            {/* SELLER SIGNATURE BOX */}
            <div className="border border-slate-200 rounded-xl p-5 flex flex-col justify-between bg-slate-50/50 min-h-[260px]">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 text-center">
                  ĐẠI DIỆN BÊN BÁN / FOR AND ON BEHALF OF THE SELLER
                </div>
                <div className="text-xs text-slate-500 text-center mt-0.5">{contract.sellerCompanyName}</div>
              </div>

              <div className="my-4 flex flex-col items-center justify-center min-h-[110px] relative">
                {contract.sellerSignatureData ? (
                  <div className="flex flex-col items-center relative">
                    <img
                      src={contract.sellerSignatureData}
                      alt="Seller Signature"
                      className="max-h-24 max-w-[220px] object-contain drop-shadow-sm z-10"
                    />

                    {/* Official Company Red Seal Overlay */}
                    {contract.sellerStampData && (
                      <div className="absolute -top-2 -right-6 w-24 h-24 rounded-full border-4 border-dashed border-red-600/80 flex flex-col items-center justify-center text-center text-red-600 bg-red-500/10 rotate-12 pointer-events-none select-none z-0">
                        <div className="text-[7px] font-black uppercase leading-tight tracking-tighter px-1">
                          VIETNAM EXPORT
                        </div>
                        <div className="text-[8px] font-extrabold my-0.5">★ DẤU MỘC ★</div>
                        <div className="text-[7px] font-bold">MSDN 0318999888</div>
                      </div>
                    )}

                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 mt-2 z-10">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Đã ký số: {new Date(contract.sellerSignedAt!).toLocaleString("vi-VN")}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-4">
                    <div className="text-xs text-slate-400 mb-2">Chưa có chữ ký điện tử của Bên Bán</div>
                    {canSignAsSeller && onSignContract && (
                      <button
                        onClick={() => setIsSignModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition"
                      >
                        <Edit3 className="w-4 h-4" />
                        Ký Điện Tử & Đóng Dấu
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="text-center border-t border-slate-200 pt-3">
                <div className="text-xs font-bold text-slate-900">
                  {contract.sellerSignedBy || contract.sellerRepresentative}
                </div>
                <div className="text-[11px] text-slate-500">{contract.sellerTitle}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Cryptographic SHA-256 Audit Seal */}
        {contract.digitalSignatureHash && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold flex items-center gap-1.5">
                  NIÊM PHONG TOÀN VẸN CHỮ KÝ SỐ MÃ HÓA (DIGITAL INTEGRITY SEAL)
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
                    SHA-256
                  </span>
                </div>
                <div className="font-mono text-[11px] text-emerald-800/80 break-all select-all mt-0.5">
                  {contract.digitalSignatureHash}
                </div>
                <div className="text-[10px] text-emerald-700 mt-0.5">
                  * Khóa băm xác thực tài liệu hợp đồng gốc không bị chỉnh sửa sau khi 2 bên hoàn tất ký.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Signature Modal */}
      {isSignModalOpen && onSignContract && (
        <SignaturePadModal
          isOpen={isSignModalOpen}
          onClose={() => setIsSignModalOpen(false)}
          onConfirm={async (data, name, title, stamp) => {
            await onSignContract(data, name, title, stamp);
            setIsSignModalOpen(false);
          }}
          role={userRole === "BUYER" ? "BUYER" : "SELLER"}
          defaultSignerName={
            userRole === "BUYER" ? contract.buyerRepresentative : contract.sellerRepresentative
          }
          defaultSignerTitle={userRole === "BUYER" ? contract.buyerTitle : contract.sellerTitle}
          isSubmitting={isSigning}
        />
      )}
    </div>
  );
};
