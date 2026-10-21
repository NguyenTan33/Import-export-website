"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Warehouse as WarehouseIcon, RefreshCw } from "lucide-react";
import { Warehouse } from "@/types";
import { inventoryApi } from "@/services/api";

type ProductStock = Awaited<ReturnType<typeof inventoryApi.getAllStockSummaries>>[number];

export const WarehouseInventoryMonitor: React.FC = () => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stocks, setStocks] = useState<ProductStock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [warehouseData, stockData] = await Promise.all([
        inventoryApi.getWarehouses(),
        inventoryApi.getAllStockSummaries(),
      ]);
      setWarehouses(warehouseData);
      setStocks(stockData);
    } catch {
      setError("Không thể tải dữ liệu kho từ máy chủ.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  return (
    <div className="space-y-6 border border-black bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-black pb-4">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">TỒN KHO THỰC TẾ</span>
          <h2 className="flex items-center gap-2 text-xl font-black uppercase tracking-tight text-black">
            <WarehouseIcon className="h-5 w-5" /> Giám sát tồn kho và kho hàng
          </h2>
        </div>
        <button onClick={() => void refresh()} disabled={isLoading} className="flex items-center gap-2 border border-black px-3 py-2 text-xs font-bold disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} /> Làm mới
        </button>
      </div>
      {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Kho hàng ({warehouses.length})</h3>
        {warehouses.length ? <div className="grid gap-3 md:grid-cols-2">
          {warehouses.map((warehouse) => <article key={warehouse.id} className="border border-neutral-300 p-4">
            <div className="font-mono text-xs font-bold">{warehouse.code}</div>
            <h4 className="mt-1 font-semibold">{warehouse.name}</h4>
            <p className="mt-1 text-xs text-neutral-600">{warehouse.address}</p>
          </article>)}
        </div> : <p className="border border-dashed border-neutral-300 p-4 text-sm text-neutral-500">Chưa có kho hàng trong CSDL.</p>}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-bold">Tồn kho theo sản phẩm ({stocks.length})</h3>
        <div className="overflow-x-auto border border-neutral-300">
          <table className="w-full min-w-[650px] text-left text-xs">
            <thead className="bg-neutral-900 text-white"><tr>
              <th className="p-3">Sản phẩm / SKU</th><th className="p-3 text-right">Tồn vật lý</th><th className="p-3 text-right">Đang giữ</th><th className="p-3 text-right">Khả dụng</th><th className="p-3">Phân bổ theo kho</th>
            </tr></thead>
            <tbody className="divide-y divide-neutral-200">
              {stocks.map((stock) => <tr key={stock.productId}>
                <td className="p-3"><span className="font-semibold">{stock.productName}</span><span className="block text-neutral-500">{stock.baseSku}</span></td>
                <td className="p-3 text-right">{stock.totalPhysicalStock.toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right">{(stock.totalPhysicalStock - stock.availableStock).toLocaleString("vi-VN")}</td>
                <td className="p-3 text-right font-bold">{stock.availableStock.toLocaleString("vi-VN")}</td>
                <td className="p-3">{stock.warehouseBreakdown.map((warehouse) => `${warehouse.warehouseName}: ${warehouse.currentStock.toLocaleString("vi-VN")}`).join(" · ") || "—"}</td>
              </tr>)}
              {!stocks.length && <tr><td colSpan={5} className="p-6 text-center text-neutral-500">Chưa có số liệu tồn kho trong CSDL.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
