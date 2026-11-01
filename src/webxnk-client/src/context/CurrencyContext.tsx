"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { pricingApi } from "@/services/api";

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
  rates: Record<Currency, number>;
  isLiveRate: boolean;
  lastSyncedAt: string | null;
}

const DEFAULT_RATES: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  JPY: 154.5,
  VND: 25400,
};

const CurrencyContext = createContext<CurrencyContextType>({
  currency: "USD",
  setCurrency: () => {},
  convertPrice: (amt) => amt,
  formatPrice: (amt) => `$${amt.toFixed(2)}`,
  rates: DEFAULT_RATES,
  isLiveRate: false,
  lastSyncedAt: null,
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<Currency>("USD");
  const [rates, setRates] = useState<Record<Currency, number>>(DEFAULT_RATES);
  const [isLiveRate, setIsLiveRate] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("webxnk_currency") as Currency | null;
    if (saved && CURRENCY_CONFIGS[saved]) {
      setCurrencyState(saved);
    }

    // Fetch live exchange rates from Backend SQL Server (ExchangeRateUpdateWorker)
    pricingApi
      .getExchangeRates()
      .then((list) => {
        if (list && list.length > 0) {
          const updatedRates: Record<Currency, number> = { ...DEFAULT_RATES };
          let latestTimestamp: string | null = null;

          list.forEach((item) => {
            const code = item.toCurrency?.toUpperCase() as Currency;
            if (code && code in updatedRates && item.rate > 0) {
              updatedRates[code] = item.rate;
              CURRENCY_CONFIGS[code].rateFromUsd = item.rate;
              if (item.fetchedAt) {
                latestTimestamp = item.fetchedAt;
              }
            }
          });

          setRates(updatedRates);
          setIsLiveRate(true);
          setLastSyncedAt(latestTimestamp);
        }
      })
      .catch(() => {
        // Fallback to default market rates if backend is offline
      });
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem("webxnk_currency", c);
  };

  const convertPrice = (usdAmount: number): number => {
    const rate = rates[currency] ?? CURRENCY_CONFIGS[currency].rateFromUsd;
    return usdAmount * rate;
  };

  const formatPrice = (usdAmount: number): string => {
    const rate = rates[currency] ?? CURRENCY_CONFIGS[currency].rateFromUsd;
    const converted = usdAmount * rate;

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
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        convertPrice,
        formatPrice,
        rates,
        isLiveRate,
        lastSyncedAt,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => useContext(CurrencyContext);