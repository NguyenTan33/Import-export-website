"use client";

import React, { useState, useEffect } from "react";
import { Product, Category } from "@/types";
import { ProductCard } from "@/components/store/ProductCard";
import { ProductFilter } from "@/components/store/ProductFilter";
import { catalogApi } from "@/services/api";
import { ArrowRight, Box, ShoppingBag, X } from "lucide-react";
import Link from "next/link";

// 6 Default Core Products matching DB seed
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: 1,
    categoryId: 1,
    baseSku: "SHOES-SNK-V1",
    hsCode: "6404.11.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 25.0,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Giày thể thao Sneaker xuất khẩu đế đúc",
        shortDescription: "Giày vải canvas đế cao su lưu hóa tiêu chuẩn xuất khẩu EU/Mỹ, đóng gói 12 đôi/thùng.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 60,
      cartonWidthCm: 40,
      cartonHeightCm: 35,
      netWeightKg: 9.6,
      grossWeightKg: 11.2,
      pcsPerCarton: 12,
    },
    priceTiers: [
      { minQuantity: 120, maxQuantity: 499, unitPriceUsd: 22.0, discountPercentage: 12 },
      { minQuantity: 500, maxQuantity: 1999, unitPriceUsd: 19.5, discountPercentage: 22 },
      { minQuantity: 2000, maxQuantity: null, unitPriceUsd: 17.0, discountPercentage: 32 },
    ],
  },
  {
    id: 2,
    categoryId: 2,
    baseSku: "CHAR-COCO-BBQ",
    hsCode: "4402.90.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 1.2,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Than gáo dừa nén lục giác không khói BBQ",
        shortDescription: "Than sinh thái không mùi, không tia lửa, thời gian cháy 4 giờ, xuất khẩu Trung Đông & Nhật.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 40,
      cartonWidthCm: 30,
      cartonHeightCm: 25,
      netWeightKg: 10.0,
      grossWeightKg: 10.6,
      pcsPerCarton: 10,
    },
    priceTiers: [
      { minQuantity: 500, maxQuantity: 1999, unitPriceUsd: 0.95, discountPercentage: 20 },
      { minQuantity: 2000, maxQuantity: null, unitPriceUsd: 0.85, discountPercentage: 29 },
    ],
  },
  {
    id: 3,
    categoryId: 3,
    baseSku: "BROOM-EUC-120",
    hsCode: "4417.00.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.65,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Cán chổi gỗ bạch đàn 120cm bọc màng PVC",
        shortDescription: "Tiện tròn mịn, sấy chống mốc mối mọt, bọc màng PVC vân gỗ kèm móc treo nhựa.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 122,
      cartonWidthCm: 25,
      cartonHeightCm: 25,
      netWeightKg: 22.0,
      grossWeightKg: 23.5,
      pcsPerCarton: 50,
    },
    priceTiers: [
      { minQuantity: 1000, maxQuantity: 4999, unitPriceUsd: 0.5, discountPercentage: 23 },
      { minQuantity: 5000, maxQuantity: null, unitPriceUsd: 0.42, discountPercentage: 35 },
    ],
  },
  {
    id: 4,
    categoryId: 4,
    baseSku: "AGRI-CASHEW-W320",
    hsCode: "0801.32.00",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 8.5,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Hạt điều nhân trắng xuất khẩu Grade W320",
        shortDescription: "Hạt điều Bình Phước chất lượng cao đóng túi hút chân không 25lbs/thùng xuất khẩu.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 48,
      cartonWidthCm: 35,
      cartonHeightCm: 28,
      netWeightKg: 22.68,
      grossWeightKg: 24.2,
      pcsPerCarton: 2,
    },
    priceTiers: [
      { minQuantity: 100, maxQuantity: 499, unitPriceUsd: 7.8, discountPercentage: 8 },
      { minQuantity: 500, maxQuantity: null, unitPriceUsd: 7.2, discountPercentage: 15 },
    ],
  },
  {
    id: 5,
    categoryId: 5,
    baseSku: "TAPE-OPP-48X100",
    hsCode: "3919.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 0.85,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Băng keo trong OPP dán thùng 48mm x 100 yards",
        shortDescription: "Băng dính đóng gói công nghiệp độ dính cao 50 mic, quy cách 72 cuộn/thùng.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 33,
      cartonWidthCm: 33,
      cartonHeightCm: 30,
      netWeightKg: 13.5,
      grossWeightKg: 14.5,
      pcsPerCarton: 72,
    },
    priceTiers: [
      { minQuantity: 360, maxQuantity: 1439, unitPriceUsd: 0.65, discountPercentage: 23 },
      { minQuantity: 1440, maxQuantity: null, unitPriceUsd: 0.55, discountPercentage: 35 },
    ],
  },
  {
    id: 6,
    categoryId: 6,
    baseSku: "PE-FILM-50-17",
    hsCode: "3920.10.10",
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: 3.2,
    isActive: true,
    translations: [
      {
        languageCode: "vi",
        name: "Màng PE quấn pallet tay 50cm độ dày 17 mic (Cuộn 2.8kg)",
        shortDescription: "Màng chít bọc hàng độ dai cao, chống bụi bẩn chống ẩm bảo vệ kiện hàng xuất khẩu.",
      },
    ],
    exportPackaging: {
      cartonLengthCm: 35,
      cartonWidthCm: 25,
      cartonHeightCm: 52,
      netWeightKg: 15.0,
      grossWeightKg: 16.8,
      pcsPerCarton: 6,
    },
    priceTiers: [
      { minQuantity: 120, maxQuantity: 479, unitPriceUsd: 2.6, discountPercentage: 18 },
      { minQuantity: 480, maxQuantity: null, unitPriceUsd: 2.25, discountPercentage: 30 },
    ],
  },
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 1, slug: "giay-dep-quan-ao", translations: [{ languageCode: "vi", name: "Giày dép & Quần áo" }] },
  { id: 2, slug: "than-khong-khoi", translations: [{ languageCode: "vi", name: "Than không khói" }] },
  { id: 3, slug: "can-choi-go", translations: [{ languageCode: "vi", name: "Cán chổi gỗ" }] },
  { id: 4, slug: "nong-san-xuat-khau", translations: [{ languageCode: "vi", name: "Hàng nông sản" }] },
  { id: 5, slug: "bang-keo-dong-goi", translations: [{ languageCode: "vi", name: "Băng keo công nghiệp" }] },
  { id: 6, slug: "mang-pe-stretch-film", translations: [{ languageCode: "vi", name: "Màng PE quấn pallet" }] },
];

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [selectedCatId, setSelectedCatId] = useState<number | undefined>();
  const [keyword, setKeyword] = useState<string>("");

  // Cart State for B2C Checkout
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    // Attempt to load from live API
    catalogApi.getCategories().then((res) => {
      if (res && res.length > 0) setCategories(res);
    });
    catalogApi.getProducts().then((res) => {
      if (res && res.length > 0) setProducts(res);
    });
  }, []);

  const filteredProducts = products.filter((p) => {
    const matchCat = selectedCatId ? p.categoryId === selectedCatId : true;
    const nameVi = p.translations[0]?.name || "";
    const matchKeyword = keyword
      ? nameVi.toLowerCase().includes(keyword.toLowerCase()) ||
        p.baseSku.toLowerCase().includes(keyword.toLowerCase()) ||
        p.hsCode.toLowerCase().includes(keyword.toLowerCase())
      : true;
    return matchCat && matchKeyword;
  });

  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.product.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const cartTotalUsd = cart.reduce((sum, item) => sum + item.product.defaultRetailPriceUsd * item.quantity, 0);

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
                <span>CÔNG TY TNHH SX & TM DV XNK QUANG TẤN HOÀNG</span>
              </div>

              <h1 className="mt-5 text-4xl sm:text-6xl font-black tracking-tight leading-[1.12]">
                <span className="text-[#0E4B94]">NỀN TẢNG XUẤT KHẨU</span> <br />
                <span className="text-[#C9252C]">QUỐC TẾ</span>{" "}
                <span className="text-neutral-900">& BÁN LẺ CAO CẤP</span>
              </h1>

              <p className="mt-5 text-base sm:text-lg text-neutral-700 leading-relaxed max-w-2xl">
                Cung cấp giải pháp thương mại điện tử kết hợp: Mua lẻ trực tiếp (B2C) tích hợp thanh toán quốc tế Stripe, và Cổng B2B dành cho Nhà nhập khẩu đàm phán RFQ, tính toán tối ưu thể tích đóng container CBM & tự động xuất 3 bộ chứng từ thương mại quốc tế.
              </p>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link
                  href="/portal"
                  className="flex items-center gap-2 bg-[#0E4B94] px-6 py-3.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#0a376d] shadow-sm hover:shadow transition-all"
                >
                  <span>Cổng B2B Báo Giá RFQ</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/cbm-calculator"
                  className="flex items-center gap-2 border-2 border-[#C9252C] bg-white px-6 py-3.5 text-xs font-black uppercase tracking-wider text-[#C9252C] hover:bg-[#C9252C] hover:text-white transition-all"
                >
                  <Box className="w-4 h-4" />
                  <span>Mô phỏng Đóng Container</span>
                </Link>
              </div>
            </div>

            {/* Right Brand Card (4 cols) */}
            <div className="lg:col-span-4 flex justify-center">
              <div className="border border-black/15 bg-white p-6 shadow-sm max-w-sm w-full text-center space-y-4 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#0E4B94] text-white text-[10px] font-mono font-bold px-3 py-0.5 uppercase tracking-wider">
                  THƯƠNG HIỆU QUỐC TẾ
                </div>
                <div className="p-4 bg-white flex justify-center">
                  <img
                    src="/logo.jpg"
                    alt="Công ty TNHH SX & TM DV XNK Quang Tấn Hoàng"
                    width={140}
                    height={140}
                    style={{ width: "140px", height: "140px", objectFit: "contain", margin: "0 auto" }}
                    className="rounded"
                  />
                </div>
                <div className="border-t border-black/10 pt-3">
                  <h3 className="font-extrabold text-[#0E4B94] text-base uppercase">
                    QUANG TẤN <span className="text-[#C9252C]">HOÀNG</span>
                  </h3>
                  <p className="text-[11px] text-neutral-500 font-mono mt-1">
                    Cảng xuất phát: Tân Cảng Cát Lái (TP.HCM)
                  </p>
                  <div className="mt-3 flex justify-center gap-2 text-[10px] font-mono text-neutral-600">
                    <span className="border border-neutral-300 px-2 py-0.5">ISO 9001</span>
                    <span className="border border-neutral-300 px-2 py-0.5">CE / FDA</span>
                    <span className="border border-neutral-300 px-2 py-0.5">EUR.1</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specs Stripe with Brand Accents */}
        <div className="mt-14 border-t border-black/10 bg-neutral-100/70 py-3.5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs font-mono uppercase text-neutral-700">
            <div><strong className="text-[#0E4B94]">POL:</strong> CẢNG CÁT LÁI (VNM)</div>
            <div><strong className="text-[#0E4B94]">INCOTERMS:</strong> FOB, CIF, CFR, DDP</div>
            <div><strong className="text-[#C9252C]">CHỨNG TỪ:</strong> ISO PI / CI / PKL (QUESTPDF)</div>
            <div><strong className="text-black">CSDL:</strong> 21 BẢNG 3NF SQL SERVER</div>
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
              Danh mục mặt hàng xuất khẩu ({filteredProducts.length})
            </h2>
            <p className="text-xs text-neutral-500 font-mono mt-1">
              Hiển thị song song giá bán lẻ B2C và bảng giá bậc thang chiết khấu số lượng lớn B2B
            </p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="border border-black p-12 text-center text-neutral-500 font-mono text-sm">
            Không tìm thấy sản phẩm phù hợp với từ khóa & ngành hàng đã chọn.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={handleAddToCart}
                onSelectForRfq={() => {
                  window.location.href = `/portal?product=${product.id}`;
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Slide-over Mini Cart Drawer (B2C Checkout) */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white border-l border-black p-6 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between border-b border-black pb-4">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-black" />
                  <h3 className="font-bold uppercase tracking-wide text-black text-base">
                    Giỏ hàng B2C ({cart.length} món)
                  </h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-neutral-100">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Cart Items List */}
              <div className="mt-4 divide-y divide-black/10 max-h-[60vh] overflow-y-auto">
                {cart.length === 0 ? (
                  <p className="text-sm font-mono text-neutral-500 py-8 text-center">Giỏ hàng đang trống.</p>
                ) : (
                  cart.map((item, idx) => (
                    <div key={idx} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-black">{item.product.translations[0]?.name}</p>
                        <p className="text-neutral-500 font-mono">SKU: {item.product.baseSku}</p>
                        <p className="text-neutral-500 font-mono">Số lượng: {item.quantity}</p>
                      </div>
                      <div className="text-right font-mono font-bold text-black">
                        ${(item.product.defaultRetailPriceUsd * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Cart Footer & Checkout CTA */}
            <div className="border-t border-black pt-4 space-y-3">
              <div className="flex justify-between items-baseline font-mono">
                <span className="text-xs uppercase text-neutral-600">Tổng thanh toán:</span>
                <span className="text-xl font-black text-black">${cartTotalUsd.toFixed(2)}</span>
              </div>
              <button
                onClick={() => {
                  alert("Chuyển đến trang thanh toán Stripe Checkout 3D Secure!");
                }}
                disabled={cart.length === 0}
                className="w-full bg-black py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-neutral-800 disabled:opacity-40"
              >
                Tiến hành thanh toán Stripe (EXP-41)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
