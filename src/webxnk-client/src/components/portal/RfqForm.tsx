"use client";

import React, { useState } from "react";
import { Product, RfqRequestDto, RfqItemDto } from "@/types";
import { Send, Plus, Trash2, Shield, Calendar, MapPin } from "lucide-react";

interface RfqFormProps {
  availableProducts: Product[];
  onSubmitRfq: (rfq: RfqRequestDto) => Promise<void>;
  isSubmitting?: boolean;
}

export const RfqForm: React.FC<RfqFormProps> = ({
  availableProducts,
  onSubmitRfq,
  isSubmitting = false,
}) => {
  const [incoterm, setIncoterm] = useState<"FOB" | "CIF" | "CFR" | "EXW" | "DDP">("FOB");
  const [portOfLoading, setPortOfLoading] = useState("Cat Lai Port, Ho Chi Minh City");
  const [portOfDischarge, setPortOfDischarge] = useState("Tokyo Port, Japan");
  const [targetDate, setTargetDate] = useState("2026-11-15");
  const [items, setItems] = useState<RfqItemDto[]>([
    {
      productId: availableProducts[0]?.id || 1,
      productName: availableProducts[0]?.translations[0]?.name || "Giày thể thao Sneaker xuất khẩu",
      quantity: 1200,
      targetPriceUsd: 19.5,
      customRequirements: "Đóng gói thùng 5 lớp chống ẩm silica gel",
    },
  ]);

  const handleAddItem = () => {
    if (availableProducts.length > 0) {
      setItems([
        ...items,
        {
          productId: availableProducts[0].id,
          productName: availableProducts[0].translations[0]?.name,
          quantity: 500,
          targetPriceUsd: availableProducts[0].defaultRetailPriceUsd * 0.8,
          customRequirements: "",
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof RfqItemDto, value: string | number) => {
    const updated = [...items];
    if (field === "productId") {
      const prod = availableProducts.find((p) => p.id === Number(value));
      updated[index] = {
        ...updated[index],
        productId: Number(value),
        productName: prod?.translations[0]?.name,
        targetPriceUsd: (prod?.defaultRetailPriceUsd || 10) * 0.8,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rfqPayload: RfqRequestDto = {
      incotermCode: incoterm,
      portOfLoading,
      portOfDischarge,
      targetDeliveryDate: targetDate,
      items,
    };
    await onSubmitRfq(rfqPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="border border-black bg-white p-6 space-y-6">
      {/* Title */}
      <div className="border-b border-black pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          B2B EXPORT REQUEST FOR QUOTATION (EXP-65)
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          Tạo yêu cầu báo giá xuất khẩu B2B
        </h2>
      </div>

      {/* Trade Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Incoterms 2020 */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            Điều kiện Incoterms 2020
          </label>
          <select
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value as "FOB" | "CIF" | "CFR" | "EXW" | "DDP")}
            className="w-full border border-black p-2 text-sm font-mono focus:outline-none"
          >
            <option value="FOB">FOB - Free On Board (Cảng Cát Lái)</option>
            <option value="CIF">CIF - Cost, Insurance & Freight</option>
            <option value="CFR">CFR - Cost and Freight</option>
            <option value="EXW">EXW - Ex Works (Kho xưởng Bình Dương)</option>
            <option value="DDP">DDP - Delivered Duty Paid</option>
          </select>
        </div>

        {/* Port of Loading */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Cảng đi (Port of Loading - POL)
          </label>
          <input
            type="text"
            value={portOfLoading}
            onChange={(e) => setPortOfLoading(e.target.value)}
            className="w-full border border-black p-2 text-sm focus:outline-none"
          />
        </div>

        {/* Port of Discharge */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            Cảng đến (Port of Discharge - POD)
          </label>
          <input
            type="text"
            value={portOfDischarge}
            onChange={(e) => setPortOfDischarge(e.target.value)}
            className="w-full border border-black p-2 text-sm focus:outline-none"
            placeholder="VD: Tokyo Port, Los Angeles, Hamburg..."
          />
        </div>
      </div>

      {/* Target Delivery Date */}
      <div className="w-full sm:w-1/3">
        <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          Ngày mục tiêu nhận hàng
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full border border-black p-2 text-sm font-mono focus:outline-none"
        />
      </div>

      {/* Items Section */}
      <div className="space-y-3 pt-4 border-t border-black/15">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            Danh sách mặt hàng đặt đóng Container ({items.length})
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 border border-black px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm sản phẩm</span>
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="border border-black/20 p-4 bg-neutral-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
            {/* Select Product */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Mặt hàng xuất khẩu</label>
              <select
                value={item.productId}
                onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                className="w-full border border-black/40 bg-white p-2 text-xs focus:outline-none"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.hsCode}] {p.translations[0]?.name || p.baseSku}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Số lượng đặt (Pcs)</label>
              <input
                type="number"
                min="10"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                className="w-full border border-black/40 bg-white p-2 text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Target Price */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Giá kỳ vọng (USD)</label>
              <input
                type="number"
                step="0.01"
                value={item.targetPriceUsd}
                onChange={(e) => handleItemChange(idx, "targetPriceUsd", Number(e.target.value))}
                className="w-full border border-black/40 bg-white p-2 text-xs font-mono focus:outline-none"
              />
            </div>

            {/* Custom Packaging Notes */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">Yêu cầu bao bì / In ấn</label>
              <input
                type="text"
                value={item.customRequirements || ""}
                onChange={(e) => handleItemChange(idx, "customRequirements", e.target.value)}
                placeholder="VD: In logo thương hiệu, dán nhãn pallet..."
                className="w-full border border-black/40 bg-white p-2 text-xs focus:outline-none"
              />
            </div>

            {/* Remove */}
            <div className="md:col-span-1 flex justify-end md:justify-center">
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                disabled={items.length === 1}
                className="p-2 text-neutral-400 hover:text-black disabled:opacity-30"
                title="Xóa dòng"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="border-t border-black pt-4 flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 bg-black px-8 py-3 text-sm font-black uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>{isSubmitting ? "Đang gửi báo giá..." : "Gửi yêu cầu báo giá chính thức"}</span>
        </button>
      </div>
    </form>
  );
};
