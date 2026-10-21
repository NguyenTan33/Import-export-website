"use client";

import React, { useState, useRef } from "react";
import { Product } from "@/types";
import {
  X,
  Upload,
  Monitor,
  Link as LinkIcon,
  RotateCcw,
  Check,
  Image as ImageIcon,
  Sparkles,
  FileImage,
} from "lucide-react";
import {
  getProductImageUrl,
  getDefaultProductImageUrl,
  compressImageFileToDataUrl,
  saveCustomProductImage,
  resetProductImageToDefault,
} from "@/utils/productImages";
import { useLanguage } from "@/context/LanguageContext";

interface ProductImageEditModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onImageUpdated?: (newImageUrl: string) => void;
}

export const ProductImageEditModal: React.FC<ProductImageEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onImageUpdated,
}) => {
  const { language } = useLanguage();
  const isVi = language === "vi";

  const currentImageUrl = getProductImageUrl(product);
  const defaultImageUrl = getDefaultProductImageUrl(product);

  const [mode, setMode] = useState<"device" | "url">("device");
  const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const productName =
    product.translations?.find((tr) => tr.languageCode === language)?.name ||
    product.translations?.find((tr) => tr.languageCode === "vi")?.name ||
    product.translations?.[0]?.name ||
    product.baseSku;

  const handleFilePicked = async (file: File) => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!file.type.startsWith("image/")) {
      setErrorMsg(
        isVi
          ? "Vui lòng chọn tệp hình ảnh hợp lệ (.JPG, .PNG, .WEBP, .GIF) từ máy tính của bạn."
          : "Please select a valid image file (.JPG, .PNG, .WEBP, .GIF) from your computer."
      );
      return;
    }

    try {
      const compressedDataUrl = await compressImageFileToDataUrl(file, 960, 0.86);
      setSelectedFile(file);
      setPreviewUrl(compressedDataUrl);
    } catch {
      setErrorMsg(
        isVi
          ? "Không thể đọc tệp ảnh từ thiết bị. Vui lòng thử ảnh khác."
          : "Could not read image file from device. Please try another image."
      );
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFilePicked(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFilePicked(file);
    }
  };

  const handleUrlInputChange = (val: string) => {
    setUrlInput(val);
    setSelectedFile(null);
    setErrorMsg("");
    if (val.trim()) {
      setPreviewUrl(val.trim());
    }
  };

  const handleSave = async () => {
    if (!previewUrl || !previewUrl.trim()) {
      setErrorMsg(
        isVi
          ? "Vui lòng chọn ảnh từ thiết bị hoặc nhập đường dẫn ảnh."
          : "Please select an image from your device or enter an image URL."
      );
      return;
    }

    setIsSaving(true);
    setErrorMsg("");
    try {
      const savedUrl = await saveCustomProductImage(
        product,
        previewUrl.trim(),
        selectedFile || undefined
      );
      setSuccessMsg(
        isVi
          ? "Đã cập nhật ảnh sản phẩm thành công!"
          : "Product illustration updated successfully!"
      );
      onImageUpdated?.(savedUrl);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch {
      setErrorMsg(
        isVi
          ? "Có lỗi xảy ra khi lưu ảnh sản phẩm."
          : "Failed to save product image."
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = async () => {
    setIsSaving(true);
    setErrorMsg("");
    try {
      const resetUrl = await resetProductImageToDefault(product);
      setPreviewUrl(resetUrl);
      setSelectedFile(null);
      setUrlInput("");
      setSuccessMsg(
        isVi
          ? "Đã khôi phục về ảnh minh họa gốc!"
          : "Restored to default illustration!"
      );
      onImageUpdated?.(resetUrl);
      setTimeout(() => {
        onClose();
      }, 500);
    } finally {
      setIsSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-2xl bg-white border-2 border-black shadow-2xl rounded overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="bg-[#0E4B94] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ImageIcon className="w-5 h-5 text-white shrink-0" />
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-blue-200 block">
                {isVi
                  ? "QUYỀN QUẢN TRỊ VIÊN (ADMIN) • QUẢN LÝ HÌNH ẢNH SẢN PHẨM"
                  : "ADMIN PRIVILEGE • PRODUCT ILLUSTRATION MANAGER"}
              </span>
              <h3 className="text-base font-black uppercase tracking-tight">
                {isVi ? "Thay Đổi Ảnh Minh Họa Sản Phẩm" : "Change Product Illustration"}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded hover:bg-white/20 text-white transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
          {/* Product Info Strip */}
          <div className="bg-neutral-50 border border-neutral-200 p-3 rounded flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono text-neutral-500 uppercase">
                SKU: <strong className="text-black">{product.baseSku}</strong> • HS {product.hsCode}
              </span>
              <h4 className="text-sm font-bold text-black">{productName}</h4>
            </div>
            <span className="text-[11px] font-mono bg-black text-white px-2.5 py-1 rounded font-bold">
              ID #{product.id}
            </span>
          </div>

          {/* Mode Tabs: Device Upload vs URL */}
          <div className="grid grid-cols-2 gap-2 bg-neutral-100 p-1 rounded border border-neutral-300">
            <button
              type="button"
              onClick={() => setMode("device")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold uppercase rounded transition-all ${
                mode === "device"
                  ? "bg-[#0E4B94] text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <Monitor className="w-4 h-4" />
              <span>
                {isVi
                  ? "1. Chọn ảnh từ thiết bị (Laptop / PC)"
                  : "1. Select from Device (Laptop / PC)"}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("url")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-bold uppercase rounded transition-all ${
                mode === "url"
                  ? "bg-[#0E4B94] text-white shadow-sm"
                  : "text-neutral-600 hover:text-black"
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>
                {isVi ? "2. Dán đường dẫn ảnh (URL)" : "2. Paste Image URL"}
              </span>
            </button>
          </div>

          {/* Input Section */}
          {mode === "device" ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                  isDragging
                    ? "border-[#0E4B94] bg-blue-50/70"
                    : "border-neutral-400 hover:border-[#0E4B94] bg-neutral-50/70 hover:bg-blue-50/30"
                }`}
              >
                <div className="mx-auto w-12 h-12 rounded-full bg-[#0E4B94]/10 text-[#0E4B94] flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <p className="text-sm font-extrabold text-neutral-900">
                  {isVi
                    ? "Bấm vào đây để chọn ảnh từ máy tính (Laptop / PC)"
                    : "Click here to browse image from your computer (Laptop / PC)"}
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  {isVi
                    ? "Hoặc kéo và thả (Drag & Drop) file ảnh trực tiếp từ màn hình Desktop / thư mục vào khung này"
                    : "Or drag and drop an image file directly from your Desktop / folder here"}
                </p>
                <div className="mt-4 inline-flex items-center gap-2 bg-[#0E4B94] text-white text-xs font-bold uppercase px-4 py-2 rounded shadow-sm hover:bg-[#09356a]">
                  <FileImage className="w-4 h-4" />
                  <span>
                    {isVi ? "Mở Thư Mục Máy Tính (Chọn File Ảnh)" : "Browse Local Computer Files"}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-400 mt-2">
                  {isVi
                    ? "Hỗ trợ: .JPG, .JPEG, .PNG, .WEBP, .GIF • Tự động tối ưu độ nét"
                    : "Supported: .JPG, .JPEG, .PNG, .WEBP, .GIF • Auto-optimized"}
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 px-3.5 py-2 rounded text-xs font-mono text-emerald-900">
                  <div className="flex items-center gap-2 truncate">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {isVi ? "Đã chọn từ máy tính:" : "Selected from device:"}{" "}
                      <strong>{selectedFile.name}</strong>
                    </span>
                  </div>
                  <span className="shrink-0 ml-2 px-2 py-0.5 bg-white border border-emerald-200 rounded font-bold">
                    {formatFileSize(selectedFile.size)}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <label className="block text-xs font-mono font-bold uppercase text-neutral-700">
                {isVi
                  ? "Nhập đường dẫn URL ảnh sản phẩm (https://... hoặc /images/...):"
                  : "Enter Product Image URL (https://... or /images/...):"}
              </label>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => handleUrlInputChange(e.target.value)}
                placeholder="https://example.com/product-photo.jpg"
                className="w-full border border-neutral-400 px-3.5 py-2.5 text-xs font-mono rounded focus:outline-none focus:border-[#0E4B94]"
              />
            </div>
          )}

          {/* Live Comparison Preview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div className="border border-neutral-200 rounded p-3 bg-neutral-50">
              <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block mb-2">
                {isVi ? "Ảnh Đang Hiển Thị Hiện Tại" : "Current Displayed Image"}
              </span>
              <div className="aspect-[4/3] w-full overflow-hidden rounded border border-neutral-300 bg-white flex items-center justify-center">
                <img
                  src={currentImageUrl}
                  alt={productName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="border-2 border-[#0E4B94] rounded p-3 bg-blue-50/30">
              <span className="text-[10px] font-mono uppercase text-[#0E4B94] font-bold flex items-center gap-1 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                {isVi ? "Xem Trước Ảnh Mới Sẽ Cập Nhật" : "New Illustration Live Preview"}
              </span>
              <div className="aspect-[4/3] w-full overflow-hidden rounded border border-neutral-300 bg-white flex items-center justify-center">
                <img
                  src={previewUrl || defaultImageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => {
                    setErrorMsg(
                      isVi
                        ? "Không tải được ảnh xem trước. Vui lòng kiểm tra lại tệp hoặc URL."
                        : "Failed to load image preview. Please verify the file or URL."
                    );
                  }}
                />
              </div>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-300 text-red-700 text-xs font-mono rounded">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-400 text-emerald-800 text-xs font-mono font-bold rounded flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="bg-neutral-100 border-t border-neutral-300 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefault}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-mono font-bold text-neutral-700 bg-white border border-neutral-400 hover:bg-neutral-200 rounded transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isVi ? "Khôi phục ảnh gốc" : "Reset to Default"}</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-bold uppercase text-neutral-600 hover:text-black"
            >
              {isVi ? "Hủy" : "Cancel"}
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 bg-[#0E4B94] hover:bg-[#09356a] text-white px-5 py-2.5 text-xs font-black uppercase tracking-wider rounded shadow transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>
                {isSaving
                  ? isVi
                    ? "Đang lưu ảnh..."
                    : "Saving..."
                  : isVi
                  ? "Lưu & Áp Dụng Ảnh Mới"
                  : "Save & Apply Image"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
