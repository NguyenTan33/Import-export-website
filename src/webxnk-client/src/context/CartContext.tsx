"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Link from "next/link";
import { Product, CartItem } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getProductImageUrl, getDefaultProductImageUrl } from "@/utils/productImages";
import { getCartStorageKey, readCart, writeCart } from "@/utils/cartStorage";
import { isPositiveInteger } from "@/utils/validation";
import { useAuth } from "@/context/AuthContext";
import { ShoppingBag, X, Trash2, Plus, Minus, ArrowRight, Box } from "lucide-react";
import { getTranslation } from "@/lib/utils";

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addItem: (product: Product, quantity?: number, openDrawer?: boolean) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItemsCount: number;
  subtotalUsd: number;
  totalCartons: number;
  totalCbm: number;
  totalGrossWeightKg: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  isCartOpen: false,
  setIsCartOpen: () => {},
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItemsCount: 0,
  subtotalUsd: 0,
  totalCartons: 0,
  totalCbm: 0,
  totalGrossWeightKg: 0,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loadedCartKey, setLoadedCartKey] = useState<string | null>(null);

  const { user } = useAuth();
  const cartStorageKey = getCartStorageKey(user?.id || null);
  const visibleItems = loadedCartKey === cartStorageKey ? items : [];
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  useEffect(() => {
    setLoadedCartKey(null);
    setItems(readCart(cartStorageKey));
    setLoadedCartKey(cartStorageKey);
  }, [cartStorageKey]);

  useEffect(() => {
    if (loadedCartKey !== cartStorageKey) return;
    writeCart(cartStorageKey, items);
  }, [items, loadedCartKey, cartStorageKey]);

  const addItem = (product: Product, quantity = 1, openDrawer = true) => {
    if (!isPositiveInteger(String(quantity))) return;
    const qtyToAdd = quantity;
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, product, quantity: item.quantity + qtyToAdd }
            : item
        );
      }
      return [...prev, { product, quantity: qtyToAdd }];
    });
    if (openDrawer) {
      setIsCartOpen(true);
    }
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (!isPositiveInteger(String(quantity))) return;
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItemsCount = visibleItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalUsd = visibleItems.reduce(
    (sum, item) => sum + (item.unitPriceUsd ?? item.product.defaultRetailPriceUsd) * item.quantity,
    0
  );

  const logisticsTotals = visibleItems.reduce(
    (acc, item) => {
      const pkg = item.product.exportPackaging;
      const pcsPerCarton = pkg?.pcsPerCarton || 10;
      const cartons = Math.ceil(item.quantity / pcsPerCarton);
      const cartonCbm = pkg
        ? (pkg.cartonLengthCm * pkg.cartonWidthCm * pkg.cartonHeightCm) / 1000000
        : 0.04;
      const gwPerCarton = pkg?.grossWeightKg || 10;

      acc.cartons += cartons;
      acc.cbm += cartons * cartonCbm;
      acc.gw += cartons * gwPerCarton;
      return acc;
    },
    { cartons: 0, cbm: 0, gw: 0 }
  );

  return (
    <CartContext.Provider
      value={{
        items: visibleItems,
        isCartOpen,
        setIsCartOpen,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItemsCount,
        subtotalUsd,
        totalCartons: logisticsTotals.cartons,
        totalCbm: Number(logisticsTotals.cbm.toFixed(3)),
        totalGrossWeightKg: Number(logisticsTotals.gw.toFixed(1)),
      }}
    >
      {children}

      {/* Global Slide-Over B2C Cart Drawer */}
      {isCartOpen && (
        <div
          className="fixed inset-0 z-[60] flex justify-end bg-black/50 backdrop-blur-sm"
          onClick={() => setIsCartOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={isVi ? "Giỏ hàng" : "Shopping cart"}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md bg-white border-l border-black p-6 flex flex-col justify-between shadow-2xl h-full"
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-black pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-[#0E4B94]" />
                  <div>
                    <h3 className="font-black uppercase tracking-wide text-black text-sm">
                      {isVi
                        ? `Giỏ hàng Xuất khẩu B2C (${totalItemsCount} sp)`
                        : `B2C Export Cart (${totalItemsCount} units)`}
                    </h3>
                    <p className="text-[10px] font-mono text-neutral-500">
                      {isVi
                        ? `${visibleItems.length} mặt hàng • Tự động tính CBM & giữ kho 30 phút`
                        : `${visibleItems.length} SKUs • Auto CBM & 30-min stock reservation`}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="p-1.5 hover:bg-neutral-100 rounded border border-transparent hover:border-neutral-300"
                  aria-label="Close cart"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="mt-4 divide-y divide-black/10 flex-1 overflow-y-auto pr-1">
                {visibleItems.length === 0 ? (
                  <div className="py-16 text-center space-y-3">
                    <ShoppingBag className="w-10 h-10 text-neutral-300 mx-auto" />
                    <p className="text-xs font-mono text-neutral-500">
                      {isVi
                        ? "Giỏ hàng B2C của bạn đang trống."
                        : "Your B2C shopping cart is currently empty."}
                    </p>
                  </div>
                ) : (
                  visibleItems.map((item, index) => {
                    const trans = getTranslation(item?.product?.translations, language);

                    return (
                      <div key={item.product.id ?? item.product.baseSku ?? `cart-item-${index}`} className="py-3.5 flex justify-between items-start gap-3 text-xs">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <img
                            src={getProductImageUrl(item.product)}
                            alt={trans?.name || item.product.baseSku}
                            onError={(e) => {
                              const fallback = getDefaultProductImageUrl(item.product);
                              if (e.currentTarget.src !== fallback) {
                                e.currentTarget.src = fallback;
                              }
                            }}
                            className="w-14 h-14 rounded object-cover border border-neutral-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1 space-y-1">
                            <Link
                              href={`/product/${item.product.id}`}
                              onClick={() => setIsCartOpen(false)}
                              className="font-bold text-black hover:text-[#0E4B94] line-clamp-2 leading-snug"
                            >
                              {trans?.name || item.product.baseSku}
                            </Link>
                            <p className="text-neutral-500 font-mono text-[10px]">
                              SKU: {item.product.baseSku} | HS: {item.product.hsCode}
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                              <div className="inline-flex items-center border border-neutral-300 rounded bg-neutral-50">
                                <button
                                  type="button"
                                  onClick={() => item.quantity > 1
                                    ? updateQuantity(item.product.id, item.quantity - 1)
                                    : removeItem(item.product.id)}
                                  className="p-1 hover:bg-neutral-200 text-neutral-700"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="px-2.5 font-mono font-bold text-[11px]">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                                  className="p-1 hover:bg-neutral-200 text-neutral-700"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeItem(item.product.id)}
                                className="p-1 text-neutral-400 hover:text-red-600 transition-colors"
                                title={isVi ? "Xóa khỏi giỏ" : "Remove item"}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-mono shrink-0">
                          <div className="font-bold text-black">
                            {formatPrice((item.unitPriceUsd ?? item.product.defaultRetailPriceUsd) * item.quantity)}
                          </div>
                          <div className="text-[10px] text-neutral-400">
                            {formatPrice(item.unitPriceUsd ?? item.product.defaultRetailPriceUsd)} / {isVi ? "sp" : "unit"}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Cart Footer & Checkout CTA */}
            <div className="border-t border-black pt-4 space-y-3 shrink-0 bg-white">
              {visibleItems.length > 0 && (
                <div className="bg-neutral-50 border border-neutral-200 p-2.5 rounded text-[11px] font-mono flex items-center justify-between text-neutral-600">
                  <span className="flex items-center gap-1.5 font-semibold text-neutral-800">
                    <Box className="w-3.5 h-3.5 text-[#0E4B94]" />
                    {isVi ? "Ước tính đóng kiện:" : "Est. Packing:"}
                  </span>
                  <span>
                    <strong>{logisticsTotals.cartons}</strong> {isVi ? "thùng" : "ctns"} •{" "}
                    <strong className="text-[#0E4B94]">{logisticsTotals.cbm.toFixed(2)} m³</strong> •{" "}
                    <strong>{logisticsTotals.gw.toFixed(1)} kg</strong>
                  </span>
                </div>
              )}

              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs uppercase text-neutral-600 font-bold">
                  {isVi ? "Tạm tính (Subtotal):" : "Subtotal:"}
                </span>
                <span className="text-xl font-black text-[#0E4B94]">
                  {formatPrice(subtotalUsd)}
                </span>
              </div>

              <div className="flex gap-2">
                {visibleItems.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="px-3 py-3 border border-neutral-300 text-neutral-600 hover:text-red-600 hover:border-red-300 text-xs font-mono uppercase rounded transition-colors"
                  >
                    {isVi ? "Xóa hết" : "Clear"}
                  </button>
                )}
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className={`flex-1 flex items-center justify-center gap-2 bg-black py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0E4B94] transition-colors rounded ${
                    visibleItems.length === 0 ? "pointer-events-none opacity-40" : ""
                  }`}
                >
                  <span>
                    {isVi
                      ? "Thanh toán Quốc tế (Stripe 3DS)"
                      : "International Checkout (Stripe 3DS)"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
