"use client";

import React from "react";
import { Product } from "@/types";
import { Box, Layers, ShoppingBag, ArrowUpRight } from "lucide-react";
import Link from "next/link";

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
  const nameVi = product.translations.find((t) => t.languageCode === "vi")?.name || product.baseSku;
  const descVi = product.translations.find((t) => t.languageCode === "vi")?.shortDescription || "";

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
            Xuất xứ: {product.countryOfOrigin}
          </span>
        </div>

        {/* SKU & Title */}
        <div className="mt-3">
          <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
            SKU: {product.baseSku}
          </span>
          <h3 className="mt-1 text-base font-bold text-black leading-snug group-hover:underline">
            <Link href={`/product/${product.id}`}>{nameVi}</Link>
          </h3>
          <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{descVi}</p>
        </div>

        {/* Packaging Specs (CBM & Packing) */}
        {product.exportPackaging && (
          <div className="mt-4 grid grid-cols-2 gap-2 border border-black/10 bg-neutral-50 p-2 text-[11px]">
            <div className="flex items-center gap-1 text-neutral-700">
              <Box className="w-3.5 h-3.5 text-black" />
              <span>{product.exportPackaging.pcsPerCarton} cái/thùng</span>
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
            <span className="text-xs text-neutral-500 uppercase font-medium">Bán lẻ (B2C):</span>
            <span className="text-lg font-extrabold text-black font-mono">
              ${product.defaultRetailPriceUsd.toFixed(2)}
            </span>
          </div>

          {bestTier && (
            <div className="mt-1 flex items-baseline justify-between text-xs bg-neutral-100 px-2 py-1 border border-neutral-300">
              <span className="font-semibold text-black">B2B Sỉ (từ {bestTier.minQuantity} sp):</span>
              <span className="font-mono font-bold text-black">
                ${bestTier.unitPriceUsd.toFixed(2)} (-{bestTier.discountPercentage}%)
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
          <span>Mua lẻ</span>
        </button>

        <button
          onClick={() => onSelectForRfq && onSelectForRfq(product)}
          className="flex items-center justify-center gap-1.5 bg-black py-2 text-xs font-bold text-white hover:bg-neutral-800 transition-colors"
        >
          <span>Báo giá B2B</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
