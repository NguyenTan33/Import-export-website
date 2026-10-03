"use client";

import React, { useState } from "react";
import { ExportDocumentDownloader } from "@/components/admin/ExportDocumentDownloader";
import { WarehouseInventoryMonitor } from "@/components/admin/WarehouseInventoryMonitor";
import { ExportAnalyticsDashboard } from "@/components/admin/ExportAnalyticsDashboard";
import { OrderManagementPanel } from "@/components/admin/OrderManagementPanel";
import { PartnerVerificationPanel } from "@/components/admin/PartnerVerificationPanel";
import { Shield, TrendingUp, Anchor, Box, BarChart3, FileText, Warehouse, Truck, Building } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"analytics" | "documents" | "inventory" | "orders" | "partners">("analytics");
  const { formatPrice } = useCurrency();
  const { language } = useLanguage();
  const isVi = language === "vi";

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-black pb-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-baseline gap-2">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94] font-bold">
              {isVi
                ? "HỆ THỐNG QUẢN TRỊ NỘI BỘ & ERP NGOẠI THƯƠNG • QUANG TẤN HOÀNG"
                : "INTERNAL LOGISTICS & ERP SUITE • QUANG TAN HOANG"}
            </span>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black mt-0.5">
              {isVi
                ? "Bảng Điều Khiển Quản Trị Xuất Khẩu & Kho Vận"
                : "Export Admin & Warehouse ERP Dashboard"}
            </h1>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-black border border-black px-3 py-1 bg-neutral-100 rounded">
            <Shield className="w-4 h-4 text-[#0E4B94]" />
            <span>
              {isVi
                ? "QUYỀN HẠN: TỔNG QUẢN TRỊ & GIÁM ĐỐC KHO VẬN"
                : "ROLE: SUPER ADMIN & WAREHOUSE DIRECTOR"}
            </span>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="border border-black p-4 bg-white shadow-sm rounded">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>{isVi ? "TỔNG DOANH THU XUẤT KHẨU" : "TOTAL EXPORT REVENUE"}</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-[#0E4B94]">
            {formatPrice(329750)}
          </p>
          <span className="text-[10px] font-mono text-emerald-600 font-bold">
            {isVi ? "+24.5% so với cùng kỳ" : "+24.5% year-on-year"}
          </span>
        </div>

        <div className="border border-black p-4 bg-white shadow-sm rounded">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>{isVi ? "CONTAINER ĐANG ĐÓNG HÀNG" : "ACTIVE STOWAGE CONTAINERS"}</span>
            <Box className="w-4 h-4 text-black" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">4x40HC, 2x20GP</p>
          <span className="text-[10px] font-mono text-neutral-600">
            {isVi ? "Tại Cảng Cát Lái & Kho BD" : "At Cat Lai Port & VSIP 1"}
          </span>
        </div>

        <div className="border border-black p-4 bg-white shadow-sm rounded">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>{isVi ? "ĐƠN BÁO GIÁ ĐANG XỬ LÝ" : "PENDING B2B RFQs"}</span>
            <Anchor className="w-4 h-4 text-[#0E4B94]" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-black">
            {isVi ? "5 ĐƠN HÀNG" : "5 INQUIRIES"}
          </p>
          <span className="text-[10px] font-mono text-neutral-600">
            {isVi ? "Thị trường Nhật Bản, Mỹ, EU" : "Markets: Japan, US, EU"}
          </span>
        </div>

        <div className="border border-black p-4 bg-white shadow-sm rounded">
          <div className="flex items-center justify-between text-neutral-500 text-xs font-mono">
            <span>QUESTPDF GENERATOR ENGINE</span>
            <Shield className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black font-mono text-emerald-700">
            {isVi ? "HOẠT ĐỘNG" : "ONLINE"}
          </p>
          <span className="text-[10px] font-mono text-neutral-600">
            {isVi ? "PI, CI, PKL xuất tức thì" : "Instant PI, CI, PKL rendering"}
          </span>
        </div>
      </div>

      {/* Navigation Tab Pills */}
      <div className="flex border-b border-black overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-t-2 rounded-t ${
            activeTab === "analytics"
              ? "border-[#0E4B94] bg-white text-[#0E4B94] border-x border-b-0 -mb-px"
              : "border-transparent bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>
            {isVi
              ? "1. Phân Tích Ngoại Thương & Doanh Số (BI)"
              : "1. Foreign Trade & BI Analytics"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-t-2 rounded-t ${
            activeTab === "documents"
              ? "border-[#0E4B94] bg-white text-[#0E4B94] border-x border-b-0 -mb-px"
              : "border-transparent bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>
            {isVi
              ? "2. Xuất Bộ 3 Chứng Từ QuestPDF"
              : "2. QuestPDF 3-Document Suite"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-t-2 rounded-t whitespace-nowrap ${
            activeTab === "inventory"
              ? "border-[#0E4B94] bg-white text-[#0E4B94] border-x border-b-0 -mb-px"
              : "border-transparent bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span>
            {isVi
              ? "3. Giám Sát Đa Kho & Giữ Chỗ 30 Phút"
              : "3. Multi-Warehouse & 30-Min Reservation"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-t-2 rounded-t whitespace-nowrap ${
            activeTab === "orders"
              ? "border-[#0E4B94] bg-white text-[#0E4B94] border-x border-b-0 -mb-px"
              : "border-transparent bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Truck className="w-4 h-4 text-[#0E4B94]" />
          <span>
            {isVi
              ? "4. Quản Lý Đơn Hàng & Vận Chuyển"
              : "4. Order Fulfillment & Shipping"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("partners")}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold font-mono uppercase tracking-wider transition-colors border-t-2 rounded-t whitespace-nowrap ${
            activeTab === "partners"
              ? "border-[#0E4B94] bg-white text-[#0E4B94] border-x border-b-0 -mb-px"
              : "border-transparent bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Building className="w-4 h-4 text-emerald-600" />
          <span>
            {isVi
              ? "5. Duyệt Doanh Nghiệp B2B & Ủy Nhiệm Chi"
              : "5. B2B Verification & Wire Transfers"}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "analytics" && <ExportAnalyticsDashboard />}
      {activeTab === "documents" && <ExportDocumentDownloader />}
      {activeTab === "inventory" && <WarehouseInventoryMonitor />}
      {activeTab === "orders" && <OrderManagementPanel />}
      {activeTab === "partners" && <PartnerVerificationPanel />}
    </div>
  );
}