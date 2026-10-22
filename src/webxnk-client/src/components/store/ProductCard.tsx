"use client";

import React, { useState } from "react";
import { Product } from "@/types";
import {
  Box,
  Layers,
  ShoppingBag,
  ArrowUpRight,
  Camera,
  Ship,
} from "lucide-react";
import Link from "next/link";
import { useCurrency } from "@/context/CurrencyContext";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  useProductImage,
  getDefaultProductImageUrl,
} from "@/utils/productImages";
import { ProductImageEditModal } from "@/components/admin/ProductImageEditModal";
import { getTranslation } from "@/lib/utils";

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
  const { user } = useAuth();
  const { imageUrl } = useProductImage(product);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const isVi = language === "vi";
  const isAdmin = user?.role === "SUPER_ADMIN" && !user.isDemo;

  const currentTranslation = getTranslation(product?.translations, language);

  const name = currentTranslation?.name || product.baseSku;
  const desc = currentTranslation?.shortDescription || "";

  // Best tier price for B2B badge
  const bestTier = product.priceTiers?.length
    ? product.priceTiers.reduce(
        (min, p) => (p.unitPriceUsd < min.unitPriceUsd ? p : min),
        product.priceTiers[0],
      )
    : null;

  return (
    <>
      <div className="group relative flex flex-col justify-between border border-black/15 bg-white overflow-hidden transition-all duration-200 hover:border-black hover:shadow-md rounded-sm">
        <div>
          {/* Top Product Illustration Container (E-Commerce Style matching Image 2) */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 border-b border-black/10">
            <Link
              href={`/product/${product.id}`}
              className="block w-full h-full"
            >
              <img
                src={imageUrl}
                alt={name}
                loading="lazy"
                onError={(e) => {
                  const fallback = getDefaultProductImageUrl(product);
                  if (e.currentTarget.src !== fallback) {
                    e.currentTarget.src = fallback;
                  }
                }}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Top Left: HS Code Badge */}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold tracking-tight bg-black/85 text-white backdrop-blur-sm rounded-sm shadow-sm">
                HS {product.hsCode}
              </span>
            </div>

            {/* Top Right: Country of Origin Badge */}
            <div className="absolute top-2.5 right-2.5 pointer-events-none">
              <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider bg-white/95 text-neutral-900 border border-black/15 shadow-sm rounded-sm">
                {t("home.origin")} {product.countryOfOrigin}
              </span>
            </div>

            {/* Bottom Left: E-Commerce Promo Badges (like "Free shipping" & Discount in Image 2) */}
            <div className="absolute bottom-2.5 left-2.5 flex flex-wrap items-center gap-1.5 pointer-events-none">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold bg-[#00796B] text-white rounded-sm shadow-sm">
                <Ship className="w-3 h-3" />
                <span>{isVi ? "Xuất khẩu FOB/CIF" : "FOB/CIF Ready"}</span>
              </span>
              {bestTier && (
                <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-mono font-extrabold bg-[#C9252C] text-white rounded-sm shadow-sm">
                  -{bestTier.discountPercentage}% B2B
                </span>
              )}
            </div>

            {/* Admin Quick Image Change Button (Only visible to Admin accounts) */}
            {isAdmin && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setEditModalOpen(true);
                }}
                title={
                  isVi
                    ? "Thay đổi ảnh sản phẩm từ thiết bị (Laptop / PC)"
                    : "Change product image from device (Laptop / PC)"
                }
                className="absolute bottom-2.5 right-2.5 z-10 inline-flex items-center gap-1.5 bg-[#0E4B94] hover:bg-black text-white text-[11px] font-bold px-2.5 py-1 rounded shadow-md border border-white/80 transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{isVi ? "Đổi ảnh" : "Change Image"}</span>
              </button>
            )}
          </div>

          {/* Card Content Body */}
          <div className="p-4">
            {/* SKU & Title */}
            <div>
              <span className="text-[10px] font-mono tracking-wider text-neutral-500 uppercase">
                SKU: {product.baseSku}
              </span>
              <h3 className="mt-0.5 text-base font-bold text-black leading-snug line-clamp-2 group-hover:text-[#0E4B94] transition-colors">
                <Link href={`/product/${product.id}`}>{name}</Link>
              </h3>
              <p className="mt-1 text-xs text-neutral-600 line-clamp-2">
                {desc}
              </p>
            </div>

            {/* Packaging Specs (CBM & Packing) */}
            {product.exportPackaging && (
              <div className="mt-3.5 grid grid-cols-2 gap-2 border border-black/10 bg-neutral-50 p-2 text-[11px]">
                <div className="flex items-center gap-1 text-neutral-700">
                  <Box className="w-3.5 h-3.5 text-[#0E4B94] shrink-0" />
                  <span className="truncate">
                    {product.exportPackaging.pcsPerCarton}{" "}
                    {t("home.pcsPerCarton")}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-neutral-700">
                  <Layers className="w-3.5 h-3.5 text-[#0E4B94] shrink-0" />
                  <span className="truncate">
                    GW: {product.exportPackaging.grossWeightKg} kg
                  </span>
                </div>
              </div>
            )}

            {/* Price Section: B2C vs B2B */}
            <div className="mt-4 border-t border-black/10 pt-3">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-neutral-500 uppercase font-medium">
                  {t("home.retailPrice")}
                </span>
                <span className="text-lg font-extrabold text-[#C9252C] font-mono">
                  {formatPrice(product.defaultRetailPriceUsd)}
                </span>
              </div>

              {bestTier && (
                <div className="mt-1.5 flex items-baseline justify-between text-xs bg-blue-50/70 px-2.5 py-1 border border-[#0E4B94]/25 rounded-sm">
                  <span className="font-semibold text-[#0E4B94]">
                    {t("home.wholesalePrice", { min: bestTier.minQuantity })}
                  </span>
                  <span className="font-mono font-bold text-[#0E4B94]">
                    {formatPrice(bestTier.unitPriceUsd)} (-
                    {bestTier.discountPercentage}%)
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onAddToCart && onAddToCart(product)}
            className="flex items-center justify-center gap-1.5 border border-black bg-white py-2 text-xs font-bold text-black hover:bg-black hover:text-white transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>{t("home.buyRetail")}</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectForRfq && onSelectForRfq(product)}
            className="flex items-center justify-center gap-1.5 bg-[#0E4B94] py-2 text-xs font-bold text-white hover:bg-[#09356a] transition-colors"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{t("home.quoteB2b")}</span>
          </button>
        </div>
      </div>

      {/* Admin Modal to Pick Image from Device (Laptop / PC) */}
      {isAdmin && editModalOpen && (
        <ProductImageEditModal
          product={product}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
        />
      )}
    </>
  );
};
