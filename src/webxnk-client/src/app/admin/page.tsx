"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExportDocumentDownloader } from "@/components/admin/ExportDocumentDownloader";
import { WarehouseInventoryMonitor } from "@/components/admin/WarehouseInventoryMonitor";
import { ExportAnalyticsDashboard } from "@/components/admin/ExportAnalyticsDashboard";
import { OrderManagementPanel } from "@/components/admin/OrderManagementPanel";
import { PartnerVerificationPanel } from "@/components/admin/PartnerVerificationPanel";
import { ProductManagementPanel } from "@/components/admin/ProductManagementPanel";
import { ProductMediaManagerPanel } from "@/components/admin/ProductMediaManagerPanel";
import { ContractManagementPanel } from "@/components/admin/ContractManagementPanel";
import { Shield, Box, BarChart3, FileText, Warehouse, Truck, Building, Image as ImageIcon, FileSignature } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    | "analytics"
    | "documents"
    | "inventory"
    | "orders"
    | "partners"
    | "products"
    | "media"
    | "contracts"
  >("analytics");
  const { language } = useLanguage();
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const isVi = language === "vi";
  const isAdmin = user?.role === "SUPER_ADMIN" && !user.isDemo;

  useEffect(() => {
    if (isLoading) return;
    if (!user) router.replace("/login");
    else if (!isAdmin) router.replace("/");
  }, [isAdmin, isLoading, router, user]);

  if (isLoading || !isAdmin) {
    return <div className="mx-auto max-w-7xl p-10 text-center text-sm text-neutral-500">{isVi ? "Đang kiểm tra quyền truy cập..." : "Checking access..."}</div>;
  }

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

      {/* Navigation Tab Pills */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8">
        <button
          type="button"
          onClick={() => setActiveTab("analytics")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "analytics"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "1. Phân Tích Ngoại Thương & Doanh Số (BI)"
              : "1. Foreign Trade & BI Analytics"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("documents")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "documents"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <FileText className="w-4 h-4" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "2. Xuất Bộ 3 Chứng Từ QuestPDF"
              : "2. QuestPDF 3-Document Suite"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("inventory")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "inventory"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Warehouse className="w-4 h-4" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "3. Giám Sát Đa Kho & Giữ Chỗ 30 Phút"
              : "3. Multi-Warehouse & 30-Min Reservation"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "orders"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Truck className="w-4 h-4 text-[#0E4B94]" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "4. Quản Lý Đơn Hàng & Vận Chuyển"
              : "4. Order Fulfillment & Shipping"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("partners")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "partners"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Building className="w-4 h-4 text-emerald-600" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "5. Duyệt Doanh Nghiệp B2B & Ủy Nhiệm Chi"
              : "5. B2B Verification & Wire Transfers"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("products")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "products"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <Box className="w-4 h-4 text-[#0E4B94]" />
          <span className="min-w-0 break-words text-center">
            {isVi ? "6. Quản Lý Sản Phẩm" : "6. Product Management"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("media")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "media"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <ImageIcon className="w-4 h-4 text-[#C9252C]" />
          <span className="min-w-0 break-words text-center">
            {isVi ? "7. Chỉnh Sửa Ảnh Sản Phẩm" : "7. Edit Product Media"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("contracts")}
          className={`flex w-full min-w-0 items-center justify-center gap-2 rounded border px-2 py-3 text-center text-xs font-bold font-mono uppercase leading-snug tracking-wider transition-colors ${
            activeTab === "contracts"
              ? "border-[#0E4B94] bg-blue-50 text-[#0E4B94]"
              : "border-neutral-300 bg-neutral-100 text-neutral-600 hover:text-black hover:bg-neutral-200"
          }`}
        >
          <FileSignature className="w-4 h-4 text-[#0E4B94]" />
          <span className="min-w-0 break-words text-center">
            {isVi
              ? "8. Hợp Đồng Ngoại Thương & Đàm Phán B2B (Chat Realtime)"
              : "8. E-Contract & Live B2B Negotiation"}
          </span>
        </button>
      </div>

      {/* Tab Content Display */}
      {activeTab === "analytics" && <ExportAnalyticsDashboard />}
      {activeTab === "documents" && <ExportDocumentDownloader />}
      {activeTab === "inventory" && <WarehouseInventoryMonitor />}
      {activeTab === "orders" && <OrderManagementPanel />}
      {activeTab === "partners" && <PartnerVerificationPanel />}
      {activeTab === "products" && <ProductManagementPanel />}
      {activeTab === "media" && <ProductMediaManagerPanel />}
      {activeTab === "contracts" && <ContractManagementPanel />}
    </div>
  );
}