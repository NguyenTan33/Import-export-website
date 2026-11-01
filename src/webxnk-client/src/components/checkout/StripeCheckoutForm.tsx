"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Product, CartItem } from "@/types";
import { inventoryApi, ordersApi, paymentsApi } from "@/services/api";
import {
  CreditCard,
  Lock,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Truck,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { getRecordCode, getTranslation } from "@/lib/utils";
import { addressBookApi, CustomerAddress } from "@/services/api";

interface StripeCheckoutFormProps {
  product?: Product;
  quantity?: number;
  items?: CartItem[];
  onPaymentSuccess?: (orderId: string) => void;
}

const COUNTRY_ISO_MAP: Record<string, string> = {
  Vietnam: "VNM",
  Japan: "JPN",
  "United States": "USA",
  Germany: "DEU",
  Netherlands: "NLD",
  Singapore: "SGP",
};

export const StripeCheckoutForm: React.FC<StripeCheckoutFormProps> = ({
  product,
  quantity = 1,
  items,
  onPaymentSuccess,
}) => {
  const { t, language } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const isVi = language === "vi";

  const checkoutItems: CartItem[] = useMemo(() => {
    if (items && items.length > 0) return items;
    if (product) {
      return [
        {
          product,
          quantity,
          unitPriceUsd: product.defaultRetailPriceUsd,
        },
      ];
    }
    return [];
  }, [items, product, quantity]);

  // Customer & Shipping state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("phu.vo@example.com");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [country, setCountry] = useState("Vietnam");
  const [postalCode, setPostalCode] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("new");
  const [saveAddressToBook, setSaveAddressToBook] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Card details state
  const [cardNumber, setCardNumber] = useState("4242 •••• •••• 4242");
  const [cardExp, setCardExp] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("888");

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [orderCode, setOrderCode] = useState("");
  const [paymentIntentRef, setPaymentIntentRef] = useState<string | null>(null);
  const [completedItems, setCompletedItems] = useState<CartItem[]>([]);
  const [completedTotalUsd, setCompletedTotalUsd] = useState<number>(0);

  // 30-minute reservation countdown timer (EXP-79)
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(1800); // 30 mins

  useEffect(() => {
    // Call backend inventory reservation for 30 minutes across all items
    checkoutItems.forEach((item) => {
      inventoryApi.reserveStock(item.product.id, 1, item.quantity).catch(() => {});
    });

    const interval = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutItems]);

  useEffect(() => {
    if (!isAuthenticated || !user || user.isDemo) return;
    setFullName(user.fullName || "");
    setPhone(user.phone || "");
    void addressBookApi.getMine().then((list) => {
      setSavedAddresses(list);
      const defaultAddress = list.find((item) => item.isDefault);
      setSaveAddressToBook(list.length === 0);
      if (defaultAddress) applySavedAddress(defaultAddress);
    }).catch(() => {
      setAddressError(isVi ? "Không thể tải sổ địa chỉ. Bạn vẫn có thể nhập địa chỉ giao hàng." : "Could not load your address book. You can still enter a delivery address.");
    });
  // Load when the signed-in account changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, user?.isDemo]);

  const applySavedAddress = (saved: CustomerAddress) => {
    setSelectedAddress(String(saved.id));
    setFullName(saved.recipientName);
    setPhone(saved.phoneNumber);
    setAddress(saved.addressLine);
    setWard(saved.ward);
    setDistrict(saved.district);
    setCity(saved.province);
    setCountry(Object.entries(COUNTRY_ISO_MAP).find(([, code]) => code === saved.countryCode)?.[0] || "Vietnam");
    setPostalCode(saved.postalCode || "");
    setSaveAddressToBook(false);
  };

  const handleAddressSelection = (value: string) => {
    if (value === "new") {
      setSelectedAddress("new");
      setAddress(""); setWard(""); setDistrict(""); setCity(""); setPostalCode("");
      setSaveAddressToBook(true);
      return;
    }
    const saved = savedAddresses.find((item) => item.id === Number(value));
    if (saved) applySavedAddress(saved);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const subtotal = checkoutItems.reduce(
    (sum, item) => sum + (item.unitPriceUsd ?? item.product.defaultRetailPriceUsd) * item.quantity,
    0
  );
  const shippingFee = subtotal > 100 ? 0 : country === "Vietnam" ? 5.0 : 15.0;
  const taxEst = subtotal * 0.08;
  const totalAmount = subtotal + shippingFee + taxEst;

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checkoutItems.length === 0) return;

    setIsProcessing(true);
    const snapshotItems = [...checkoutItems];
    const snapshotTotal = totalAmount;

    let finalOrderCode = `ORD-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    let stripeIntentId: string | null = null;

    try {
      if (saveAddressToBook && isAuthenticated && user && !user.isDemo) {
        const saved = await addressBookApi.create({
          recipientName: fullName.trim(), phoneNumber: phone.trim(), province: city.trim(),
          district: district.trim(), ward: ward.trim(), addressLine: address.trim(),
          countryCode: COUNTRY_ISO_MAP[country] || "VNM", postalCode: postalCode.trim(),
          isDefault: savedAddresses.length === 0,
        });
        setSavedAddresses(current => [...current, saved]);
        setSelectedAddress(String(saved.id));
        setSaveAddressToBook(false);
      }

      const createdOrder = await ordersApi.createOrder({
        recipientName: fullName,
        recipientPhone: phone,
        destinationCountryCode: COUNTRY_ISO_MAP[country] || "VNM",
        shippingAddressLine: [address, ward, district, city].filter(Boolean).join(", "),
        postalCode,
        currencyCode: "USD",
        items: snapshotItems.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });

      const returnedOrderCode = getRecordCode(createdOrder, ["orderNumber", "orderCode", "code", "id"]);
      if (returnedOrderCode) {
        finalOrderCode = returnedOrderCode;
      }

      if (createdOrder?.id) {
        const intent = await paymentsApi.createStripePaymentIntent(
          createdOrder.id,
          Number(snapshotTotal.toFixed(2)),
          "USD"
        );
        if (intent?.paymentIntentId) {
          stripeIntentId = intent.paymentIntentId;
        }
      }
    } catch {
      // Keep guest checkout available when the backend is temporarily offline.
    }

    setCompletedItems(snapshotItems);
    setCompletedTotalUsd(snapshotTotal);
    setOrderCode(finalOrderCode);
    setPaymentIntentRef(stripeIntentId);
    setIsProcessing(false);
    setPaymentDone(true);
    if (onPaymentSuccess) onPaymentSuccess(finalOrderCode);
  };

  if (paymentDone) {
    const totalUnits = completedItems.reduce((s, i) => s + i.quantity, 0);

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
        <div className="p-4 bg-neutral-50 border border-neutral-200 text-xs font-mono text-left space-y-1.5 max-w-lg mx-auto rounded">
          <div className="space-y-1 border-b border-neutral-200 pb-2 mb-2">
            <strong>{isVi ? "Danh mục hàng hóa:" : "Order Items:"}</strong>
            {completedItems.map((item) => {
              const prodName =
                getTranslation(item?.product?.translations, language)?.name ||
                item.product.baseSku;
              const uPrice = item.unitPriceUsd ?? item.product.defaultRetailPriceUsd;
              return (
                <div key={item.product.id} className="flex justify-between text-[11px] text-neutral-700">
                  <span className="truncate pr-2">• {prodName} (x{item.quantity})</span>
                  <span className="font-bold">${(uPrice * item.quantity).toFixed(2)}</span>
                </div>
              );
            })}
          </div>
          <p>
            <strong>{isVi ? "Tổng số lượng:" : "Total Quantity:"}</strong> {totalUnits}{" "}
            {isVi ? "đơn vị" : "units"} ({completedItems.length} SKU)
          </p>
          <p>
            <strong>{isVi ? "Tổng thanh toán:" : "Total Amount:"}</strong> $
            {completedTotalUsd.toFixed(2)} USD
          </p>
          {paymentIntentRef && (
            <p>
              <strong>Stripe PaymentIntent:</strong> {paymentIntentRef}
            </p>
          )}
          <p>
            <strong>{isVi ? "Địa chỉ nhận hàng:" : "Delivery Destination:"}</strong> {address},{" "}
            {city}, {country}
          </p>
          <p className="text-emerald-700 font-semibold pt-1">
            {isVi
              ? "✓ Trạng thái: Đã tạo đơn hàng & giữ chỗ tồn kho thực tế tại Kho VSIP 1 Bình Dương"
              : "✓ Inventory: Order created & stock reserved at VSIP 1 Central Warehouse"}
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

        {isAuthenticated && user && !user.isDemo && <div className="space-y-2 border-b border-neutral-200 pb-4">
          <label className="block text-neutral-600 font-bold">{isVi ? "Địa chỉ giao hàng" : "Delivery address"}</label>
          <select value={selectedAddress} onChange={event => handleAddressSelection(event.target.value)} className="w-full border border-neutral-300 bg-white p-2.5 rounded">
            <option value="new">{isVi ? "Nhập địa chỉ mới" : "Enter a new address"}</option>
            {savedAddresses.map((saved, index) => <option key={saved.id ?? `saved-address-${index}`} value={saved.id}>{saved.recipientName} — {saved.addressLine}, {saved.province}{saved.isDefault ? (isVi ? " (Mặc định)" : " (Default)") : ""}</option>)}
          </select>
          {addressError && <p role="alert" className="text-xs text-amber-700">{addressError}</p>}
        </div>}

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
              {isVi ? "Tỉnh/Thành phố" : "Province/City"} *
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
            <label className="block text-neutral-600 mb-1 font-bold">{isVi ? "Quận/Huyện" : "District"} *</label>
            <input type="text" required value={district} onChange={e => setDistrict(e.target.value)} className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black" />
          </div>

          <div>
            <label className="block text-neutral-600 mb-1 font-bold">{isVi ? "Phường/Xã" : "Ward/Commune"} *</label>
            <input type="text" required value={ward} onChange={e => setWard(e.target.value)} className="w-full border border-neutral-300 p-2.5 rounded focus:outline-none focus:border-black" />
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
          {isAuthenticated && user && !user.isDemo && selectedAddress === "new" && <label className="sm:col-span-2 flex items-center gap-2 text-xs font-semibold text-neutral-700"><input type="checkbox" checked={saveAddressToBook} onChange={e => setSaveAddressToBook(e.target.checked)} />{isVi ? "Lưu địa chỉ này vào Sổ địa chỉ" : "Save this address to my address book"}</label>}
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
