"use client";

import React, { useState } from "react";
import { CbmVisualizer } from "@/components/portal/CbmVisualizer";
import { CbmCalculationResult, CbmItemInput } from "@/types";
import { logisticsApi } from "@/services/api";
import { Layers } from "lucide-react";

export default function CbmCalculatorPage() {
  const [items, setItems] = useState<CbmItemInput[]>([
    { productId: 1, productName: "Giày sneaker xuất khẩu (12 đôi/thùng)", quantity: 1200 },
    { productId: 2, productName: "Than không khói BBQ (10 hộp/thùng)", quantity: 5000 },
    { productId: 5, productName: "Băng keo OPP 48mm (72 cuộn/thùng)", quantity: 1440 },
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
          LOGISTICS & CONTAINER LOAD OPTIMIZATION (EXP-67)
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black">
          Mô phỏng thể tích đóng Container 3D/2D CBM
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          Hệ thống tự động tính toán thể tích (CBM), tổng trọng lượng bì (Gross Weight) và gợi ý lựa chọn container 20GP (33 CBM), 40GP (67 CBM) hoặc 40HC (76 CBM).
        </p>
      </div>

      {/* Grid: Inputs and Container Visualizer */}
      <div className="space-y-8">
        {/* Item Inputs Table */}
        <div className="border border-black bg-white p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-black/10 pb-3">
            <h2 className="text-base font-bold uppercase tracking-wide text-black flex items-center gap-2">
              <Layers className="w-4 h-4" />
              Cấu hình số lượng hàng hóa đóng container
            </h2>
            <button
              onClick={handleCalculate}
              disabled={isLoading}
              className="bg-black text-white px-5 py-2 text-xs font-bold uppercase hover:bg-neutral-800 disabled:opacity-50"
            >
              {isLoading ? "Đang tính toán..." : "Tính toán & Cập nhật mô hình"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {items.map((item, idx) => (
              <div key={idx} className="border border-black p-4 bg-neutral-50 space-y-2">
                <span className="text-[10px] font-mono font-bold bg-black text-white px-1.5 py-0.5">
                  MẶT HÀNG #{idx + 1}
                </span>
                <p className="text-xs font-bold text-black">{item.productName}</p>
                <div>
                  <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                    Số lượng cái/đôi/cuộn:
                  </label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].quantity = Number(e.target.value);
                      setItems(updated);
                    }}
                    className="w-full border border-black p-2 text-xs font-mono focus:outline-none bg-white"
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
