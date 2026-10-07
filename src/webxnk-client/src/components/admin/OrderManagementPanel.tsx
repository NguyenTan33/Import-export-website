"use client";

import React, { useState } from "react";
import { 
  Package, 
  Ship, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";

interface AdminOrder {
  id: string;
  customerName: string;
  country: string;
  type: "B2C_RETAIL" | "B2B_WHOLESALE";
  date: string;
  totalUsd: number;
  itemCount: number;
  status: "PAID" | "PACKING" | "SHIPPED" | "DELIVERED";
  trackingNo?: string;
  portOfLoading: string;
  destinationPort: string;
}

const INITIAL_ORDERS: AdminOrder[] = [
  {
    id: "ORD-2026-8891",
    customerName: "John Doe",
    country: "Japan (Tokyo)",
    type: "B2C_RETAIL",
    date: "2026-09-28",
    totalUsd: 155.0,
    itemCount: 15,
    status: "PACKING",
    trackingNo: "BL-CATLAI-TYO-9921",
    portOfLoading: "Cảng Tân Cảng Cát Lái (VN SGN)",
    destinationPort: "Tokyo Port (JP TYO)",
  },
  {
    id: "ORD-2026-7732",
    customerName: "Alice Smith",
    country: "United States (California)",
    type: "B2C_RETAIL",
    date: "2026-09-15",
    totalUsd: 120.0,
    itemCount: 20,
    status: "SHIPPED",
    trackingNo: "BL-CATLAI-LAX-4418",
    portOfLoading: "Cảng Cái Mép - Thị Vải (VN CM)",
    destinationPort: "Los Angeles Port (US LAX)",
  },
  {
    id: "ORD-2026-B2B-014",
    customerName: "Tokyo Overseas Logistics Co., Ltd",
    country: "Japan",
    type: "B2B_WHOLESALE",
    date: "2026-09-22",
    totalUsd: 84500.0,
    itemCount: 500,
    status: "PACKING",
    trackingNo: "BL-FCL-TYO-2026-01",
    portOfLoading: "Cảng Tân Cảng Cát Lái (VN SGN)",
    destinationPort: "Yokohama Port (JP YOM)",
  },
  {
    id: "ORD-2026-9012",
    customerName: "Michael Brown",
    country: "Germany (Hamburg)",
    type: "B2C_RETAIL",
    date: "2026-09-10",
    totalUsd: 210.0,
    itemCount: 25,
    status: "DELIVERED",
    trackingNo: "BL-CATLAI-HAM-1102",
    portOfLoading: "Cảng Tân Cảng Cát Lái (VN SGN)",
    destinationPort: "Hamburg Port (DE HAM)",
  },
  {
    id: "ORD-2026-9430",
    customerName: "David Miller",
    country: "Australia (Sydney)",
    type: "B2C_RETAIL",
    date: "2026-09-29",
    totalUsd: 95.0,
    itemCount: 8,
    status: "PAID",
    portOfLoading: "Cảng Tân Cảng Cát Lái (VN SGN)",
    destinationPort: "Sydney Port (AU SYD)",
  },
];

export const OrderManagementPanel: React.FC = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  const [orders, setOrders] = useState<AdminOrder[]>(INITIAL_ORDERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null);
  const [newStatus, setNewStatus] = useState<AdminOrder["status"]>("PACKING");
  const [newTrackingNo, setNewTrackingNo] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchSearch = 
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleUpdateStatus = () => {
    if (!selectedOrder) return;
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === selectedOrder.id) {
          return {
            ...o,
            status: newStatus,
            trackingNo: newTrackingNo.trim() ? newTrackingNo.trim() : o.trackingNo,
          };
        }
        return o;
      })
    );
    setSuccessMsg(
      isVi
        ? `Đã cập nhật đơn ${selectedOrder.id} sang trạng thái: ${newStatus}`
        : `Order ${selectedOrder.id} updated to status: ${newStatus}`
    );
    setSelectedOrder(null);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Alert banner */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-sm flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={isVi ? "Tìm mã đơn, tên khách, quốc gia..." : "Search Order ID, buyer, country..."}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#0E4B94]"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700"
          >
            <option value="ALL">{isVi ? "Tất cả trạng thái" : "All Statuses"}</option>
            <option value="PAID">{isVi ? "Đã thanh toán (Chờ đóng gói)" : "Paid (Awaiting Pack)"}</option>
            <option value="PACKING">{isVi ? "Đang đóng cont tại Cát Lái" : "Packing at Cat Lai"}</option>
            <option value="SHIPPED">{isVi ? "Đã xuất cảng (Trên biển)" : "Shipped (On Sea)"}</option>
            <option value="DELIVERED">{isVi ? "Đã giao hàng thành công" : "Delivered"}</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">{isVi ? "Mã Đơn Hàng" : "Order ID"}</th>
                <th className="py-3.5 px-4">{isVi ? "Khách Hàng / Quốc Gia" : "Buyer / Country"}</th>
                <th className="py-3.5 px-4">{isVi ? "Loại Đơn" : "Order Type"}</th>
                <th className="py-3.5 px-4">{isVi ? "Tổng Giá Trị" : "Total Amount"}</th>
                <th className="py-3.5 px-4">{isVi ? "Cảng Đi / Cảng Đến" : "POL / POD"}</th>
                <th className="py-3.5 px-4">{isVi ? "Trạng Thái" : "Status"}</th>
                <th className="py-3.5 px-4 text-right">{isVi ? "Thao Tác" : "Actions"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    {isVi ? "Không tìm thấy đơn hàng nào phù hợp." : "No matching orders found."}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {order.id}
                      <span className="block text-[10px] font-normal text-slate-400">{order.date}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-slate-800">{order.customerName}</p>
                      <p className="text-[11px] text-slate-500">{order.country}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                        order.type === "B2B_WHOLESALE"
                          ? "bg-blue-100 text-[#0E4B94]"
                          : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {order.type === "B2B_WHOLESALE" ? "B2B CONTAINER" : "B2C MUA LẺ"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0E4B94]">
                      {formatPrice(order.totalUsd)}
                      <span className="block text-[10px] font-normal text-slate-400">{order.itemCount} items</span>
                    </td>
                    <td className="py-3.5 px-4 text-[11px]">
                      <span className="text-slate-600 block">POL: {order.portOfLoading}</span>
                      <span className="text-[#0E4B94] font-medium block">POD: {order.destinationPort}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {order.status === "PAID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          {isVi ? "Chờ đóng gói" : "Paid"}
                        </span>
                      )}
                      {order.status === "PACKING" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-[#0E4B94] border border-blue-200">
                          <Package className="w-3 h-3" />
                          {isVi ? "Đóng kho Cát Lái" : "Packing"}
                        </span>
                      )}
                      {order.status === "SHIPPED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                          <Ship className="w-3 h-3" />
                          {isVi ? "Đã xuất cảng" : "Shipped"}
                        </span>
                      )}
                      {order.status === "DELIVERED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          {isVi ? "Đã giao hàng" : "Delivered"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setNewStatus(order.status);
                          setNewTrackingNo(order.trackingNo || "");
                        }}
                        className="px-3 py-1.5 rounded bg-slate-100 hover:bg-[#0E4B94] hover:text-white text-slate-700 font-semibold transition-colors"
                      >
                        {isVi ? "Cập nhật" : "Update"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Cập nhật Trạng Thái Đơn Hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs text-slate-400 font-mono">EXP-39 / ORDERS CONTROLLER</span>
                <h3 className="text-lg font-bold text-slate-900">
                  {isVi ? `Cập Nhật Trạng Thái Đơn: ${selectedOrder.id}` : `Update Order: ${selectedOrder.id}`}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isVi ? "Chọn Trạng Thái Chu Trình Vận Chuyển:" : "Select Shipping Lifecycle Status:"}
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AdminOrder["status"])}
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-[#0E4B94]"
                >
                  <option value="PAID">{isVi ? "1. ĐÃ THANH TOÁN (Chờ xếp hàng)" : "1. PAID (Awaiting stowage)"}</option>
                  <option value="PACKING">{isVi ? "2. ĐANG ĐÓNG GÓI / CONT TẠI KHO CÁT LÁI" : "2. PACKING AT CAT LAI WAREHOUSE"}</option>
                  <option value="SHIPPED">{isVi ? "3. ĐÃ XUẤT CẢNG (Tàu rời cảng POL)" : "3. SHIPPED (Vessel departed POL)"}</option>
                  <option value="DELIVERED">{isVi ? "4. ĐÃ GIAO HÀNG TỚI CẢNG ĐÍCH (POD)" : "4. DELIVERED AT POD"}</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">
                  {isVi ? "Số Vận Đơn Biển (Bill of Lading - B/L):" : "Ocean Bill of Lading (B/L) Number:"}
                </label>
                <input
                  type="text"
                  value={newTrackingNo}
                  onChange={(e) => setNewTrackingNo(e.target.value)}
                  placeholder="e.g. BL-CATLAI-TYO-9921"
                  className="w-full border border-slate-200 rounded-lg p-2.5 text-xs font-mono focus:outline-none focus:border-[#0E4B94]"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  {isVi 
                    ? "Mã B/L này sẽ lập tức hiển thị cho khách hàng tra cứu vệ tinh AIS tại /tracking." 
                    : "This B/L number will instantly sync with the AIS satellite tracker at /tracking."}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
              >
                {isVi ? "Hủy bỏ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleUpdateStatus}
                className="px-4 py-2 rounded-lg bg-[#0E4B94] text-white text-xs font-bold hover:bg-[#0b3d78] shadow-md shadow-blue-900/20"
              >
                {isVi ? "Lưu Trạng Thái" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
