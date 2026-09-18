"use client";

import React from "react";
import { ExportDocumentDownloader } from "@/components/admin/ExportDocumentDownloader";
import { WarehouseInventoryMonitor } from "@/components/admin/WarehouseInventoryMonitor";
import { Shield, TrendingUp, Anchor, Box } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
              INTERNAL LOGISTICS & ERP SUITE (EXP-FE-ADMIN)
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black">
              Bảng điều khiển Quản trị Xuất khẩu & Kho vận
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black border border-black px-3 py-1 bg-neutral-100">
            <Shield className="w-4 h-4" />
            <span>QUYỀN HẠN: SUPER ADMIN & WAREHOUSE MANAGER</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-black p-4 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>TỔNG DOANH THU XUẤT KHẨU</span>
            <TrendingUp className="w-4 h-4 text-black" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">$148,250 USD</p>
          <span className="text-[10px] font-mono text-neutral-600">+18.5% so với tháng trước</span>
        </div>

        <div className="border border-black p-4 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>CONTAINER ĐANG ĐÓNG HÀNG</span>
            <Box className="w-4 h-4 text-black" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">4x40HC, 2x20GP</p>
          <span className="text-[10px] font-mono text-neutral-600">Tại Cảng Cát Lái & Kho BD</span>
        </div>

        <div className="border border-black p-4 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>ĐƠN BÁO GIÁ RFQ CHỜ DUYỆT</span>
            <Anchor className="w-4 h-4 text-black" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">3 ĐƠN</p>
          <span className="text-[10px] font-mono text-neutral-600">Thị trường Nhật Bản & EU</span>
        </div>

        <div className="border border-black p-4 bg-white">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>TRẠNG THÁI QUESTPDF ENGINE</span>
            <Shield className="w-4 h-4 text-black" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">SẴN SÀNG</p>
          <span className="text-[10px] font-mono text-neutral-600">Tự sinh PI, CI, PKL chuẩn ISO</span>
        </div>
      </div>

      {/* 1. Export Documents Downloader Component (QuestPDF) */}
      <ExportDocumentDownloader />

      {/* 2. Warehouse Inventory Monitor Component (Multi-warehouse & Reservations) */}
      <WarehouseInventoryMonitor />
    </div>
  );
}
