"use client";

import React, { useState } from "react";
import { CbmCalculationResult } from "@/types";
import { Box, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

interface CbmVisualizerProps {
  calculation?: CbmCalculationResult | null;
  isLoading?: boolean;
  onRecalculate?: () => void;
}

export const CbmVisualizer: React.FC<CbmVisualizerProps> = ({
  calculation,
  isLoading = false,
  onRecalculate,
}) => {
  const [selectedContainerTab, setSelectedContainerTab] = useState<"20GP" | "40GP" | "40HC">("40HC");

  const volPercent = calculation ? Math.min(100, calculation.volumeUtilizationPercentage) : 0;
  const weightPercent = calculation ? Math.min(100, calculation.weightUtilizationPercentage) : 0;

  const isOverVolume = (calculation?.volumeUtilizationPercentage || 0) > 100;
  const isOverWeight = (calculation?.weightUtilizationPercentage || 0) > 100;

  return (
    <div className="border border-black bg-white p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
            LOGISTICS & CARGO CALCULATION (EXP-67)
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
            <Box className="w-5 h-5" />
            Trực quan hóa không gian Container xuất khẩu
          </h2>
        </div>

        {onRecalculate && (
          <button
            onClick={onRecalculate}
            disabled={isLoading}
            className="flex items-center gap-1.5 border border-black bg-black px-4 py-2 text-xs font-bold uppercase text-white hover:bg-neutral-800 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>Tính lại CBM</span>
          </button>
        )}
      </div>

      {/* Container Selector Tabs */}
      <div className="mt-6 flex border-b border-black/20 gap-2">
        {(["20GP", "40GP", "40HC"] as const).map((type) => (
          <button
            key={type}
            onClick={() => setSelectedContainerTab(type)}
            className={`px-4 py-2 text-xs font-mono font-bold uppercase transition-colors border-b-2 -mb-px ${
              selectedContainerTab === type
                ? "border-black text-black bg-neutral-100"
                : "border-transparent text-neutral-500 hover:text-black"
            }`}
          >
            Container {type} {type === "20GP" ? "(33 CBM)" : type === "40GP" ? "(67 CBM)" : "(76 CBM)"}
          </button>
        ))}
      </div>

      {/* Main Visualization Box - High-contrast Monochrome Container Frame */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Visual Container Representation */}
        <div className="lg:col-span-2 border-2 border-black bg-neutral-950 p-6 text-white relative overflow-hidden flex flex-col justify-between min-h-[300px]">
          {/* Top Label */}
          <div className="flex justify-between items-center text-xs font-mono text-neutral-400 border-b border-neutral-800 pb-2">
            <span>CONTAINER ID: VNM-EXP-2026</span>
            <span className="text-white font-bold">
              GỢI Ý HỆ THỐNG: {calculation?.suggestedContainerType || "1x40ft High Cube (40HC)"}
            </span>
          </div>

          {/* Wireframe Container Graphic */}
          <div className="my-auto py-8 relative">
            {/* 3D-like isometric container box */}
            <div className="border border-neutral-700 bg-neutral-900/80 p-4 relative">
              <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 mb-2">
                <span>CỬA CONT SAU (REAR DOORS)</span>
                <span>VÁCH TRƯỚC (FRONT WALL)</span>
              </div>

              {/* Volume fill meter */}
              <div className="w-full h-24 bg-neutral-950 border border-neutral-700 relative overflow-hidden flex items-end">
                <div
                  style={{ width: `${volPercent}%` }}
                  className={`h-full transition-all duration-500 flex items-center justify-center font-mono text-xs font-bold ${
                    isOverVolume
                      ? "bg-white text-black animate-pulse"
                      : "bg-white text-black"
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
            <div>Chiều dài: 12.03 m</div>
            <div>Chiều rộng: 2.35 m</div>
            <div>Chiều cao: 2.69 m (HC)</div>
          </div>
        </div>

        {/* Numeric Metrics & Alerts */}
        <div className="flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            {/* Metric: Volume */}
            <div className="border border-black p-4 bg-white">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase font-mono text-neutral-500">Tổng thể tích (CBM)</span>
                <span className="text-2xl font-black font-mono text-black">
                  {calculation?.totalCbm?.toFixed(2) || "0.00"} <span className="text-xs font-normal">m³</span>
                </span>
              </div>
              <div className="mt-2 w-full bg-neutral-200 h-2">
                <div
                  style={{ width: `${volPercent}%` }}
                  className={`h-2 ${isOverVolume ? "bg-black animate-pulse" : "bg-black"}`}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-mono text-neutral-600">
                <span>Dung tích cont: {calculation?.containerCapacityCbm || 76} CBM</span>
                <span className="font-bold">{volPercent.toFixed(1)}%</span>
              </div>
            </div>

            {/* Metric: Gross Weight */}
            <div className="border border-black p-4 bg-white">
              <div className="flex justify-between items-baseline">
                <span className="text-xs uppercase font-mono text-neutral-500">Tổng trọng lượng (GW)</span>
                <span className="text-2xl font-black font-mono text-black">
                  {calculation?.totalGrossWeightKg?.toLocaleString("vi-VN") || "0"} <span className="text-xs font-normal">kg</span>
                </span>
              </div>
              <div className="mt-2 w-full bg-neutral-200 h-2">
                <div
                  style={{ width: `${weightPercent}%` }}
                  className={`h-2 ${isOverWeight ? "bg-black animate-pulse" : "bg-black"}`}
                />
              </div>
              <div className="mt-1 flex justify-between text-[11px] font-mono text-neutral-600">
                <span>Giới hạn tải: {calculation?.weightLimitKg?.toLocaleString("vi-VN") || "26,500"} kg</span>
                <span className="font-bold">{weightPercent.toFixed(1)}%</span>
              </div>
            </div>

            {/* Metric: Cartons */}
            <div className="border border-black p-3 bg-neutral-50 flex items-center justify-between font-mono text-xs">
              <span className="text-neutral-600">Tổng số kiện carton:</span>
              <span className="font-black text-black text-base">{calculation?.totalCartons || 0} thùng</span>
            </div>
          </div>

          {/* Validation Status */}
          <div className={`p-4 border ${isOverVolume || isOverWeight ? "border-black bg-neutral-100" : "border-black bg-black text-white"}`}>
            {isOverVolume || isOverWeight ? (
              <div className="flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase">Cảnh báo vượt tải trọng / thể tích</p>
                  <p className="text-[11px] text-neutral-700 mt-0.5">
                    Hàng hóa vượt quá mức chứa 1 container. Cần phân bổ sang container thứ 2 hoặc chuyển thành lô hàng LCL/FCL kép.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 text-xs">
                <CheckCircle className="w-4 h-4 text-white shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase">Đóng hàng tối ưu chuẩn xuất khẩu</p>
                  <p className="text-[11px] text-neutral-300 mt-0.5">
                    Số kiện carton và trọng lượng nằm trong ngưỡng an toàn cho phép của hãng tàu quốc tế.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
