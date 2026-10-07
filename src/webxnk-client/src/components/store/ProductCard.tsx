"use client";

import React from "react";
import { Product } from "@/types";
import { Box, Layers, ShoppingBag, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onSelectForRfq?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onSelectForRfq,
}) => {
  const { formatPrice } = useCurrency();
  const { t, language } = useLanguage();

  const currentTranslation =
    product.translations.find((tr) => tr.languageCode === language) ||
    product.translations.find((tr) => tr.languageCode === "vi") ||
    product.translations[0];

  const name = currentTranslation?.name || product.baseSku;
  const desc = currentTranslation?.shortDescription || "";

  // Best tier price for B2B badge
  const bestTier = product.priceTiers?.length
    ? product.priceTiers.reduce((min, p) => (p.unitPriceUsd < min.unitPriceUsd ? p : min), product.priceTiers[0])
    : null;

  return (
    <div className="group relative flex flex-col justify-between border border-black/15 bg-white p-5 transition-all duration-200 hover:border-black hover:shadow-sm">
      {/* Top Header: HS Code and Origin */}
      <div>
        <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-3">
          <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-mono font-bold tracking-tight bg-black text-white">
            HS {product.hsCode}
          </span>
          <span className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
            {t("home.origin")} {product.countryOfOrigin}
          </span>
        </div>

        {/* SKU & Title */}
        <div className="mt-3">
          <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
            SKU: {product.baseSku}
          </span>
          <h3 className="mt-1 text-base font-bold text-black leading-snug group-hover:underline">
            <Link href={`/product/${product.id}`}>{name}</Link>
          </h3>
          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{desc}</p>
        </div>

        {/* Packaging Specs (CBM & Packing) */}
        {product.exportPackaging && (
          <div className="mt-4 grid grid-cols-2 gap-2 border border-black/10 bg-neutral-50 p-2 text-[11px]">
            <div className="flex items-center gap-1 text-neutral-700">
              <Box className="w-3.5 h-3.5 text-black" />
              <span>{product.exportPackaging.pcsPerCarton} {t("home.pcsPerCarton")}</span>
            </div>
            <div className="flex items-center gap-1 text-neutral-700">
              <Layers className="w-3.5 h-3.5 text-black" />
              <span>GW: {product.exportPackaging.grossWeightKg} kg</span>
            </div>
          </div>
        )}

        {/* Price Section: B2C vs B2B */}
        <div className="mt-5 border-t border-black/10 pt-3">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-neutral-500 uppercase font-medium">{t("home.retailPrice")}</span>
            <span className="text-lg font-extrabold text-[#0E4B94] font-mono">
              {formatPrice(product.defaultRetailPriceUsd)}
            </span>
          </div>

          {bestTier && (
            <div className="mt-1 flex items-baseline justify-between text-xs bg-neutral-100 px-2 py-1 border border-neutral-300">
              <span className="font-semibold text-black">
                {t("home.wholesalePrice", { min: bestTier.minQuantity })}
              </span>
              <span className="font-mono font-bold text-black">
                {formatPrice(bestTier.unitPriceUsd)} (-{bestTier.discountPercentage}%)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-5 grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={() => onAddToCart && onAddToCart(product)}
          className="flex items-center justify-center gap-1.5 border border-black bg-white py-2 text-xs font-bold text-black hover:bg-black hover:text-white transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{t("home.buyRetail")}</span>
        </button>

        <button
          onClick={() => onSelectForRfq && onSelectForRfq(product)}
          className="flex items-center justify-center gap-1.5 bg-black py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
        >
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{t("home.quoteB2b")}</span>
        </button>
      </div>
    </div>
  );
};