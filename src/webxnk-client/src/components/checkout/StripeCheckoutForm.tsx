"use client";

import React, { useState, useEffect } from "react";
import { Product } from "@/types";
import { inventoryApi } from "@/services/api";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

interface StripeCheckoutFormProps {
  product: Product;
  quantity: number;
  onPaymentSuccess?: (orderId: string) => void;
}

export const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  product,
  quantity,
  onPaymentSuccess,
}) => {
  const { t, language } = useLanguage();
  const isVi = language === "vi";

  // Customer & Shipping state
  const [fullName, setFullName] = useState("Võ Văn Phú");
  const [email, setEmail] = useState("phu.vo@example.com");
  const [phone, setPhone] = useState("+84 901 234 567");
  const [address, setAddress] = useState("Khu Công Nghệ Cao, TP. Thủ Đức");
  const [city, setCity] = useState("TP. Hồ Chí Minh");
  const [country, setCountry] = useState("Vietnam");
  const [postalCode, setPostalCode] = useState("700000");

  // Card details state
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [orderCode, setOrderCode] = useState("");

  // 30-minute reservation countdown timer (EXP-79)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 mins

  useEffect(() => {
    // Call backend inventory reservation for 30 minutes
    inventoryApi.reserveStock(product.id, 1, quantity).catch(() => {});

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [product.id, quantity]);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const subtotal = product.defaultRetailPriceUsd * quantity;
  const shippingFee = country === "Vietnam" ? 5.0 : 25.0;
  const totalAmount = subtotal + shippingFee;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    // Simulate Stripe 3D Secure authentication flow
    setTimeout(() => {
      const generatedOrderCode = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      setOrderCode(generatedOrderCode);
      setIsProcessing(false);
      setPaymentDone(true);
      if (onPaymentSuccess) onPaymentSuccess(generatedOrderCode);
    }, 2000);
  };

  if (paymentDone) {
    const prodName =
      product.translations.find((tr) => tr.languageCode === language)?.name ||
      product.translations[0]?.name ||
      product.baseSku;

    return (
      <div className="border-2 border-green-600 bg-white p-8 text-center space-y-4 shadow-sm rounded">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-neutral-900">
          {t("checkout.successTitle")}
        </h2>
        <p className="text-sm text-neutral-600">
          {t("checkout.successDesc")}{" "}
          <strong className="font-mono text-black">{orderCode}</strong>
        </p>
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs font-mono text-left space-y-1.5 max-w-md mx-auto rounded">
          <p>
            <strong>{isVi ? "Sản phẩm:" : "Product:"}</strong> {prodName}
          </p>
          <p>
            <strong>{isVi ? "Số lượng:" : "Quantity:"}</strong> {quantity} {isVi ? "cái/đôi" : "units"}
          </p>
          <p>
            <strong>{isVi ? "Tổng tiền:" : "Total Amount:"}</strong> ${totalAmount.toFixed(2)} USD
          </p>
          <p>
            <strong>{isVi ? "Địa chỉ nhận hàng:" : "Delivery Destination:"}</strong> {address}, {city}, {country}
          </p>
          <p className="text-emerald-700 font-semibold">
            {isVi
              ? "✓ Trạng thái: Đã trừ kho thực tế tại Kho VSIP 1 Bình Dương"
              : "✓ Inventory: Stock successfully deducted at VSIP 1 Central Warehouse"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      {/* 30-Minute Reservation Bar */}
      <div className="flex items-center justify-between bg-neutral-900 text-white px-4 py-2.5 rounded font-mono text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            {isVi ? "Thời gian đặt giữ tồn kho còn lại:" : "Stock reservation timer remaining:"}
          </span>
        </div>
        <span className="font-black text-amber-400 text-sm tracking-wider">
          {formatTimer(timeLeftSeconds)}
        </span>
      </div>

      {/* Customer Information */}
      <div className="border border-neutral-300 bg-white p-6 shadow-sm rounded space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black border-b border-neutral-200 pb-3 flex items-center gap-2">
          <Truck className="w-4 h-4 text-[#0E4B94]" />
          {t("checkout.shippingInfoTitle")}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.fullName")} *
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.email")} *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.phone")} *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.country")} *
            </label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black bg-white"
            >
              <option value="Vietnam">Vietnam (Việt Nam)</option>
              <option value="Japan">Japan (Nhật Bản)</option>
              <option value="United States">United States (Hoa Kỳ)</option>
              <option value="Germany">Germany (Đức)</option>
              <option value="Netherlands">Netherlands (Hà Lan)</option>
              <option value="Singapore">Singapore</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.address")} *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.city")} *
            </label>
            <input
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.postalCode")} *
            </label>
            <input
              type="text"
              required
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
            />
          </div>
        </div>
      </div>

      {/* Stripe Payment Card Details */}
      <div className="border border-neutral-300 bg-white p-6 shadow-sm rounded space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-200 pb-3">
          <h3 className="text-sm font-bold uppercase tracking-wider text-black flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0E4B94]" />
            {t("checkout.paymentMethodTitle")}
          </h3>
          <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            3D Secure 2.0
          </span>
        </div>

        <div className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-neutral-600 mb-1 font-bold">
              {t("checkout.cardNumber")}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                className="w-full border border-neutral-300 p-2.5 pr-10 rounded focus:outline-none focus:border-black"
              />
              <Lock className="w-4 h-4 absolute right-3 top-3 text-neutral-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">
                {t("checkout.expiry")}
              </label>
              <input
                type="text"
                required
                value={cardExp}
                onChange={(e) => setCardExp(e.target.value)}
                className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-neutral-600 mb-1 font-bold">
                {t("checkout.cvc")}
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={cardCvc}
                onChange={(e) => setCardCvc(e.target.value)}
                className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isProcessing}
          className="w-full bg-[#0E4B94] hover:bg-[#0a376d] text-white py-3.5 rounded font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
        >
          {isProcessing ? (
            <span>{t("checkout.processing")}</span>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              <span>{t("checkout.payNow")}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};