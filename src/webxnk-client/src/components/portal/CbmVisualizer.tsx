"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { CbmCalculationResult, StowedBoxCoordinate, CenterOfGravity } from "@/types";
import {
  Box,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Layers,
  Eye,
  PackageCheck,
} from "lucide-react";
import { Container3DCanvas } from "./Container3DCanvas";
import { generateRealisticStowedBoxes } from "@/utils/fallbackStowage";
import { logisticsApi } from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";

interface CbmVisualizerProps {
  calculation?: CbmCalculationResult | null;
  items?: { productId: number; quantity: number }[];
  isLoading?: boolean;
  onRecalculate?: () => void;
  stowedBoxes?: StowedBoxCoordinate[];
  centerOfGravity?: CenterOfGravity | null;
}

export const CbmVisualizer: React.FC<CbmVisualizerProps> = ({
  calculation: propCalculation,
  items,
  isLoading: propIsLoading = false,
  onRecalculate,
  stowedBoxes: propStowedBoxes,
  centerOfGravity: propCenterOfGravity,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [selectedContainerTab, setSelectedContainerTab] = useState<"20GP" | "40GP" | "40HC">("40HC");
  const [viewMode, setViewMode] = useState<"3D" | "2D">("3D");
  const [requirePalletization, setRequirePalletization] = useState<boolean>(false);
  const [palletType, setPalletType] = useState<"STANDARD_1200X1000" | "EURO_1200X800">("STANDARD_1200X1000");
  const [internalCalc, setInternalCalc] = useState<CbmCalculationResult | null>(null);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);

  const fetchCbmPlan = useCallback(async () => {
    if (!items || items.length === 0) return;
    setInternalLoading(true);
    try {
      const res = await logisticsApi.calculateCbm(items, requirePalletization, palletType);
      setInternalCalc(res);
      if (res.suggestedContainerType?.includes("20")) {
        setSelectedContainerTab("20GP");
      } else if (res.suggestedContainerType?.includes("40GP") || res.suggestedContainerType?.includes("40'GP")) {
        setSelectedContainerTab("40GP");
      } else {
        setSelectedContainerTab("40HC");
      }
    } finally {
      setInternalLoading(false);
    }
  }, [items, requirePalletization, palletType]);

  useEffect(() => {
    if (items && items.length > 0) {
      fetchCbmPlan();
    }
  }, [fetchCbmPlan, items]);

  const calculation = internalCalc || propCalculation;
  const isLoading = propIsLoading || internalLoading;

  // Container capacity & weight limit according to selected tab
  const containerSpecs = useMemo(() => {
    switch (selectedContainerTab) {
      case "20GP":
        return { capacityCbm: 33, weightLimitKg: 21800, lengthM: 5.9, heightM: 2.39, widthM: 2.35 };
      case "40GP":
        return { capacityCbm: 67, weightLimitKg: 26500, lengthM: 12.03, heightM: 2.39, widthM: 2.35 };
      case "40HC":
      default:
        return { capacityCbm: 76, weightLimitKg: 26500, lengthM: 12.03, heightM: 2.69, widthM: 2.35 };
    }
  }, [selectedContainerTab]);

  const effectiveTotalCbm = calculation?.totalCbm || 38.5;
  const effectiveGrossWeightKg = calculation?.totalGrossWeightKg || 6750;

  const volPercent = Math.min(100, (effectiveTotalCbm / containerSpecs.capacityCbm) * 100);
  const weightPercent = Math.min(100, (effectiveGrossWeightKg / containerSpecs.weightLimitKg) * 100);

  const isOverVolume = effectiveTotalCbm > containerSpecs.capacityCbm;
  const isOverWeight = effectiveGrossWeightKg > containerSpecs.weightLimitKg;

  // Compute boxes and CoG (use prop if provided, else calculation, else generate realistic stowage)
  const fallbackData = useMemo(() => {
    return generateRealisticStowedBoxes(selectedContainerTab);
  }, [selectedContainerTab]);

  const activeStowedBoxes =
    propStowedBoxes && propStowedBoxes.length > 0
      ? propStowedBoxes
      : calculation?.stowedBoxes && calculation.stowedBoxes.length > 0
      ? calculation.stowedBoxes
      : fallbackData.stowedBoxes;

  const activeCenterOfGravity =
    propCenterOfGravity !== undefined
      ? propCenterOfGravity
      : calculation?.centerOfGravity || fallbackData.centerOfGravity;

  const handleTriggerRecalculate = () => {
    if (items && items.length > 0) {
      fetchCbmPlan();
    }
    if (onRecalculate) {
      onRecalculate();
    }
  };

  return (
    <div className="border border-black bg-white p-6 space-y-6 rounded shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            LOGISTICS & CARGO 3D BIN-PACKING ENGINE (EXP-67 / THREE.JS WEBGL)
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Box className="w-5 h-5 text-[#0E4B94]" />
            {isVi
              ? "Mô phỏng Đóng Hàng Container 3D WebGL & Sơ đồ Xếp Dỡ (Stowage Plan)"
              : "3D WebGL Container Load Planner & Stowage Visualizer"}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-black bg-neutral-100 p-0.5 rounded text-xs font-mono font-bold">
            <button
              type="button"
              onClick={() => setViewMode("3D")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                viewMode === "3D" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>3D WebGL</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("2D")}
              className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
                viewMode === "2D" ? "bg-black text-white" : "text-neutral-600 hover:text-black"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isVi ? "Sơ đồ 2D" : "2D Plan"}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleTriggerRecalculate}
            disabled={isLoading}
            className="flex items-center gap-1.5 border border-black bg-[#0E4B94] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#0a376d] disabled:opacity-50 rounded transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isVi ? "Tính lại CBM" : "Recalculate CBM"}</span>
          </button>
        </div>
      </div>

      {/* Container Selector Tabs + Palletization Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-black/20 pb-3">
        <div className="flex gap-2 overflow-x-auto">
          {(["20GP", "40GP", "40HC"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedContainerTab(type)}
              className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border rounded whitespace-nowrap ${
                selectedContainerTab === type
                  ? "border-[#0E4B94] bg-[#0E4B94] text-white font-black"
                  : "border-neutral-300 bg-neutral-50 text-neutral-600 hover:text-black"
              }`}
            >
              Container {type} {type === "20GP" ? "(33 CBM)" : type === "40GP" ? "(67 CBM)" : "(76 CBM)"}
            </button>
          ))}
        </div>

        {/* Palletization Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
          <span className="text-neutral-500 uppercase font-bold">
            {isVi ? "Phương thức đóng kiện:" : "Loading Mode:"}
          </span>
          <button
            type="button"
            onClick={() => setRequirePalletization(false)}
            className={`px-3 py-1.5 border rounded font-bold transition-colors ${
              !requirePalletization
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-black"
            }`}
          >
            {isVi ? "Xếp rời (Floor-Loaded)" : "Floor-Loaded"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRequirePalletization(true);
              setPalletType("STANDARD_1200X1000");
            }}
            className={`px-3 py-1.5 border rounded font-bold transition-colors ${
              requirePalletization && palletType === "STANDARD_1200X1000"
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-black"
            }`}
          >
            Pallet ISO (1200x1000)
          </button>
          <button
            type="button"
            onClick={() => {
              setRequirePalletization(true);
              setPalletType("EURO_1200X800");
            }}
            className={`px-3 py-1.5 border rounded font-bold transition-colors ${
              requirePalletization && palletType === "EURO_1200X800"
                ? "border-black bg-black text-white"
                : "border-neutral-300 bg-white text-neutral-600 hover:border-black"
            }`}
          >
            Euro Pallet (1200x800)
          </button>
        </div>
      </div>

      {/* Palletization Info Banner (when active) */}
      {calculation?.palletSummary?.isPalletized && (
        <div className="border border-amber-500 bg-amber-50/90 p-3.5 rounded flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-amber-950">
            <PackageCheck className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>
                {isVi ? "Chế độ đóng Pallet hun trùng ISPM-15:" : "ISPM-15 Palletized Stowage:"}
              </strong>{" "}
              {calculation.palletSummary.totalEstimatedPallets} pallets ({calculation.palletSummary.palletType}) •{" "}
              {isVi ? "Tối đa" : "Max"} {calculation.palletSummary.maxPalletsFitIn20Ft} pallets/20ft |{" "}
              {calculation.palletSummary.maxPalletsFitIn40Ft} pallets/40ft
            </span>
          </div>
          <span className="text-amber-900 font-bold">
            {calculation.palletSummary.palletAdvice}
          </span>
        </div>
      )}

      {/* Main Visualizer Area */}
      {viewMode === "3D" ? (
        <div className="space-y-4">
          <Container3DCanvas
            containerType={selectedContainerTab}
            stowedBoxes={activeStowedBoxes}
            centerOfGravity={activeCenterOfGravity}
            totalCbm={effectiveTotalCbm}
            capacityCbm={containerSpecs.capacityCbm}
            grossWeightKg={effectiveGrossWeightKg}
            weightLimitKg={containerSpecs.weightLimitKg}
          />

          {/* Quick Metrics Bar below 3D canvas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="border border-neutral-300 p-3 bg-neutral-50 rounded">
              <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                {isVi ? "Thể tích lô hàng" : "Total Cargo Volume"}
              </span>
              <p className="text-lg font-black font-mono text-black">
                {effectiveTotalCbm.toFixed(2)} <span className="text-xs font-normal">m³</span>
              </p>
              <p className="text-[10px] font-mono text-neutral-600">
                {((effectiveTotalCbm / containerSpecs.capacityCbm) * 100).toFixed(1)}%{" "}
                {isVi ? `dung tích ${selectedContainerTab}` : `of ${selectedContainerTab} capacity`}
              </p>
            </div>

            <div className="border border-neutral-300 p-3 bg-neutral-50 rounded">
              <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                {isVi ? "Tổng trọng lượng GW" : "Total Gross Weight"}
              </span>
              <p className="text-lg font-black font-mono text-black">
                {effectiveGrossWeightKg.toLocaleString("vi-VN")}{" "}
                <span className="text-xs font-normal">kg</span>
              </p>
              <p className="text-[10px] font-mono text-neutral-600">
                {((effectiveGrossWeightKg / containerSpecs.weightLimitKg) * 100).toFixed(1)}%{" "}
                {isVi ? "tải trọng tối đa" : "of max payload"}
              </p>
            </div>

            <div className="border border-neutral-300 p-3 bg-neutral-50 rounded">
              <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                {isVi ? "Số kiện & Phương án Cont" : "Cartons & Container Plan"}
              </span>
              <p className="text-lg font-black font-mono text-[#0E4B94]">
                {calculation?.totalCartons || activeStowedBoxes.length}{" "}
                <span className="text-xs font-normal text-black">
                  {isVi ? "thùng carton" : "cartons"}
                </span>
              </p>
              <p className="text-[10px] font-mono text-neutral-600 truncate">
                {calculation?.suggestedContainerType || "1x40ft High Cube (40HC)"}
              </p>
            </div>

            <div className="border border-neutral-300 p-3 bg-neutral-50 rounded">
              <span className="text-[10px] font-mono text-neutral-500 block uppercase">
                {isVi ? "Trạng thái trọng tâm (CoG)" : "Center of Gravity (CoG)"}
              </span>
              <p
                className={`text-xs font-bold uppercase mt-1 ${
                  activeCenterOfGravity?.balanceStatus === "BALANCED_SAFE"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {activeCenterOfGravity?.statusTextVi ||
                  (isVi ? "Cân bằng an toàn" : "Balanced & Safe")}
              </p>
              <p className="text-[10px] font-mono text-neutral-600">
                {isVi ? "Độ lệch:" : "Lateral Dev:"}{" "}
                {activeCenterOfGravity?.lateralDeviationPercent || 0}%
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* 2D Section View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Visual Container Representation */}
          <div className="lg:col-span-2 border-2 border-black bg-neutral-950 p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px] rounded">
            {/* Top Label */}
            <div className="flex justify-between items-center text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
              <span>CONTAINER ID: VNM-EXP-2026 ({selectedContainerTab})</span>
              <span className="text-white font-bold">
                {isVi ? "GỢI Ý HỆ THỐNG:" : "RECOMMENDED:"}{" "}
                {calculation?.suggestedContainerType || "1x40ft High Cube (40HC)"}
              </span>
            </div>

            {/* Wireframe Container Graphic */}
            <div className="my-auto py-8 relative">
              <div className="border border-neutral-700 bg-neutral-900/80 p-4 relative">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-2">
                  <span>{isVi ? "CỬA CONT SAU (REAR DOORS)" : "REAR DOORS"}</span>
                  <span>{isVi ? "VÁCH TRƯỚC (FRONT BULKHEAD)" : "FRONT BULKHEAD"}</span>
                </div>

                {/* Volume fill meter */}
                <div className="w-full h-24 bg-neutral-950 border border-neutral-700 relative overflow-hidden flex items-end">
                  <div
                    style={{ width: `${volPercent}%` }}
                    className={`h-full transition-all duration-500 flex items-center justify-center font-mono text-xs font-bold ${
                      isOverVolume ? "bg-amber-400 text-black animate-pulse" : "bg-white text-black"
                    }`}
                  >
                    {volPercent > 10 && `${volPercent.toFixed(1)}% CBM`}
                  </div>
                </div>

                {/* Grid markers inside container */}
                <div className="grid grid-cols-4 gap-1 mt-2 text-center text-[10px] font-mono text-neutral-500">
                  <div className="border-t border-neutral-800 pt-1">Bay 01-04</div>
                  <div className="border-t border-neutral-800 pt-1">Bay 05-08</div>
                  <div className="border-t border-neutral-800 pt-1">Bay 09-12</div>
                  <div className="border-t border-neutral-800 pt-1">Bay 13-16</div>
                </div>
              </div>
            </div>

            {/* Bottom Container Dimensions info */}
            <div className="grid grid-cols-3 gap-2 border-t border-neutral-800 pt-3 text-[11px] font-mono text-neutral-400">
              <div>
                {isVi ? "Chiều dài:" : "Length:"} {containerSpecs.lengthM} m
              </div>
              <div>
                {isVi ? "Chiều rộng:" : "Width:"} {containerSpecs.widthM} m
              </div>
              <div>
                {isVi ? "Chiều cao:" : "Height:"} {containerSpecs.heightM} m
              </div>
            </div>
          </div>

          {/* Numeric Metrics & Alerts */}
          <div className="flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              {/* Metric: Volume */}
              <div className="border border-black p-4 bg-white rounded">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase font-mono text-neutral-500">
                    {isVi ? "Tổng thể tích (CBM)" : "Total Volume (CBM)"}
                  </span>
                  <span className="text-2xl font-black font-mono text-black">
                    {effectiveTotalCbm.toFixed(2)} <span className="text-xs font-normal">m³</span>
                  </span>
                </div>
                <div className="mt-2 w-full bg-neutral-200 h-2">
                  <div
                    style={{ width: `${volPercent}%` }}
                    className={`h-2 ${isOverVolume ? "bg-amber-500 animate-pulse" : "bg-black"}`}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-mono text-neutral-600">
                  <span>
                    {isVi ? "Dung tích cont:" : "Capacity:"} {containerSpecs.capacityCbm} CBM
                  </span>
                  <span className="font-bold">{volPercent.toFixed(1)}%</span>
                </div>
              </div>

              {/* Metric: Gross Weight */}
              <div className="border border-black p-4 bg-white rounded">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs uppercase font-mono text-neutral-500">
                    {isVi ? "Tổng trọng lượng (GW)" : "Gross Weight (GW)"}
                  </span>
                  <span className="text-2xl font-black font-mono text-black">
                    {effectiveGrossWeightKg.toLocaleString("vi-VN")}{" "}
                    <span className="text-xs font-normal">kg</span>
                  </span>
                </div>
                <div className="mt-2 w-full bg-neutral-200 h-2">
                  <div
                    style={{ width: `${weightPercent}%` }}
                    className={`h-2 ${isOverWeight ? "bg-red-500 animate-pulse" : "bg-black"}`}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-mono text-neutral-600">
                  <span>
                    {isVi ? "Giới hạn tải:" : "Max Payload:"}{" "}
                    {containerSpecs.weightLimitKg.toLocaleString("vi-VN")} kg
                  </span>
                  <span className="font-bold">{weightPercent.toFixed(1)}%</span>
                </div>
              </div>

              {/* Metric: Cartons */}
              <div className="border border-black p-3 bg-neutral-50 flex items-center justify-between font-mono text-xs rounded">
                <span className="text-neutral-600">
                  {isVi ? "Tổng số kiện carton:" : "Total Master Cartons:"}
                </span>
                <span className="font-black text-black text-base">
                  {calculation?.totalCartons || activeStowedBoxes.length}{" "}
                  {isVi ? "thùng" : "ctns"}
                </span>
              </div>
            </div>

            {/* Validation Status */}
            <div
              className={`p-4 border rounded ${
                isOverVolume || isOverWeight
                  ? "border-black bg-neutral-100"
                  : "border-black bg-black text-white"
              }`}
            >
              {isOverVolume || isOverWeight ? (
                <div className="flex items-start gap-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase">
                      {isVi ? "Cảnh báo vượt tải trọng / thể tích" : "Container Capacity Exceeded"}
                    </p>
                    <p className="text-[11px] text-neutral-700 mt-0.5">
                      {calculation?.logisticsAdvice ||
                        (isVi
                          ? "Hàng hóa vượt quá mức chứa 1 container. Hệ thống khuyến nghị chia sang phương án đa container bên dưới."
                          : "Cargo exceeds single container capacity. Multi-container split is recommended.")}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold uppercase">
                      {isVi ? "Đóng hàng tối ưu chuẩn xuất khẩu" : "Optimal IMO/SOLAS Stowage"}
                    </p>
                    <p className="text-[11px] text-neutral-300 mt-0.5">
                      {calculation?.logisticsAdvice ||
                        (isVi
                          ? "Số kiện carton và trọng lượng nằm trong ngưỡng an toàn cho phép của hãng tàu quốc tế (IMO/SOLAS)."
                          : "Carton volume and gross weight are within safe IMO/SOLAS container limits.")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Item Breakdown Table (if available) */}
      {calculation?.itemBreakdowns && calculation.itemBreakdowns.length > 0 && (
        <div className="border-t border-neutral-200 pt-4">
          <h3 className="text-xs font-mono font-bold uppercase text-neutral-700 mb-2">
            {isVi
              ? "Bảng kê Chi tiết Quy cách Đóng kiện theo Mặt hàng (Cargo Packing Breakdown)"
              : "Cargo Packing Breakdown by Line Item"}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border border-neutral-200">
              <thead className="bg-neutral-100 text-neutral-700 uppercase">
                <tr>
                  <th className="p-2 text-left">SKU / Mặt hàng</th>
                  <th className="p-2 text-right">{isVi ? "Số thùng" : "Cartons"}</th>
                  <th className="p-2 text-right">{isVi ? "CBM / Thùng" : "CBM / Ctn"}</th>
                  <th className="p-2 text-right">{isVi ? "Tổng CBM" : "Total CBM"}</th>
                  <th className="p-2 text-right">{isVi ? "Tổng GW (kg)" : "Gross Weight"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {calculation.itemBreakdowns.map((item, idx) => (
                  <tr key={idx} className="bg-white">
                    <td className="p-2 font-bold text-black">{item.itemName}</td>
                    <td className="p-2 text-right">{item.totalCartons.toLocaleString()}</td>
                    <td className="p-2 text-right">{item.cbmPerCarton.toFixed(4)} m³</td>
                    <td className="p-2 text-right font-bold text-[#0E4B94]">{item.subtotalCbm.toFixed(2)} m³</td>
                    <td className="p-2 text-right">{item.subtotalGrossWeightKg.toLocaleString()} kg</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
