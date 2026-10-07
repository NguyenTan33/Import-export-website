"use client";

import React, { useState } from "react";
import { CbmVisualizer } from "@/components/portal/CbmVisualizer";
import { CbmCalculationResult, CbmItemInput } from "@/types";
import { logisticsApi } from "@/services/api";
import { Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function CbmCalculatorPage() {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [items, setItems] = useState<CbmItemInput[]>([
    {
      productId: 1,
      productName: isVi ? "Giày sneaker xuất khẩu (12 đôi/thùng)" : "Canvas Sneakers (12 pairs/ctn)",
      quantity: 1200,
    },
    {
      productId: 2,
      productName: isVi ? "Than không khói BBQ (10 hộp/thùng)" : "Smokeless BBQ Charcoal (10 boxes/ctn)",
      quantity: 5000,
    },
    {
      productId: 5,
      productName: isVi ? "Băng keo OPP 48mm (72 cuộn/thùng)" : "OPP Packaging Tape 48mm (72 rolls/ctn)",
      quantity: 1440,
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Default initial calculation matching 38.5 CBM in RFQ sample
  const [calculation, setCalculation] = useState<CbmCalculationResult>({
    totalCartons: 620,
    totalCbm: 38.5,
    totalGrossWeightKg: 6750,
    suggestedContainerType: "1x40ft High Cube (40HC)",
    containerCapacityCbm: 76,
    volumeUtilizationPercentage: 50.66,
    weightLimitKg: 26500,
    weightUtilizationPercentage: 25.47,
  });

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const res = await logisticsApi.calculateCbm(items);
      setCalculation(res);
    } catch {
      // Local fallback algorithm if backend is offline
      const sneakerCbm = (items.find((i) => i.productId === 1)?.quantity || 0) * (0.084 / 12);
      const charcoalCbm = (items.find((i) => i.productId === 2)?.quantity || 0) * (0.03 / 10);
      const tapeCbm = (items.find((i) => i.productId === 5)?.quantity || 0) * (0.032 / 72);
      const total = Math.max(1, sneakerCbm + charcoalCbm + tapeCbm);
      const gw = total * 175;

      setCalculation({
        totalCartons: Math.round(total / 0.06),
        totalCbm: Number(total.toFixed(2)),
        totalGrossWeightKg: Math.round(gw),
        suggestedContainerType: total <= 33 ? "1x20ft General Purpose (20GP)" : "1x40ft High Cube (40HC)",
        containerCapacityCbm: 76,
        volumeUtilizationPercentage: Number(((total / 76) * 100).toFixed(2)),
        weightLimitKg: 26500,
        weightUtilizationPercentage: Number(((gw / 26500) * 100).toFixed(2)),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {isVi
            ? "TỐI ƯU HÓA THỂ TÍCH ĐÓNG THÙNG CONTAINER NGOẠI THƯƠNG"
            : "LOGISTICS & CONTAINER LOAD OPTIMIZATION (EXP-67)"}
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black mt-1">
          {isVi
            ? "Mô Phỏng Thể Tích Đóng Container CBM"
            : "Interactive Container CBM Packing Simulation"}
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          {isVi
            ? "Hệ thống tự động tính toán thể tích (CBM), tổng trọng lượng bì (Gross Weight) và gợi ý lựa chọn container 20GP (33 CBM), 40GP (67 CBM) hoặc 40HC (76 CBM)."
            : "Calculates total cargo volume (CBM), Gross Weight (GW), and recommends 20GP (33 CBM), 40GP (67 CBM), or 40HC (76 CBM) container stowing."}
        </p>
      </div>

      {/* Grid: Inputs and Container Visualizer */}
      <div className="space-y-8">
        {/* Item Inputs Table */}
        <div className="border border-black bg-white p-6 space-y-4 rounded">
          <div className="flex justify-between items-center border-b border-black/10 pb-3">
            <h2 className="text-base font-bold uppercase tracking-wide text-black flex items-center gap-2">
              <Layers className="w-4 h-4" />
              {isVi ? "Cấu hình số lượng hàng hóa đóng container" : "Container Cargo Configuration"}
            </h2>
            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="bg-[#0E4B94] hover:bg-[#0a376d] text-white px-5 py-2 text-xs font-bold uppercase disabled:opacity-50 rounded transition-colors"
            >
              {isLoading
                ? (isVi ? "Đang tính toán..." : "Calculating...")
                : (isVi ? "Tính toán & Cập nhật mô hình" : "Calculate & Update Simulation")}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-neutral-300 p-4 bg-neutral-50 space-y-2 rounded">
                <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5 rounded">
                  {isVi ? `MẶT HÀNG #${idx + 1}` : `CARGO ITEM #${idx + 1}`}
                </span>
                <p className="text-xs font-bold text-black">{item.productName}</p>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                    {isVi ? "Số lượng đặt (Pcs/Units):" : "Order Quantity (Units):"}
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].quantity = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-full border border-neutral-300 p-2 text-xs font-mono focus:outline-none focus:border-black bg-white rounded"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Visualizer Component */}
        <CbmVisualizer
          calculation={calculation}
          isLoading={isLoading}
          onRecalculate={handleCalculate}
        />
      </div>
    </div>
  );
}
