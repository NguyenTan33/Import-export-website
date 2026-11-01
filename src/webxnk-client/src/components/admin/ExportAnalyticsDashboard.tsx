"use client";

import React, { useEffect, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { OrderHistoryEntry, RfqHistoryEntry, adminApi, ordersApi } from "@/services/api";
import { useCurrency } from "@/context/CurrencyContext";

export const ExportAnalyticsDashboard: React.FC = () => {
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<OrderHistoryEntry[]>([]);
  const [rfqs, setRfqs] = useState<RfqHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderData, rfqData] = await Promise.all([ordersApi.getAllOrders(), adminApi.getAllRfqs()]);
      setOrders(orderData);
      setRfqs(Array.isArray(rfqData) ? rfqData as RfqHistoryEntry[] : []);
    } catch {
      setError("Không thể tải báo cáo từ dữ liệu máy chủ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const b2cRevenue = orders.filter((order) => order.orderType === "B2C").reduce((sum, order) => sum + order.totalAmountUsd, 0);
  const b2bRevenue = rfqs.reduce((sum, rfq) => sum + (rfq.totalQuotedAmountUsd || 0), 0);
  const markets = Array.from(new Set(orders.map((order) => order.destinationCountryCode).filter(Boolean)))
    .map((country) => ({ country, count: orders.filter((order) => order.destinationCountryCode === country).length }))
    .sort((left, right) => right.count - left.count);
  const statuses = Array.from(new Set(rfqs.map((rfq) => rfq.status)))
    .map((status) => ({ status, count: rfqs.filter((rfq) => rfq.status === status).length }));

  return <section className="space-y-6 border border-black bg-white p-6">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-black pb-4">
      <div><span className="text-[10px] font-mono uppercase tracking-widest text-[#0E4B94]">BÁO CÁO TỪ CSDL</span>
        <h2 className="mt-1 flex items-center gap-2 text-xl font-black uppercase"><BarChart3 className="h-5 w-5 text-[#0E4B94]" /> Phân tích đơn hàng và RFQ</h2></div>
      <button onClick={() => void load()} disabled={loading} className="flex items-center gap-2 border border-black px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Làm mới</button>
    </header>
    {error && <p role="alert" className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Tổng đơn B2C" value={String(orders.filter((order) => order.orderType === "B2C").length)} />
      <Metric label="Doanh thu B2C" value={formatPrice(b2cRevenue)} />
      <Metric label="Tổng RFQ" value={String(rfqs.length)} />
      <Metric label="Giá trị báo giá B2B" value={formatPrice(b2bRevenue)} />
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="border border-neutral-300 p-4"><h3 className="mb-3 text-sm font-bold">Đơn hàng theo thị trường đích</h3>
        {markets.length ? <ul className="divide-y divide-neutral-200">{markets.map((market) => <li key={market.country} className="flex justify-between py-2 text-sm"><span>{market.country}</span><strong>{market.count}</strong></li>)}</ul> : <Empty loading={loading} />}</div>
      <div className="border border-neutral-300 p-4"><h3 className="mb-3 text-sm font-bold">RFQ theo trạng thái</h3>
        {statuses.length ? <ul className="divide-y divide-neutral-200">{statuses.map((item) => <li key={item.status} className="flex justify-between py-2 text-sm"><span>{item.status}</span><strong>{item.count}</strong></li>)}</ul> : <Empty loading={loading} />}</div>
    </div>
  </section>;
};

const Metric = ({ label, value }: { label: string; value: string }) => <div className="border border-neutral-300 bg-neutral-50 p-4"><span className="text-[10px] font-mono uppercase text-neutral-500">{label}</span><strong className="mt-2 block text-xl font-black text-[#0E4B94]">{value}</strong></div>;
const Empty = ({ loading }: { loading: boolean }) => <p className="py-6 text-center text-sm text-neutral-500">{loading ? "Đang tải dữ liệu..." : "Chưa có dữ liệu trong CSDL."}</p>;
