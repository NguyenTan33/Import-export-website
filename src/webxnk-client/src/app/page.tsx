"use client";

import React, { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductFilter } from "@/components/store/ProductFilter";
import { catalogApi } from "@/services/api";
import { ArrowRight, Box } from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { getTranslation } from "@/lib/utils";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState<string>("");

  const { t, language } = useLanguage();
  const { addItem } = useCart();
  const isVi = language === "vi";

  useEffect(() => {
    Promise.all([catalogApi.getCategories(language), catalogApi.getProducts(undefined, undefined, language)])
      .then(([cats, prods]) => {
        setCategories(cats);
        setProducts(prods);
      })
      .catch(() => {});
  }, [language]);

  const filteredProducts = (Array.isArray(products) ? products : []).filter((p) => {
    const matchCat = selectedCatId ? p.categoryId === selectedCatId : true;
    const trans = getTranslation(p?.translations, language);
    const name = trans?.name || "";
    const matchKeyword = keyword
      ? name.toLowerCase().includes(keyword.toLowerCase()) ||
        p.baseSku.toLowerCase().includes(keyword.toLowerCase()) ||
        p.hsCode.toLowerCase().includes(keyword.toLowerCase())
      : true;
    return matchCat && matchKeyword;
  });

  const handleAddToCart = (product: Product) => {
    addItem(product, 1, true);
  };

  return (
    <div className="w-full">
      {/* High-End International Export Hero Section - QUANG TẤN HOÀNG */}
      <section className="relative border-b border-black/15 bg-gradient-to-b from-neutral-50 via-white to-white pt-12 pb-16 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content (8 cols) */}
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-2 border border-[#0E4B94]/25 bg-[#0E4B94]/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-[#0E4B94] rounded-full">
                <span className="flex h-2 w-2 rounded-full bg-[#C9252C] animate-pulse"></span>
                <span>{t("brand.companyName")}</span>
              </div>

              <h1 className="mt-5 text-3xl sm:text-5xl lg:text-[54px] font-black tracking-tight leading-[1.15]">
                <span className="text-[#0E4B94] block">
                  {t("home.heroTitle1")}
                </span>
                <span className="text-[#C9252C]">{t("home.heroTitle2")}</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-2xl">
                {t("home.heroDesc")}
              </p>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link
                  href="/portal"
                  className="flex items-center gap-2 bg-[#0E4B94] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0a376d] shadow-sm hover:shadow transition-all rounded"
                >
                  <span>{t("home.heroBtnB2b")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cbm-calculator"
                  className="flex items-center gap-2 border-2 border-[#C9252C] bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#C9252C] hover:bg-[#C9252C] hover:text-white transition-all rounded"
                >
                  <Box className="w-4 h-4" />
                  <span>{t("home.heroBtnCbm")}</span>
                </Link>
              </div>
            </div>

            {/* Right Brand Card (4 cols) */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="border border-black/15 bg-white p-6 shadow-sm max-w-sm w-full text-center space-y-4 relative rounded">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0E4B94] text-white text-[10px] font-mono font-bold px-3 py-0.5 uppercase tracking-wider rounded">
                  {isVi ? "THƯƠNG HIỆU QUỐC TẾ" : "GLOBAL EXPORT BRAND"}
                </div>
                <div className="p-4 bg-white flex justify-center">
                  <img
                    src="/logo.jpg"
                    alt="Logo Quang Tan Hoang"
                    width={140}
                    height={140}
                    style={{
                      width: "140px",
                      height: "140px",
                      objectFit: "contain",
                      margin: "0 auto",
                    }}
                    className="rounded"
                  />
                </div>
                <div className="border-t border-black/10 pt-3">
                  <h3 className="font-extrabold text-[#0E4B94] text-base uppercase">
                    QUANG TẤN <span className="text-[#C9252C]">HOÀNG</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono mt-1">
                    {isVi
                      ? "Cảng xuất phát: Tân Cảng Cát Lái (TP.HCM)"
                      : "Port of Loading: Tan Cang Cat Lai (HCMC)"}
                  </p>
                  <div className="mt-3 flex justify-center gap-2 text-[10px] font-mono text-neutral-600">
                    <span className="border border-neutral-300 px-2 py-0.5">
                      ISO 9001
                    </span>
                    <span className="border border-neutral-300 px-2 py-0.5">
                      CE / FDA
                    </span>
                    <span className="border border-neutral-300 px-2 py-0.5">
                      EUR.1
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Stripe with Brand Accents */}
        <div className="mt-14 border-t border-black/10 bg-neutral-100/70 py-3.5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase text-neutral-700">
            <div>
              <strong className="text-[#0E4B94]">
                {isVi ? "CẢNG BỐC:" : "POL:"}
              </strong>{" "}
              {isVi ? "CẢNG CÁT LÁI (TP.HCM)" : "CAT LAI PORT (VNM)"}
            </div>
            <div>
              <strong className="text-[#0E4B94]">INCOTERMS:</strong> FOB, CIF,
              CFR, DDP
            </div>
            <div>
              <strong className="text-[#C9252C]">
                {isVi ? "CHỨNG TỪ:" : "DOCUMENTS:"}
              </strong>{" "}
              ISO PI / CI / PKL (QUESTPDF)
            </div>
            <div>
              <strong className="text-black">
                {isVi ? "CSDL:" : "DATABASE:"}
              </strong>{" "}
              {isVi ? "21 BẢNG 3NF SQL SERVER" : "21 3NF SQL SERVER TABLES"}
            </div>
          </div>
        </div>
      </section>

      {/* Product Filter Bar */}
      <ProductFilter
        categories={categories}
        selectedCategoryId={selectedCatId}
        onSelectCategory={setSelectedCatId}
        searchKeyword={keyword}
        onSearchChange={setKeyword}
      />

      {/* Catalog Grid Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-baseline mb-6">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              {isVi
                ? `Danh mục mặt hàng xuất khẩu (${filteredProducts.length})`
                : `Export Cargo Catalog (${filteredProducts.length})`}
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              {isVi
                ? "Hiển thị song song giá bán lẻ B2C và bảng giá bậc thang chiết khấu số lượng lớn B2B"
                : "Dual pricing: direct retail (B2C) alongside tiered container wholesale volume pricing (B2B)"}
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="border border-black p-12 text-center text-neutral-500 font-mono text-sm">
            {isVi
              ? "Không tìm thấy sản phẩm phù hợp với từ khóa & ngành hàng đã chọn."
              : "No export products matched the selected filters and search query."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard
                key={product?.id ?? product?.baseSku ?? `product-${index}`}
                product={product}
                onAddToCart={handleAddToCart}
                onSelectForRfq={() => {
                  window.location.href = `/portal?productId=${product.id}&quantity=${product.priceTiers?.[0]?.minQuantity || 500}`;
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
