"use client";

import React, { useState } from "react";
import { Product, RfqRequestDto, RfqItemDto } from "@/types";
import { Send, Plus, Trash2, Shield, Calendar, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language } = useLanguage();
  const isVi = language === "vi";

  const [incoterm, setIncoterm] = useState<"FOB" | "CIF" | "CFR" | "EXW" | "DDP">("FOB");
  const [portOfLoading, setPortOfLoading] = useState(
    isVi ? "Cảng Tân Cảng Cát Lái, TP.HCM" : "Cat Lai Port, Ho Chi Minh City"
  );
  const [portOfDischarge, setPortOfDischarge] = useState(
    isVi ? "Cảng Tokyo, Nhật Bản" : "Tokyo Port, Japan"
  );
  const [targetDate, setTargetDate] = useState("2026-11-15");
  const [items, setItems] = useState<RfqItemDto[]>([
    {
      productId: availableProducts[0]?.id || 1,
      productName:
        availableProducts[0]?.translations.find((tr) => tr.languageCode === language)?.name ||
        availableProducts[0]?.translations[0]?.name ||
        "Giày thể thao Sneaker xuất khẩu",
      quantity: 1200,
      targetPriceUsd: 19.5,
      customRequirements: isVi ? "Đóng gói thùng 5 lớp chống ẩm silica gel" : "5-ply export carton with silica gel desiccant",
    },
  ]);

  const handleAddItem = () => {
    if (availableProducts.length > 0) {
      const prod = availableProducts[0];
      const prodName =
        prod.translations.find((tr) => tr.languageCode === language)?.name ||
        prod.translations[0]?.name ||
        prod.baseSku;

      setItems([
        ...items,
        {
          productId: prod.id,
          productName: prodName,
          quantity: 500,
          targetPriceUsd: prod.defaultRetailPriceUsd * 0.8,
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
      const pName =
        prod?.translations.find((tr) => tr.languageCode === language)?.name ||
        prod?.translations[0]?.name ||
        prod?.baseSku;

      updated[index] = {
        ...updated[index],
        productId: Number(value),
        productName: pName,
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
    <form onSubmit={handleSubmit} className="border border-black bg-white p-6 space-y-6 rounded">
      {/* Title */}
      <div className="border-b border-black pb-4">
        <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-500">
          {isVi ? "YÊU CẦU BÁO GIÁ XUẤT KHẨU DOANH NGHIỆP B2B" : "B2B EXPORT REQUEST FOR QUOTATION (EXP-65)"}
        </span>
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          {isVi ? "Tạo Yêu Cầu Báo Giá Xuất Khẩu B2B" : "Create International B2B RFQ"}
        </h2>
      </div>

      {/* Trade Terms Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Incoterms 2020 */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5" />
            {isVi ? "Điều kiện Incoterms 2020" : "Incoterms 2020 Rule"}
          </label>
          <select
            value={incoterm}
            onChange={(e) => setIncoterm(e.target.value as "FOB" | "CIF" | "CFR" | "EXW" | "DDP")}
            className="w-full border border-black p-2 text-sm font-mono focus:outline-none rounded bg-white"
          >
            <option value="FOB">FOB - Free On Board ({isVi ? "Cảng Cát Lái" : "Cat Lai Port"})</option>
            <option value="CIF">CIF - Cost, Insurance & Freight</option>
            <option value="CFR">CFR - Cost and Freight</option>
            <option value="EXW">EXW - Ex Works ({isVi ? "Kho xưởng Bình Dương" : "Binh Duong Warehouse"})</option>
            <option value="DDP">DDP - Delivered Duty Paid</option>
          </select>
        </div>

        {/* Port of Loading */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {isVi ? "Cảng đi (Port of Loading - POL)" : "Port of Loading (POL)"}
          </label>
          <input
            type="text"
            value={portOfLoading}
            onChange={(e) => setPortOfLoading(e.target.value)}
            className="w-full border border-black p-2 text-sm focus:outline-none rounded"
          />
        </div>

        {/* Port of Discharge */}
        <div>
          <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {isVi ? "Cảng đến (Port of Discharge - POD)" : "Port of Discharge (POD)"}
          </label>
          <input
            type="text"
            value={portOfDischarge}
            onChange={(e) => setPortOfDischarge(e.target.value)}
            className="w-full border border-black p-2 text-sm focus:outline-none rounded"
            placeholder={isVi ? "VD: Tokyo Port, Los Angeles, Hamburg..." : "e.g. Tokyo Port, Los Angeles, Hamburg..."}
          />
        </div>
      </div>

      {/* Target Delivery Date */}
      <div className="w-full sm:w-1/3">
        <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {isVi ? "Ngày mục tiêu nhận hàng" : "Target Delivery Date"}
        </label>
        <input
          type="date"
          value={targetDate}
          onChange={(e) => setTargetDate(e.target.value)}
          className="w-full border border-black p-2 text-sm font-mono focus:outline-none rounded"
        />
      </div>

      {/* Items Section */}
      <div className="space-y-3 pt-4 border-t border-black/15">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black">
            {isVi
              ? `Danh sách mặt hàng đặt đóng Container (${items.length})`
              : `Container Cargo Manifest (${items.length})`}
          </h3>
          <button
            type="button"
            onClick={handleAddItem}
            className="flex items-center gap-1 border border-black px-3 py-1.5 text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors rounded"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isVi ? "Thêm sản phẩm" : "Add Product"}</span>
          </button>
        </div>

        {items.map((item, idx) => (
          <div key={idx} className="border border-black/20 p-4 bg-neutral-50 grid grid-cols-1 md:grid-cols-12 gap-3 items-center rounded">
            {/* Select Product */}
            <div className="md:col-span-4">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                {isVi ? "Mặt hàng xuất khẩu" : "Export Product"}
              </label>
              <select
                value={item.productId}
                onChange={(e) => handleItemChange(idx, "productId", e.target.value)}
                className="w-full border border-black/40 bg-white p-2 text-xs focus:outline-none rounded"
              >
                {availableProducts.map((p) => {
                  const pName =
                    p.translations.find((tr) => tr.languageCode === language)?.name ||
                    p.translations[0]?.name ||
                    p.baseSku;
                  return (
                    <option key={p.id} value={p.id}>
                      [{p.hsCode}] {pName}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Quantity */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                {isVi ? "Số lượng đặt (Pcs)" : "Quantity (Units)"}
              </label>
              <input
                type="number"
                min="10"
                value={item.quantity}
                onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                className="w-full border border-black/40 bg-white p-2 text-xs font-mono focus:outline-none rounded"
              />
            </div>

            {/* Target Price */}
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                {isVi ? "Giá kỳ vọng (USD)" : "Target Unit Price (USD)"}
              </label>
              <input
                type="number"
                step="0.01"
                value={item.targetPriceUsd}
                onChange={(e) => handleItemChange(idx, "targetPriceUsd", Number(e.target.value))}
                className="w-full border border-black/40 bg-white p-2 text-xs font-mono focus:outline-none rounded"
              />
            </div>

            {/* Custom Packaging Notes */}
            <div className="md:col-span-3">
              <label className="block text-[10px] font-mono uppercase text-neutral-500 mb-1">
                {isVi ? "Yêu cầu bao bì / In ấn" : "Custom Packaging & Labeling"}
              </label>
              <input
                type="text"
                value={item.customRequirements || ""}
                onChange={(e) => handleItemChange(idx, "customRequirements", e.target.value)}
                placeholder={isVi ? "VD: In logo thương hiệu, dán nhãn pallet..." : "e.g. Custom OEM carton, pallet barcode..."}
                className="w-full border border-black/40 bg-white p-2 text-xs focus:outline-none rounded"
              />
            </div>

            {/* Remove */}
            <div className="md:col-span-1 flex justify-end md:justify-center">
              <button
                type="button"
                onClick={() => handleRemoveItem(idx)}
                disabled={items.length === 1}
                className="p-2 text-neutral-400 hover:text-black disabled:opacity-30"
                title={isVi ? "Xóa dòng" : "Remove item"}
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
          className="flex items-center gap-2 bg-[#0E4B94] hover:bg-[#0a376d] px-8 py-3 text-sm font-black uppercase tracking-wider text-white disabled:opacity-50 transition-colors rounded shadow-sm"
        >
          <Send className="w-4 h-4" />
          <span>
            {isSubmitting
              ? (isVi ? "Đang gửi báo giá..." : "Submitting RFQ...")
              : (isVi ? "Gửi yêu cầu báo giá chính thức" : "Submit Formal B2B RFQ")}
          </span>
        </button>
      </div>
    </form>
  );
};
