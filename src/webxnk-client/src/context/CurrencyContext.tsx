"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type Currency = "USD" | "EUR" | "JPY" | "VND";

export interface CurrencyConfig {
  code: Currency;
  symbol: string;
  rateFromUsd: number;
  decimals: number;
  label: string;
}

export const CURRENCY_CONFIGS: Record<Currency, CurrencyConfig> = {
  USD: { code: "USD", symbol: "$", rateFromUsd: 1.0, decimals: 2, label: "USD ($)" },
  EUR: { code: "EUR", symbol: "€", rateFromUsd: 0.92, decimals: 2, label: "EUR (€)" },
  JPY: { code: "JPY", symbol: "¥", rateFromUsd: 154.5, decimals: 0, label: "JPY (¥)" },
  VND: { code: "VND", symbol: "₫", rateFromUsd: 25400, decimals: 0, label: "VND (₫)" },
};

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  convertPrice: (usdAmount: number) => number;
  formatPrice: (usdAmount: number) => string;
}

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  convertPrice: (amt) => amt,
  formatPrice: (amt) => `$${amt.toFixed(2)}`,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("USD");

  useEffect(() => {
    const saved = localStorage.getItem("webxnk_currency") as Currency | null;
    if (saved && CURRENCY_CONFIGS[saved]) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("webxnk_currency", c);
  };

  const convertPrice = (usdAmount: number): number => {
    const config = CURRENCY_CONFIGS[currency];
    return usdAmount * config.rateFromUsd;
  };

  const formatPrice = (usdAmount: number): string => {
    const config = CURRENCY_CONFIGS[currency];
    const converted = usdAmount * config.rateFromUsd;

    if (currency === "VND") {
      return `${Math.round(converted).toLocaleString("vi-VN")} ₫`;
    }
    if (currency === "JPY") {
      return `¥${Math.round(converted).toLocaleString("ja-JP")}`;
    }
    if (currency === "EUR") {
      return `€${converted.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `$${converted.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convertPrice, formatPrice }}>
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);