"use client";

import React, { useState } from "react";
import { RfqCounterOffer, SubmitCounterOfferRequest } from "@/types";
import {
  MessageSquare,
  CheckCircle2,
  Clock,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  ThumbsUp,
  FileText,
} from "lucide-react";

interface CounterOfferTimelineProps {
  rfqId: number;
  currentStatus: string;
  offers: RfqCounterOffer[];
  userRole: "BUYER" | "SELLER" | "ADMIN";
  currentUnitPrice?: number;
  currentIncoterm?: string;
  currentPaymentTerms?: string;
  onSubmitCounterOffer: (data: SubmitCounterOfferRequest) => Promise<void>;
  onAcceptCounterOffer: (offerId: number) => Promise<void>;
  onGenerateContract?: () => Promise<void>;
  isSubmitting?: boolean;
  hasContract?: boolean;
}

export const CounterOfferTimeline: React.FC<CounterOfferTimelineProps> = ({
  offers,
  userRole,
  currentUnitPrice,
  currentIncoterm = "FOB",
  currentPaymentTerms = "30% T/T Advance, 70% against B/L copy",
  onSubmitCounterOffer,
  onAcceptCounterOffer,
  onGenerateContract,
  isSubmitting = false,
  hasContract = false,
}) => {
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<number | undefined>(currentUnitPrice);
  const [proposedIncoterm, setProposedIncoterm] = useState(currentIncoterm);
  const [proposedPaymentTerms, setProposedPaymentTerms] = useState(currentPaymentTerms);
  const [validityDays, setValidityDays] = useState(7);
  const [note, setNote] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  const latestOffer = offers.length > 0 ? offers[offers.length - 1] : null;
  const isAccepted = offers.some((o) => o.status === "ACCEPTED");

  // Determine if the current user can accept the latest offer
  const canAcceptLatest =
    latestOffer &&
    latestOffer.status === "PENDING" &&
    ((latestOffer.senderRole === "BUYER" && (userRole === "SELLER" || userRole === "ADMIN")) ||
      (latestOffer.senderRole === "SELLER" && (userRole === "BUYER" || userRole === "ADMIN")));

  const handleAccept = async (offerId: number) => {
    try {
      setActionLoadingId(offerId);
      await onAcceptCounterOffer(offerId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note.trim()) {
      alert("Vui lòng ghi chú lý do đề xuất đàm phán!");
      return;
    }

    await onSubmitCounterOffer({
      proposedUnitPriceUsd: proposedPrice,
      proposedIncotermCode: proposedIncoterm,
      proposedPaymentTerms,
      validityDays,
      note: note.trim(),
    });

    setNote("");
    setShowOfferForm(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden font-sans">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MessageSquare className="w-6 h-6 text-blue-400" />
          <div>
            <h3 className="text-base font-bold">Lịch Sử Đàm Phán B2B Đa Vòng (Counter-Offers)</h3>
            <p className="text-xs text-slate-300">
              Cơ chế phản hồi giá, điều kiện Incoterms và thanh toán hai chiều
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAccepted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ĐÃ ĐẠT THỎA THUẬN GIÁ
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Clock className="w-4 h-4 text-amber-400" />
              ĐANG ĐÀM PHÁN ({offers.length} Vòng)
            </span>
          )}

          {!isAccepted && !showOfferForm && (
            <button
              onClick={() => setShowOfferForm(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition"
            >
              <PlusCircle className="w-4 h-4" />
              Gửi Đề Xuất Mới
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* If agreement reached & seller can generate contract */}
        {isAccepted && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-sm text-emerald-950">
                  Thương lượng thành công! Hai bên đã thống nhất điều khoản.
                </div>
                <div className="text-xs text-emerald-800">
                  {hasContract
                    ? "Hợp đồng ngoại thương điện tử đã được tạo và sẵn sàng ký kết."
                    : "Đại diện Bên Bán có thể xuất bản Hợp đồng Ngoại thương điện tử (E-Contract) ngay bây giờ."}
                </div>
              </div>
            </div>

            {!hasContract && (userRole === "SELLER" || userRole === "ADMIN") && onGenerateContract && (
              <button
                onClick={onGenerateContract}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                <FileText className="w-4 h-4" />
                Tạo Hợp Đồng Ngoại Thương
              </button>
            )}
          </div>
        )}

        {/* Counter Offer Form (when active) */}
        {showOfferForm && !isAccepted && (
          <form
            onSubmit={handleSubmit}
            className="p-5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-4 animate-in fade-in"
          >
            <div className="flex items-center justify-between border-b border-blue-100 pb-2">
              <h4 className="text-sm font-bold text-blue-950">
                Tạo Đề Xuất Phản Hồi (Counter-Offer Revision #{offers.length + 1})
              </h4>
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Đơn giá đề xuất ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={proposedPrice ?? ""}
                  onChange={(e) => setProposedPrice(parseFloat(e.target.value) || undefined)}
                  placeholder="VD: 18.50"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Điều kiện Incoterms 2020
                </label>
                <select
                  value={proposedIncoterm}
                  onChange={(e) => setProposedIncoterm(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="FOB">FOB - Free on Board</option>
                  <option value="CIF">CIF - Cost, Insurance and Freight</option>
                  <option value="CFR">CFR - Cost and Freight</option>
                  <option value="EXW">EXW - Ex Works</option>
                  <option value="DDP">DDP - Delivered Duty Paid</option>
                  <option value="CIP">CIP - Carriage and Insurance Paid to</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Hiệu lực đề xuất (Ngày)
                </label>
                <select
                  value={validityDays}
                  onChange={(e) => setValidityDays(parseInt(e.target.value, 10))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value={3}>3 ngày</option>
                  <option value={5}>5 ngày</option>
                  <option value={7}>7 ngày (Chuẩn B2B)</option>
                  <option value={14}>14 ngày</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phương thức thanh toán đề xuất
              </label>
              <input
                type="text"
                value={proposedPaymentTerms}
                onChange={(e) => setProposedPaymentTerms(e.target.value)}
                placeholder="VD: 30% T/T Advance, 70% against B/L copy"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ghi chú & Lý lẽ đàm phán <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nêu rõ lý do giảm giá, số lượng container lớn hoặc hỗ trợ chi phí vận chuyển biển..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowOfferForm(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !note.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition disabled:opacity-50"
              >
                {isSubmitting ? "Đang gửi..." : "Gửi Đề Xuất Phản Hồi"}
              </button>
            </div>
          </form>
        )}

        {/* Timeline of Revisions */}
        <div className="space-y-4">
          {offers.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
              Chưa có phiên bản phản hồi đàm phán nào. Bạn có thể gửi đề xuất điều chỉnh giá hoặc Incoterms đầu tiên.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
              {offers.map((offer) => {
                const isBuyer = offer.senderRole === "BUYER";
                return (
                  <div key={offer.id} className="relative group">
                    {/* Dot on timeline */}
                    <div
                      className={`absolute -left-6 top-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-[10px] font-bold text-white ${
                        offer.status === "ACCEPTED"
                          ? "bg-emerald-500"
                          : isBuyer
                          ? "bg-indigo-600"
                          : "bg-blue-600"
                      }`}
                    >
                      {offer.revisionNumber}
                    </div>

                    {/* Offer Card */}
                    <div
                      className={`p-4 rounded-xl border transition ${
                        offer.status === "ACCEPTED"
                          ? "bg-emerald-50/70 border-emerald-300 shadow-sm"
                          : offer.status === "SUPERSEDED"
                          ? "bg-slate-50 border-slate-200 opacity-70"
                          : "bg-white border-slate-200 shadow-sm"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              isBuyer ? "bg-indigo-100 text-indigo-800" : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {isBuyer ? "BUYER (Người Mua)" : "SELLER (Người Bán)"}
                          </span>
                          <span className="text-xs font-bold text-slate-800">{offer.senderName}</span>
                          <span className="text-[11px] text-slate-400">
                            • {new Date(offer.createdAt).toLocaleString("vi-VN")}
                          </span>
                        </div>

                        <div>
                          {offer.status === "ACCEPTED" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                              CHẤP THUẬN (ACCEPTED)
                            </span>
                          )}
                          {offer.status === "PENDING" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full border border-amber-300">
                              CHỜ PHẢN HỒI (PENDING)
                            </span>
                          )}
                          {offer.status === "SUPERSEDED" && (
                            <span className="px-2 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-500 rounded-full">
                              ĐÃ THAY THẾ (SUPERSEDED)
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Offer Details */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-3">
                        {offer.proposedUnitPriceUsd && (
                          <div className="flex items-center gap-2 p-2 rounded bg-slate-50">
                            <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
                            <div>
                              <div className="text-[10px] text-slate-500">Đơn giá đề xuất</div>
                              <div className="font-bold text-slate-900">
                                ${offer.proposedUnitPriceUsd.toFixed(2)} / Đơn vị
                              </div>
                            </div>
                          </div>
                        )}

                        {offer.proposedIncotermCode && (
                          <div className="p-2 rounded bg-slate-50">
                            <div className="text-[10px] text-slate-500">Incoterm đề xuất</div>
                            <div className="font-bold text-blue-900">{offer.proposedIncotermCode}</div>
                          </div>
                        )}

                        {offer.proposedPaymentTerms && (
                          <div className="p-2 rounded bg-slate-50 col-span-2 sm:col-span-1">
                            <div className="text-[10px] text-slate-500">Điều kiện thanh toán</div>
                            <div className="font-semibold text-slate-800 truncate" title={offer.proposedPaymentTerms}>
                              {offer.proposedPaymentTerms}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Note */}
                      <div className="text-xs text-slate-700 bg-slate-50/60 p-2.5 rounded-lg border border-slate-100 italic">
                        &ldquo;{offer.note}&rdquo;
                      </div>

                      {/* Expiration warning */}
                      {offer.expiresAt && offer.status === "PENDING" && (
                        <div className="text-[10px] text-amber-700 mt-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Hạn chót phản hồi: {new Date(offer.expiresAt).toLocaleString("vi-VN")}
                        </div>
                      )}

                      {/* Action buttons on latest offer */}
                      {offer.id === latestOffer?.id && canAcceptLatest && (
                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowOfferForm(true)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                          >
                            Phản hồi giá khác (Counter)
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAccept(offer.id)}
                            disabled={actionLoadingId === offer.id}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition disabled:opacity-50"
                          >
                            {actionLoadingId === offer.id ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <ThumbsUp className="w-4 h-4" />
                            )}
                            Chấp Thuận Mức Giá Này
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
