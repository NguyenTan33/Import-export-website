"use client";

import React, { useState, useEffect, useRef } from "react";
import { Product } from "@/types";
import { catalogApi } from "@/services/api";
import {
  Camera,
  RotateCcw,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  Monitor,
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getTranslation } from "@/lib/utils";
import {
  getProductImageUrl,
  getDefaultProductImageUrl,
  hasCustomProductImage,
  compressImageFileToDataUrl,
  saveCustomProductImage,
  resetProductImageToDefault,
  PRODUCT_IMAGE_UPDATED_EVENT,
} from "@/utils/productImages";
import { ProductImageEditModal } from "@/components/admin/ProductImageEditModal";

const FALLBACK_PRODUCTS: Product[] = [
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
        shortDescription: "Giày vải canvas đế cao su lưu hóa tiêu chuẩn xuất khẩu EU/Mỹ.",
      },
      {
        languageCode: "en",
        name: "Premium Vulcanized Canvas Sneakers",
        shortDescription: "Export-grade vulcanized rubber canvas sneakers meeting EU/US standards.",
      },
    ],
    priceTiers: [{ minQuantity: 120, maxQuantity: 499, unitPriceUsd: 22.0, discountPercentage: 12 }],
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
        shortDescription: "Than sinh thái không mùi, không tia lửa, thời gian cháy 4 giờ.",
      },
      {
        languageCode: "en",
        name: "Hexagonal Coconut Shell Smokeless BBQ Charcoal",
        shortDescription: "Eco-friendly, odorless briquettes with 4 hours burn time.",
      },
    ],
    priceTiers: [{ minQuantity: 500, maxQuantity: 1999, unitPriceUsd: 0.95, discountPercentage: 20 }],
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
        shortDescription: "Tiện tròn mịn, sấy chống mốc mối mọt, bọc màng PVC vân gỗ.",
      },
      {
        languageCode: "en",
        name: "Eucalyptus Wooden Broom Handle 120cm PVC Coated",
        shortDescription: "Kiln-dried anti-mildew hardwood handle with woodgrain shrink PVC sleeve.",
      },
    ],
    priceTiers: [{ minQuantity: 1000, maxQuantity: 4999, unitPriceUsd: 0.5, discountPercentage: 23 }],
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
        shortDescription: "Hạt điều Bình Phước chất lượng cao đóng túi hút chân không xuất khẩu.",
      },
      {
        languageCode: "en",
        name: "Export Grade W320 White Whole Cashew Kernels",
        shortDescription: "Premium whole cashew kernels vacuum packed in 25lbs master cartons.",
      },
    ],
    priceTiers: [{ minQuantity: 100, maxQuantity: 499, unitPriceUsd: 7.8, discountPercentage: 8 }],
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
      {
        languageCode: "en",
        name: "Industrial OPP Packaging Tape 48mm x 100 yards",
        shortDescription: "High-tack 50-micron industrial carton sealing tape.",
      },
    ],
    priceTiers: [{ minQuantity: 360, maxQuantity: 1439, unitPriceUsd: 0.65, discountPercentage: 23 }],
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
        shortDescription: "Màng chít bọc hàng độ dai cao, chống bụi bẩn chống ẩm xuất khẩu.",
      },
      {
        languageCode: "en",
        name: "Manual Pallet Stretch Film 50cm 17 Mic (2.8kg Roll)",
        shortDescription: "High-tensile stretch film providing moisture and dust protection.",
      },
    ],
    priceTiers: [{ minQuantity: 120, maxQuantity: 479, unitPriceUsd: 2.6, discountPercentage: 18 }],
  },
];

export const ProductMediaManagerPanel: React.FC = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";

  const [products, setProducts] = useState<Product[]>(FALLBACK_PRODUCTS);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [toastMsg, setToastMsg] = useState<string>("");
  const [, setRefreshTick] = useState<number>(0);

  const quickFileInputRef = useRef<HTMLInputElement | null>(null);
  const [quickTargetProduct, setQuickTargetProduct] = useState<Product | null>(null);

  useEffect(() => {
    catalogApi
      .getProducts()
      .then((res) => {
        if (res && res.length > 0) setProducts(res);
      })
      .catch(() => {});

    const onUpdated = () => setRefreshTick((t) => t + 1);
    window.addEventListener(PRODUCT_IMAGE_UPDATED_EVENT, onUpdated);
    return () => window.removeEventListener(PRODUCT_IMAGE_UPDATED_EVENT, onUpdated);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(""), 3500);
  };

  const handleQuickDevicePick = (product: Product) => {
    setQuickTargetProduct(product);
    if (quickFileInputRef.current) {
      quickFileInputRef.current.value = "";
      quickFileInputRef.current.click();
    }
  };

  const handleQuickFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !quickTargetProduct) return;

    if (!file.type.startsWith("image/")) {
      showToast(
        isVi
          ? "Vui lòng chọn file ảnh hợp lệ (.JPG, .PNG, .WEBP, .GIF)!"
          : "Please select a valid image file (.JPG, .PNG, .WEBP, .GIF)!"
      );
      return;
    }

    try {
      const dataUrl = await compressImageFileToDataUrl(file, 960, 0.86);
      await saveCustomProductImage(quickTargetProduct, dataUrl, file);
      showToast(
        isVi
          ? `Đã tải ảnh "${file.name}" từ thiết bị cho SKU ${quickTargetProduct.baseSku}!`
          : `Uploaded "${file.name}" from device for SKU ${quickTargetProduct.baseSku}!`
      );
    } catch {
      showToast(isVi ? "Lỗi khi đọc file ảnh từ thiết bị." : "Failed to read image from device.");
    }
  };

  const handleResetProduct = async (product: Product) => {
    await resetProductImageToDefault(product);
    showToast(
      isVi
        ? `Đã khôi phục ảnh gốc cho SKU ${product.baseSku}`
        : `Restored default image for SKU ${product.baseSku}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Hidden input for 1-click direct file selection from Laptop/PC */}
      <input
        ref={quickFileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/*"
        onChange={handleQuickFileChange}
        className="hidden"
      />

      {/* Top Banner */}
      <div className="border border-black bg-white p-5 rounded shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[#0E4B94] text-white rounded shrink-0">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black uppercase tracking-tight text-black">
              {isVi
                ? "Quản Lý Ảnh Minh Họa Sản Phẩm (Chọn Từ Thiết Bị Laptop / PC)"
                : "Product Illustration Manager (Upload from Laptop / PC)"}
            </h2>
            <p className="text-xs text-neutral-600 mt-1">
              {isVi
                ? "Admin có thể bấm chọn trực tiếp file ảnh từ ổ cứng máy tính (Laptop / PC) hoặc kéo thả ảnh để thay đổi ảnh hiển thị trên Trang chủ, Trang chi tiết và Giỏ hàng."
                : "Admins can select image files directly from their local computer (Laptop / PC) or drag-and-drop to update product illustrations across Storefront, PDP, and Checkout."}
            </p>
          </div>
        </div>

        {toastMsg && (
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-500 text-emerald-900 px-3.5 py-2 rounded text-xs font-mono font-bold shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{toastMsg}</span>
          </div>
        )}
      </div>

      {/* Product Media Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(Array.isArray(products) ? products : []).map((product, index) => {
          const trans = getTranslation(product?.translations, language);
          const name = trans?.name || product.baseSku;
          const imgUrl = getProductImageUrl(product);
          const isCustom = hasCustomProductImage(product);

          return (
            <div
              key={product?.id ?? product?.baseSku ?? `product-${index}`}
              className="border border-black/20 bg-white rounded overflow-hidden shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full bg-neutral-100 border-b border-black/10 overflow-hidden group">
                  <img
                    src={imgUrl}
                    alt={name}
                    onError={(e) => {
                      const fallback = getDefaultProductImageUrl(product);
                      if (e.currentTarget.src !== fallback) {
                        e.currentTarget.src = fallback;
                      }
                    }}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-black/85 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm">
                      {product.baseSku}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm ${
                        isCustom
                          ? "bg-emerald-600 text-white"
                          : "bg-white/95 text-neutral-800 border border-black/15"
                      }`}
                    >
                      {isCustom
                        ? isVi
                          ? "Ảnh Admin Đã Đổi"
                          : "Custom Admin Image"
                        : isVi
                        ? "Ảnh Mặc Định"
                        : "Default Studio Image"}
                    </span>
                  </div>

                  <Link
                    href={`/product/${product.id}`}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-white text-black rounded shadow-sm border border-black/15"
                    title={isVi ? "Xem trang sản phẩm" : "View product page"}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-500">
                    <span>HS {product.hsCode}</span>
                    <span className="font-bold text-[#C9252C]">
                      {formatPrice(product.defaultRetailPriceUsd)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-bold text-black line-clamp-2">{name}</h3>
                </div>
              </div>

              {/* Admin Image Controls */}
              <div className="px-4 pb-4 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDevicePick(product)}
                    className="flex items-center justify-center gap-1.5 bg-[#0E4B94] hover:bg-[#09356a] text-white py-2 px-2.5 text-xs font-bold rounded transition-colors"
                    title={
                      isVi
                        ? "Mở ngay cửa sổ chọn file ảnh từ Laptop / PC"
                        : "Open file picker to select image from Laptop / PC"
                    }
                  >
                    <Monitor className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isVi ? "Chọn từ máy tính" : "Pick from PC"}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditingProduct(product)}
                    className="flex items-center justify-center gap-1.5 border border-black bg-white hover:bg-black hover:text-white text-black py-2 px-2.5 text-xs font-bold rounded transition-colors"
                  >
                    <Camera className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {isVi ? "Kéo thả / Xem trước" : "Drag & Preview"}
                    </span>
                  </button>
                </div>

                {isCustom && (
                  <button
                    type="button"
                    onClick={() => handleResetProduct(product)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-mono font-bold text-neutral-600 hover:text-red-700 bg-neutral-100 hover:bg-red-50 border border-neutral-300 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{isVi ? "Khôi phục về ảnh gốc mặc định" : "Restore Default Image"}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal for Drag & Drop + Live Comparison */}
      {editingProduct && (
        <ProductImageEditModal
          product={editingProduct}
          isOpen={!!editingProduct}
          onClose={() => setEditingProduct(null)}
          onImageUpdated={() => {
            showToast(
              isVi
                ? `Đã cập nhật ảnh mới cho sản phẩm ${editingProduct.baseSku}!`
                : `Updated illustration for ${editingProduct.baseSku}!`
            );
          }}
        />
      )}
    </div>
  );
};
