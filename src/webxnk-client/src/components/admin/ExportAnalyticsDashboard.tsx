"use client";

import React, { useState, useEffect } from "react";
import {
  Globe2,
  PieChart,
  BarChart3,
  Layers,
  ArrowUpRight,
  Container,
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { adminApi } from "@/services/api";

export const ExportAnalyticsDashboard: React.FC = () => {
  const { formatPrice } = useCurrency();

  const [totalB2bUsd, setTotalB2bUsd] = useState(268400);
  const [totalB2cUsd, setTotalB2cUsd] = useState(61350);
  const grandTotalUsd = totalB2bUsd + totalB2cUsd;

  const [markets, setMarkets] = useState([
    { country: "Nhật Bản (Japan)", port: "Tokyo / Yokohama", flag: "🇯🇵", revenueUsd: 112500, percent: 34.1, containers: "8x40HC", growth: "+24.5%" },
    { country: "Hoa Kỳ (USA)", port: "Los Angeles / Long Beach", flag: "🇺🇸", revenueUsd: 98200, percent: 29.8, containers: "6x40HC", growth: "+18.2%" },
    { country: "Châu Âu (EU)", port: "Rotterdam / Hamburg", flag: "🇪🇺", revenueUsd: 74300, percent: 22.5, containers: "5x40HC", growth: "+12.0%" },
    { country: "Hàn Quốc (Korea)", port: "Busan Port", flag: "🇰🇷", revenueUsd: 44750, percent: 13.6, containers: "3x40GP", growth: "+8.4%" },
  ]);

  const [funnelStages, setFunnelStages] = useState([
    { name: "1. Yêu cầu báo giá gửi đến (Submitted)", count: 48, percent: 100, color: "bg-neutral-800" },
    { name: "2. Đã tính toán CBM & Gửi báo giá (Quoted)", count: 40, percent: 83.3, color: "bg-[#0E4B94]" },
    { name: "3. Đàm phán giá qua SignalR (Negotiated)", count: 28, percent: 58.3, color: "bg-blue-600" },
    { name: "4. Ký Proforma Invoice & Hợp đồng (PI Signed)", count: 21, percent: 43.8, color: "bg-emerald-600" },
    { name: "5. Nộp Ủy nhiệm chi T/T & Vào sản xuất (Deposit Paid)", count: 16, percent: 33.3, color: "bg-emerald-800" },
  ]);

  useEffect(() => {
    adminApi.getAnalytics().then((data) => {
      if (data) {
        if (data.totalB2bUsd) setTotalB2bUsd(data.totalB2bUsd);
        if (data.totalB2cUsd) setTotalB2cUsd(data.totalB2cUsd);
        if (data.topMarkets && data.topMarkets.length > 0) setMarkets(data.topMarkets);
        if (data.pipelineFunnel && data.pipelineFunnel.length > 0) setFunnelStages(data.pipelineFunnel);
      }
    });
  }, []);

  return (
    <div className="border border-black bg-white p-6 space-y-6">
      {/* Title */}
      <div className="border-b border-black pb-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
            FOREIGN TRADE BUSINESS INTELLIGENCE (EXP-90, EXP-91, EXP-92, EXP-93)
          </span>
          <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2 mt-0.5">
            <BarChart3 className="w-5 h-5 text-[#0E4B94]" />
            Báo cáo Phân tích Doanh thu Xuất khẩu & Thị trường Trọng điểm
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-mono text-neutral-500 uppercase block">Tổng doanh số lũy kế</span>
          <span className="text-xl font-black font-mono text-[#0E4B94]">
            {formatPrice(grandTotalUsd)}
          </span>
        </div>
      </div>

      {/* Grid: 2-Channel Revenue & Container Space Optimization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* EXP-90: 2-Channel Breakdown */}
        <div className="border border-neutral-300 p-5 bg-neutral-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#0E4B94]" />
              Phân bổ Doanh thu theo 2 Kênh B2B vs B2C
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Quý hiện tại</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-neutral-900">B2B Xuất khẩu Container (Wholesale Export)</span>
                <span className="font-bold text-[#0E4B94]">{formatPrice(totalB2bUsd)} (81.4%)</span>
              </div>
              <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#0E4B94] rounded-full" style={{ width: "81.4%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-bold text-neutral-900">B2C Bán lẻ Xuyên biên giới (Cross-border Retail)</span>
                <span className="font-bold text-[#C9252C]">{formatPrice(totalB2cUsd)} (18.6%)</span>
              </div>
              <div className="h-3 w-full bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9252C] rounded-full" style={{ width: "18.6%" }} />
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-neutral-200 grid grid-cols-2 gap-4 text-xs font-mono">
            <div className="bg-white p-3 border border-neutral-200 rounded">
              <span className="text-neutral-500 text-[10px] block">ĐƠN HÀNG CONTAINER:</span>
              <strong className="text-base text-neutral-900">22 Container</strong>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Giá trị TB: $12,200/đơn</span>
            </div>
            <div className="bg-white p-3 border border-neutral-200 rounded">
              <span className="text-neutral-500 text-[10px] block">GIAO DỊCH B2C STRIPE:</span>
              <strong className="text-base text-neutral-900">812 Đơn hàng</strong>
              <span className="text-[10px] text-emerald-600 block mt-0.5">Tỷ lệ thanh toán 3DS: 99.4%</span>
            </div>
          </div>
        </div>

        {/* EXP-93: Container Capacity & CBM Optimization */}
        <div className="border border-neutral-300 p-5 bg-neutral-50/50 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
              <Container className="w-4 h-4 text-[#0E4B94]" />
              Hiệu suất Đóng hàng Container & Sản lượng CBM
            </h3>
            <span className="text-[11px] font-mono text-neutral-500">Tối ưu đóng gói</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="bg-white p-3.5 border border-neutral-200 rounded">
              <span className="text-neutral-500 text-[10px] block uppercase">TỔNG CBM XUẤT KHẨU:</span>
              <strong className="text-xl text-[#0E4B94] font-black">1,480.5 m³</strong>
              <span className="text-[10px] text-neutral-500 block mt-1">Tương đương 22 Cont 40HC</span>
            </div>

            <div className="bg-white p-3.5 border border-neutral-200 rounded">
              <span className="text-neutral-500 text-[10px] block uppercase">TỶ LỆ LẤP ĐẦY CONTAINER:</span>
              <strong className="text-xl text-emerald-600 font-black">92.4%</strong>
              <span className="text-[10px] text-emerald-700 block mt-1">+12.4% so với TB ngành</span>
            </div>
          </div>

          <div className="bg-white p-3.5 border border-neutral-200 rounded text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Chi phí Logistics tiết kiệm được (nhờ CBM Engine):</span>
              <span className="font-bold text-emerald-700 font-mono">+$18,400 USD</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-neutral-600">Trọng lượng kiểm định VGM trung bình / cont:</span>
              <span className="font-bold text-neutral-900">22,850 kg (Chuẩn an toàn)</span>
            </div>
          </div>
        </div>
      </div>

      {/* EXP-91: Top Export Markets Heatmap Table */}
      <div className="border border-neutral-300 p-5 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#0E4B94]" />
            Thị phần Thị trường Xuất khẩu Trọng điểm (Top Export Destinations)
          </h3>
          <span className="text-[11px] font-mono text-neutral-500">Dữ liệu tờ khai Hải quan Cát Lái</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="bg-neutral-100 border-b border-neutral-300 text-neutral-700 uppercase font-bold text-[11px]">
                <th className="p-3">Thị trường</th>
                <th className="p-3">Cảng dỡ hàng (POD)</th>
                <th className="p-3">Sản lượng Container</th>
                <th className="p-3 text-right">Kim ngạch xuất khẩu</th>
                <th className="p-3 text-right">Tỷ trọng (%)</th>
                <th className="p-3 text-center">Tăng trưởng</th>
              </tr>
            </thead>
            <tbody>
              {markets.map((m, idx) => (
                <tr key={idx} className="border-b border-neutral-200 hover:bg-neutral-50">
                  <td className="p-3 font-bold text-neutral-900 flex items-center gap-2">
                    <span className="text-base">{m.flag}</span>
                    <span>{m.country}</span>
                  </td>
                  <td className="p-3 text-neutral-600">{m.port}</td>
                  <td className="p-3 font-semibold text-[#0E4B94]">{m.containers}</td>
                  <td className="p-3 text-right font-bold text-neutral-900">{formatPrice(m.revenueUsd)}</td>
                  <td className="p-3 text-right">
                    <span className="font-bold">{m.percent}%</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className="inline-flex items-center gap-0.5 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                      <ArrowUpRight className="w-3 h-3" />
                      {m.growth}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EXP-92: RFQ Conversion Pipeline Funnel */}
      <div className="border border-neutral-300 p-5 bg-white space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#0E4B94]" />
            Phễu Chuyển Đổi Đơn Hàng B2B RFQ (Conversion Pipeline Funnel)
          </h3>
          <span className="text-[11px] font-mono text-emerald-700 font-bold">
            Tỷ lệ chốt hợp đồng thành công: 33.3%
          </span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {funnelStages.map((stage, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex justify-between text-neutral-700">
                <span className="font-bold">{stage.name}</span>
                <span>
                  <strong>{stage.count} đơn</strong> ({stage.percent}%)
                </span>
              </div>
              <div className="h-4 w-full bg-neutral-100 rounded-sm overflow-hidden p-0.5 border border-neutral-200">
                <div
                  className={`h-full ${stage.color} rounded-sm transition-all duration-500`}
                  style={{ width: `${stage.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};