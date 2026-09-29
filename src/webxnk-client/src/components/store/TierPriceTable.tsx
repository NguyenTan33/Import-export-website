"use client";

import React from "react";
import { PriceTier } from "@/types";
import { TrendingDown, Check } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";

interface TierPriceTableProps {
  tiers: PriceTier[];
  retailPrice: number;
  selectedQuantity: number;
  onSelectQuantity?: (qty: number) => void;
}

export const TierPriceTable: React.FC<TierPriceTableProps> = ({
  tiers,
  retailPrice,
  selectedQuantity,
  onSelectQuantity,
}) => {
  const { formatPrice } = useCurrency();

  if (!tiers || tiers.length === 0) {
    return (
      <div className="border border-neutral-200 p-4 text-xs font-mono text-neutral-500 bg-neutral-50">
        Liên hệ bộ phận xuất khẩu để nhận báo giá sỉ cho lô hàng số lượng lớn (MOQ).
      </div>
    );
  }

  return (
    <div className="border border-neutral-300 bg-white overflow-hidden shadow-sm">
      <div className="bg-[#0E4B94] px-4 py-2.5 flex items-center justify-between text-white">
        <div className="flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-[#C9252C] bg-white rounded-full p-0.5" />
          <span className="text-xs font-bold uppercase tracking-wider">
            Bảng giá sỉ bậc thang B2B (Tier Pricing)
          </span>
        </div>
        <span className="text-[11px] font-mono opacity-90">Chiết khấu theo số lượng MOQ</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-100 text-neutral-700 uppercase border-b border-neutral-200">
            <tr>
              <th className="p-3 font-bold">Số lượng đặt (MOQ)</th>
              <th className="p-3 font-bold">Đơn giá B2B</th>
              <th className="p-3 font-bold">Chiết khấu</th>
              <th className="p-3 font-bold text-right">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {tiers.map((tier, idx) => {
              const isCurrent =
                selectedQuantity >= tier.minQuantity &&
                (!tier.maxQuantity || selectedQuantity <= tier.maxQuantity);

              const rangeLabel = tier.maxQuantity
                ? `${tier.minQuantity.toLocaleString()} - ${tier.maxQuantity.toLocaleString()} sp`
                : `Từ ${tier.minQuantity.toLocaleString()} sp trở lên`;

              return (
                <tr
                  key={idx}
                  className={`transition-colors ${
                    isCurrent
                      ? "bg-blue-50/80 font-bold border-l-4 border-l-[#0E4B94]"
                      : "hover:bg-neutral-50"
                  }`}
                >
                  <td className="p-3 text-neutral-900">{rangeLabel}</td>
                  <td className="p-3 text-base font-black text-[#0E4B94]">
                    {formatPrice(tier.unitPriceUsd)}{" "}
                    <span className="text-[10px] font-normal text-neutral-500">/đơn vị</span>
                  </td>
                  <td className="p-3">
                    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-[#C9252C]/10 text-[#C9252C] border border-[#C9252C]/20 rounded">
                      Tiết kiệm {tier.discountPercentage}%
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    {onSelectQuantity && (
                      <button
                        type="button"
                        onClick={() => onSelectQuantity(tier.minQuantity)}
                        className={`px-3 py-1 text-[11px] font-bold uppercase transition-colors rounded ${
                          isCurrent
                            ? "bg-[#0E4B94] text-white"
                            : "border border-neutral-300 hover:border-black text-neutral-800"
                        }`}
                      >
                        {isCurrent ? (
                          <span className="flex items-center gap-1">
                            <Check className="w-3 h-3" /> Đang chọn
                          </span>
                        ) : (
                          `Áp dụng (${tier.minQuantity})`
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-neutral-50 border-t border-neutral-200 flex justify-between items-center text-xs">
        <span className="text-neutral-600 font-mono">
          Giá bán lẻ tham khảo (B2C): <strong className="text-black">{formatPrice(retailPrice)}</strong>
        </span>
        <span className="text-[11px] text-neutral-500 italic">
          * Đã bao gồm tiêu chuẩn kiểm định xuất khẩu quốc tế
        </span>
      </div>
    </div>
  );
};