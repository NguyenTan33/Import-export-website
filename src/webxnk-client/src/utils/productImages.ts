"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types";
import { catalogApi } from "@/services/api";

export const PRODUCT_IMAGE_UPDATED_EVENT = "webxnk-product-image-updated";

export function getDefaultProductImageUrl(_product?: Pick<Product, "id" | "baseSku">): string {
  return "/images/product-placeholder.svg";
}

export function getProductImageUrl(product: Pick<Product, "imageUrl" | "imageUrls">): string {
  return product.imageUrls?.[0] || product.imageUrl || getDefaultProductImageUrl();
}

export function hasCustomProductImage(product: Pick<Product, "imageUrl" | "imageUrls">): boolean {
  return Boolean(product.imageUrls?.length || product.imageUrl);
}

export function compressImageFileToDataUrl(file: File, maxWidth = 960, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không thể đọc file ảnh từ thiết bị."));
    reader.onload = () => {
      const result = reader.result as string;
      const image = new Image();
      image.onerror = () => resolve(result);
      image.onload = () => {
        const ratio = Math.min(1, maxWidth / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * ratio);
        canvas.height = Math.round(image.height * ratio);
        const context = canvas.getContext("2d");
        if (!context) return resolve(result);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", quality));
      };
      image.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export async function saveCustomProductImage(
  product: Pick<Product, "id" | "baseSku">,
  imageUrlOrDataUrl: string,
  rawFile?: File
): Promise<string> {
  const updated = rawFile
    ? await catalogApi.uploadProductImage(product.id, rawFile)
    : await catalogApi.updateProductImage(product.id, imageUrlOrDataUrl);
  if (!updated) throw new Error("Không thể lưu ảnh sản phẩm vào máy chủ.");
  window.dispatchEvent(new CustomEvent(PRODUCT_IMAGE_UPDATED_EVENT, { detail: { productId: product.id, imageUrl: updated.imageUrl } }));
  return updated.imageUrl || imageUrlOrDataUrl;
}

export async function resetProductImageToDefault(product: Pick<Product, "id" | "baseSku">): Promise<string> {
  const updated = await catalogApi.updateProductImage(product.id, "");
  if (!updated) throw new Error("Không thể xóa ảnh sản phẩm trên máy chủ.");
  window.dispatchEvent(new CustomEvent(PRODUCT_IMAGE_UPDATED_EVENT, { detail: { productId: product.id, imageUrl: null } }));
  return getDefaultProductImageUrl();
}

export function useProductImage(product: Pick<Product, "id" | "baseSku" | "imageUrl" | "imageUrls">): { imageUrl: string; isCustom: boolean } {
  const [imageUrl, setImageUrl] = useState(() => getProductImageUrl(product));
  useEffect(() => {
    const sync = () => setImageUrl(getProductImageUrl(product));
    sync();
    window.addEventListener(PRODUCT_IMAGE_UPDATED_EVENT, sync);
    return () => window.removeEventListener(PRODUCT_IMAGE_UPDATED_EVENT, sync);
  }, [product]);
  return { imageUrl, isCustom: hasCustomProductImage(product) };
}
