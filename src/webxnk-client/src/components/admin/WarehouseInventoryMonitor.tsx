"use client";

import React, { useState, useEffect } from "react";
import { Warehouse, InventoryBalance } from "@/types";
import { Warehouse as WhIcon, Clock, CheckCircle } from "lucide-react";
import { inventoryApi } from "@/services/api";

export const WarehouseInventoryMonitor: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([
    {
      id: 1,
      code: "WH-BINHDUONG",
      name: "Kho Tổng Sản Xuất & Lưu Trữ Bình Dương",
      warehouseType: "FACTORY_CENTRAL",
      address: "KCN VSIP 1, TP. Thuận An, Tỉnh Bình Dương",
      isActive: true,
    },
    {
      id: 2,
      code: "WH-CATLAI",
      name: "Kho Cảng Cát Lái (Kho Ngoại Quan Xuất Khẩu)",
      warehouseType: "PORT_BONDED",
      address: "Cổng B Cảng Tân Cảng Cát Lái, Đ. Nguyễn Thị Định, TP. Thủ Đức, TP. HCM",
      isActive: true,
    },
  ]);

  const [balances, setBalances] = useState<InventoryBalance[]>([
    {
      warehouseId: 1,
      warehouseCode: "WH-BINHDUONG",
      warehouseName: "Kho Tổng Bình Dương",
      productId: 1,
      productSku: "SHOES-SNK-V1",
      availableQuantity: 3800,
      reservedQuantity: 1200, // Đang giữ chỗ cho RFQ Nhật Bản
    },
    {
      warehouseId: 1,
      warehouseCode: "WH-BINHDUONG",
      warehouseName: "Kho Tổng Bình Dương",
      productId: 2,
      productSku: "CHAR-COCO-BBQ",
      availableQuantity: 10000,
      reservedQuantity: 5000,
    },
    {
      warehouseId: 2,
      warehouseCode: "WH-CATLAI",
      warehouseName: "Kho Cát Lái",
      productId: 4,
      productSku: "AGRI-CASHEW-W320",
      availableQuantity: 2500,
      reservedQuantity: 0,
    },
    {
      warehouseId: 2,
      warehouseCode: "WH-CATLAI",
      warehouseName: "Kho Cát Lái",
      productId: 5,
      productSku: "TAPE-OPP-48X100",
      availableQuantity: 8560,
      reservedQuantity: 1440,
    },
  ]);

  useEffect(() => {
    inventoryApi.getWarehouses().then((res) => {
      if (res && Array.isArray(res) && res.length > 0) {
        setWarehouses(res);
      }
    });

    inventoryApi.getStockBalance(1).then((res) => {
      if (res && Array.isArray(res) && res.length > 0) {
        setBalances(res);
      }
    });
  }, []);

  return (
    <div className="border border-black bg-white p-6 space-y-6">
      <div className="border-b border-black pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          MULTI-WAREHOUSE INVENTORY & 30-MIN STOCK RESERVATIONS (EXP-77, EXP-78, EXP-79)
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
          <WhIcon className="w-5 h-5" />
          Giám sát tồn kho thực tế & Phiên giữ chỗ tự động
        </h2>
      </div>

      {/* 2 Warehouses Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {warehouses.map((wh) => (
          <div key={wh.id} className="border border-black p-4 bg-neutral-50">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-mono font-bold bg-black text-white px-2 py-0.5">
                  {wh.code}
                </span>
                <h3 className="mt-2 font-bold text-black text-sm">{wh.name}</h3>
                <p className="text-xs text-neutral-600 mt-1">{wh.address}</p>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-black">
                <CheckCircle className="w-3.5 h-3.5" />
                HOẠT ĐỘNG
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stock Balance Table */}
      <div className="border border-black overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-black text-white uppercase text-[11px]">
            <tr>
              <th className="p-3">Kho hàng</th>
              <th className="p-3">Mã SKU</th>
              <th className="p-3 text-right">Khả dụng (Available)</th>
              <th className="p-3 text-right">Giữ chỗ 30p (Reserved)</th>
              <th className="p-3 text-right">Tổng tồn sổ cái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/10">
            {balances.map((b, idx) => (
              <tr key={idx} className="hover:bg-neutral-50 transition-colors">
                <td className="p-3 font-semibold text-black">{b.warehouseName}</td>
                <td className="p-3 font-bold">{b.productSku}</td>
                <td className="p-3 text-right font-black text-black">
                  {b.availableQuantity.toLocaleString("vi-VN")} sp
                </td>
                <td className="p-3 text-right font-semibold text-neutral-700 flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-black" />
                  <span>{b.reservedQuantity.toLocaleString("vi-VN")} sp</span>
                </td>
                <td className="p-3 text-right font-black text-black">
                  {(b.availableQuantity + b.reservedQuantity).toLocaleString("vi-VN")} sp
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 border border-black bg-neutral-50 text-[11px] font-mono text-neutral-700">
        * <strong>Quy tắc hệ thống (EXP-79)</strong>: Đơn hàng hoặc RFQ đang đàm phán sẽ tự động giữ chỗ (Stock Reservation) trong vòng 30 phút. Nếu quá hạn mà không thanh toán hoặc xác nhận, Background Worker sẽ tự động hoàn trả số lượng về quỹ tồn kho khả dụng.
      </div>
    </div>
  );
};
