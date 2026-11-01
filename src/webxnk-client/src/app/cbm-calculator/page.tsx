"use client";

import React, { useState } from "react";
import { CbmVisualizer } from "@/components/portal/CbmVisualizer";
import { LandedCostCalculator } from "@/components/logistics/LandedCostCalculator";
import { CbmCalculationResult, CbmItemInput } from "@/types";
import { logisticsApi } from "@/services/api";
import { Layers } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { generateRealisticStowedBoxes, ItemStowageSpec } from "@/utils/fallbackStowage";

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

  // Default initial calculation matching 38.5 CBM in RFQ sample with full 3D coordinates
  const [calculation, setCalculation] = useState<CbmCalculationResult>(() => {
    const init3D = generateRealisticStowedBoxes("40HC");
    return {
      totalCartons: 620,
      totalCbm: 38.5,
      totalGrossWeightKg: 6750,
      suggestedContainerType: "1x40ft High Cube (40HC)",
      containerCapacityCbm: 76,
      volumeUtilizationPercentage: 50.66,
      weightLimitKg: 26500,
      weightUtilizationPercentage: 25.47,
      stowedBoxes: init3D.stowedBoxes,
      centerOfGravity: init3D.centerOfGravity,
    };
  });

  const handleCalculate = async () => {
    setIsLoading(true);
    try {
      const res = await logisticsApi.calculateCbm(items);
      if (!res.stowedBoxes || res.stowedBoxes.length === 0) {
        const contType = res.totalCbm <= 33 ? "20GP" : "40HC";
        const generated = generateRealisticStowedBoxes(contType);
        res.stowedBoxes = generated.stowedBoxes;
        res.centerOfGravity = generated.centerOfGravity;
      }
      setCalculation(res);
    } catch {
      // Local fallback algorithm if backend is offline
      const sneakerQty = items.find((i) => i.productId === 1)?.quantity || 0;
      const charcoalQty = items.find((i) => i.productId === 2)?.quantity || 0;
      const tapeQty = items.find((i) => i.productId === 5)?.quantity || 0;

      const sneakerCartons = Math.max(1, Math.round(sneakerQty / 12));
      const charcoalCartons = Math.max(1, Math.round(charcoalQty / 10));
      const tapeCartons = Math.max(1, Math.round(tapeQty / 72));

      const sneakerCbm = sneakerCartons * 0.084;
      const charcoalCbm = charcoalCartons * 0.044;
      const tapeCbm = tapeCartons * 0.04;
      const total = Math.max(1, sneakerCbm + charcoalCbm + tapeCbm);
      const gw = sneakerCartons * 12.5 + charcoalCartons * 10 + tapeCartons * 14;

      const contType: "20GP" | "40GP" | "40HC" = total <= 33 ? "20GP" : "40HC";
      const itemSpecs: ItemStowageSpec[] = [
        {
          productId: 1,
          itemName: isVi ? "Giày sneaker xuất khẩu (12 đôi/thùng)" : "Canvas Sneakers",
          cartonLengthM: 0.6,
          cartonWidthM: 0.4,
          cartonHeightM: 0.35,
          weightKgPerCarton: 12.5,
          totalCartons: sneakerCartons,
          colorHex: "#0E4B94",
        },
        {
          productId: 2,
          itemName: isVi ? "Than không khói BBQ (10 hộp/thùng)" : "Smokeless BBQ Charcoal",
          cartonLengthM: 0.45,
          cartonWidthM: 0.35,
          cartonHeightM: 0.28,
          weightKgPerCarton: 10.0,
          totalCartons: charcoalCartons,
          colorHex: "#D97706",
        },
        {
          productId: 5,
          itemName: isVi ? "Băng keo OPP 48mm (72 cuộn/thùng)" : "OPP Packaging Tape",
          cartonLengthM: 0.4,
          cartonWidthM: 0.4,
          cartonHeightM: 0.25,
          weightKgPerCarton: 14.0,
          totalCartons: tapeCartons,
          colorHex: "#059669",
        },
      ];

      const sim3D = generateRealisticStowedBoxes(contType, itemSpecs);

      setCalculation({
        totalCartons: sneakerCartons + charcoalCartons + tapeCartons,
        totalCbm: Number(total.toFixed(2)),
        totalGrossWeightKg: Math.round(gw),
        suggestedContainerType: total <= 33 ? "1x20ft General Purpose (20GP)" : "1x40ft High Cube (40HC)",
        containerCapacityCbm: contType === "20GP" ? 33 : 76,
        volumeUtilizationPercentage: Number(((total / (contType === "20GP" ? 33 : 76)) * 100).toFixed(2)),
        weightLimitKg: contType === "20GP" ? 21800 : 26500,
        weightUtilizationPercentage: Number(((gw / (contType === "20GP" ? 21800 : 26500)) * 100).toFixed(2)),
        stowedBoxes: sim3D.stowedBoxes,
        centerOfGravity: sim3D.centerOfGravity,
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
            ? "TỐI ƯU HÓA THỂ TÍCH ĐÓNG THÙNG CONTAINER & TÍNH GIÁ VỐN LANDED COST NGOẠI THƯƠNG"
            : "LOGISTICS, 3D CONTAINER LOAD PLANNER & FTA LANDED COST SUITE (EXP-67)"}
        </span>
        <h1 className="text-3xl font-black uppercase tracking-tight text-black mt-1">
          {isVi
            ? "Mô Phỏng Thể Tích Đóng Container CBM & Thuế Quan FTA"
            : "Interactive 3D Container CBM & FTA Landed Cost Simulator"}
        </h1>
        <p className="text-xs text-neutral-600 mt-1">
          {isVi
            ? "Hệ thống tự động tính toán thể tích (CBM), đóng kiện Pallet ISPM-15, tổng trọng lượng bì (Gross Weight), gợi ý container (20GP / 40GP / 40HC) và dự toán giá vốn nhập khẩu tận kho."
            : "Calculates total cargo volume (CBM), ISPM-15 palletization, Gross Weight (GW), 3D container stowing, and Door-to-Door FTA Landed Cost."}
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

        {/* 3D WebGL Container Visualizer Component */}
        <CbmVisualizer
          calculation={calculation}
          items={items.map((i) => ({ productId: i.productId, quantity: i.quantity }))}
          isLoading={isLoading}
          onRecalculate={handleCalculate}
        />

        {/* Door-to-Door Landed Cost & FTA Duty Calculator */}
        <LandedCostCalculator
          productId={items[0]?.productId || 1}
          sku="SHOES-SNK-V1"
          hsCode="6404.11.00"
          productName={
            isVi
              ? "Lô hàng Xuất khẩu Tổng hợp (Giày Sneaker + Than BBQ + Băng keo OPP)"
              : "Consolidated Export Cargo Lot (Sneakers + BBQ Charcoal + OPP Tape)"
          }
          quantity={items[0]?.quantity || 1200}
          unitPriceUsd={19.5}
          defaultIncoterm="CIF"
          defaultDestinationCountry="JPN"
        />
      </div>
    </div>
  );
}
