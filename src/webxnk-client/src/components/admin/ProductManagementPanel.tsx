"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Check,
  ImagePlus,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Category, Product } from "@/types";
import {
  catalogApi,
  getApiErrorMessage,
  inventoryApi,
  ProductWriteRequest,
} from "@/services/api";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency } from "@/context/CurrencyContext";
import { getProductImageUrl } from "@/utils/productImages";
import { getTranslation } from "@/lib/utils";

type ProductForm = {
  nameVi: string;
  nameEn: string;
  baseSku: string;
  hsCode: string;
  categoryId: number;
  price: string;
  descriptionVi: string;
  descriptionEn: string;
  stock: string;
  imageUrls: string[];
  isActive: boolean;
};

const emptyForm: ProductForm = {
  nameVi: "",
  nameEn: "",
  baseSku: "",
  hsCode: "",
  categoryId: 0,
  price: "",
  descriptionVi: "",
  descriptionEn: "",
  stock: "0",
  imageUrls: [],
  isActive: true,
};

type StockSummary = Awaited<
  ReturnType<typeof inventoryApi.getAllStockSummaries>
>[number];

export const ProductManagementPanel: React.FC = () => {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isVi = language === "vi";
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [warehouses, setWarehouses] = useState<
    Array<{ id: number; name: string }>
  >([]);
  const [stockByProduct, setStockByProduct] = useState<
    Record<number, StockSummary>
  >({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [files, setFiles] = useState<File[]>([]);
  const [fileSelectionError, setFileSelectionError] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [productList, categoryList, stockList, warehouseList] =
        await Promise.all([
          catalogApi.getAdminProducts(language),
          catalogApi.getCategories(language),
          inventoryApi.getAllStockSummaries(),
          inventoryApi.getWarehouses(),
        ]);
      setProducts(productList);
      setCategories(categoryList);
      setStockByProduct(
        Object.fromEntries(stockList.map((stock) => [stock.productId, stock])),
      );
      setWarehouses(
        warehouseList.map((warehouse) => ({
          id: warehouse.id,
          name: warehouse.name,
        })),
      );
    } catch {
      setError(
        isVi
          ? "Không thể tải danh sách sản phẩm từ máy chủ."
          : "Could not load products from the server.",
      );
    } finally {
      setLoading(false);
    }
  }, [isVi, language]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const categoryName = useMemo(
    () =>
      new Map(
        categories.map((category) => [
          category.id,
          getTranslation(category?.translations, language)?.name ||
            category.slug,
        ]),
      ),
    [categories, language],
  );

  const beginCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm, categoryId: categories[0]?.id || 0 });
    setFiles([]);
    setFileSelectionError(false);
    setUploadProgress(0);
    setError("");
    setNotice("");
    setModalOpen(true);
  };

  const beginEdit = async (product: Product) => {
    setSaving(true);
    setError("");
    try {
      const detail = await catalogApi.getAdminProductById(product.id, language);
      if (!detail) throw new Error("Product not found");
      const vi = getTranslation(detail?.translations, "vi");
      const en = getTranslation(detail?.translations, "en");
      setEditing(detail);
      setForm({
        nameVi: vi?.name || "",
        nameEn: en?.name || "",
        baseSku: detail.baseSku,
        hsCode: detail.hsCode || "",
        categoryId: detail.categoryId,
        price: String(detail.defaultRetailPriceUsd),
        descriptionVi: vi?.fullDescription || vi?.shortDescription || "",
        descriptionEn: en?.fullDescription || en?.shortDescription || "",
        stock: String(stockByProduct[detail.id]?.totalPhysicalStock || 0),
        imageUrls: Array.isArray(detail.imageUrls)
          ? detail.imageUrls
          : detail.imageUrl
            ? [detail.imageUrl]
            : [],
        isActive: detail.isActive,
      });
      setFiles([]);
      setFileSelectionError(false);
      setUploadProgress(0);
      setModalOpen(true);
    } catch (editError) {
      setError(
        getApiErrorMessage(
          editError,
          isVi
            ? "Không thể mở dữ liệu sản phẩm để chỉnh sửa."
            : "Could not load product details for editing.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof ProductForm>(
    key: K,
    value: ProductForm[K],
  ) => setForm((previous) => ({ ...previous, [key]: value }));

  const handleFilesSelected = (selectedFiles: File[]) => {
    const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name
        .slice(file.name.lastIndexOf("."))
        .toLowerCase();
      return file.size > 5 * 1024 * 1024 || !allowedExtensions.has(extension);
    });
    if (invalidFile) {
      setFiles([]);
      setFileSelectionError(true);
      setError(
        isVi
          ? "Lỗi tải ảnh: chỉ nhận JPG, JPEG, PNG, WEBP và mỗi ảnh tối đa 5MB."
          : "Image upload error: use JPG, JPEG, PNG, or WEBP files up to 5MB each.",
      );
      return;
    }
    setFileSelectionError(false);
    setError("");
    setFiles(selectedFiles);
  };

  const productPayload = (imageUrls: string[]): ProductWriteRequest => ({
    categoryId: form.categoryId,
    baseSku: form.baseSku.trim(),
    hsCode: form.hsCode.trim(),
    countryOfOrigin: "VNM",
    defaultRetailPriceUsd: Number(form.price),
    imageUrl: imageUrls[0] || null,
    imageUrls,
    translations: [
      {
        languageCode: "vi",
        name: form.nameVi.trim(),
        description: form.descriptionVi.trim(),
      },
      {
        languageCode: "en",
        name: form.nameEn.trim(),
        description: form.descriptionEn.trim(),
      },
    ],
    nameVi: form.nameVi.trim(),
    shortDescriptionVi: form.descriptionVi.trim(),
    fullDescriptionVi: form.descriptionVi.trim(),
    nameEn: form.nameEn.trim(),
    shortDescriptionEn: form.descriptionEn.trim(),
    fullDescriptionEn: form.descriptionEn.trim(),
    cartonLengthCm: editing?.exportPackaging?.cartonLengthCm || 0,
    cartonWidthCm: editing?.exportPackaging?.cartonWidthCm || 0,
    cartonHeightCm: editing?.exportPackaging?.cartonHeightCm || 0,
    netWeightKg: editing?.exportPackaging?.netWeightKg || 0,
    grossWeightKg: editing?.exportPackaging?.grossWeightKg || 0,
    pcsPerCarton: editing?.exportPackaging?.pcsPerCarton || 1,
    priceTiers: editing?.priceTiers || [],
    specificationsJson: editing?.specificationsJson,
  });

  const reconcileStock = async (productId: number) => {
    const desired = Math.floor(Number(form.stock));
    const current = stockByProduct[productId];
    const existingTotal = current?.totalPhysicalStock || 0;
    let difference = desired - existingTotal;
    if (difference === 0) return;
    if (warehouses.length === 0)
      throw new Error(
        isVi
          ? "Chưa có kho hoạt động để cập nhật tồn kho."
          : "No active warehouse is available for stock updates.",
      );

    const warehouseStocks = [...(current?.warehouseBreakdown || [])].sort(
      (a, b) => b.currentStock - a.currentStock,
    );
    if (difference > 0) {
      await inventoryApi.recordTransaction({
        warehouseId: warehouses[0].id,
        productId,
        transactionType: "ADJUSTMENT",
        quantityChange: difference,
        referenceType: "ADMIN_PRODUCT",
        referenceId: String(productId),
        note: "Initial/adjusted stock from product management",
      });
      return;
    }
    for (const warehouseStock of warehouseStocks) {
      if (difference === 0) break;
      const reduction = Math.min(
        warehouseStock.currentStock,
        Math.abs(difference),
      );
      if (!reduction) continue;
      await inventoryApi.recordTransaction({
        warehouseId: warehouseStock.warehouseId,
        productId,
        transactionType: "ADJUSTMENT",
        quantityChange: -reduction,
        referenceType: "ADMIN_PRODUCT",
        referenceId: String(productId),
        note: "Stock adjustment from product management",
      });
      difference += reduction;
    }
    if (difference < 0)
      throw new Error(
        isVi
          ? "Không thể giảm tồn kho vượt quá số lượng hiện có."
          : "The requested stock is below the quantity currently in inventory.",
      );
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (fileSelectionError) {
      setError(
        isVi
          ? "Vui lòng chọn lại file ảnh đúng định dạng và dung lượng."
          : "Select image files with a supported format and size.",
      );
      return;
    }
    const price = Number(form.price);
    const stock = Number(form.stock);
    if (
      !form.nameVi.trim() ||
      !form.baseSku.trim() ||
      !form.categoryId ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isInteger(stock) ||
      stock < 0
    ) {
      setError(
        isVi
          ? "Vui lòng nhập tên, SKU, danh mục, giá và tồn kho hợp lệ."
          : "Enter a name, SKU, category, valid price, and non-negative whole-number stock.",
      );
      return;
    }
    setSaving(true);
    try {
      let saved: Product;
      if (editing) {
        saved = await catalogApi.updateProduct(editing.id, {
          ...productPayload(form.imageUrls),
          isActive: form.isActive,
        });
        if (files.length > 0) {
          const uploadedUrls = await catalogApi.uploadProductImages(
            saved.id,
            files,
          );
          const updatedImageUrls = [...form.imageUrls, ...uploadedUrls];
          saved = await catalogApi.updateProduct(saved.id, {
            ...productPayload(updatedImageUrls),
            isActive: form.isActive,
          });
        }
      } else {
        if (files.length > 0) {
          saved = await catalogApi.createProductWithImages(
            productPayload(form.imageUrls),
            files,
            setUploadProgress,
          );
        } else {
          saved = await catalogApi.createProduct(
            productPayload(form.imageUrls),
          );
        }
        setProducts((prev) => [saved, ...prev]);
      }

      await reconcileStock(saved.id);
      setModalOpen(false);
      setNotice(
        isVi
          ? "Đã lưu sản phẩm vào cơ sở dữ liệu thành công."
          : "Product saved to the database successfully.",
      );
      await loadData();
    } catch (saveError) {
      setError(
        getApiErrorMessage(
          saveError,
          isVi
            ? "Không thể lưu sản phẩm. Vui lòng kiểm tra thông tin và thử lại."
            : "Could not save the product. Check the details and try again.",
        ),
      );
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    setSaving(true);
    setError("");
    try {
      const deletedId = deleting.id;
      await catalogApi.deleteProduct(deletedId);

      // 1. Lập tức loại bỏ sản phẩm vừa xóa khỏi State UI hiện tại
      setProducts((prevProducts) =>
        prevProducts.filter((p) => p.id !== deletedId),
      );

      setDeleting(null);
      setNotice(
        isVi
          ? "Đã xóa sản phẩm khỏi danh mục."
          : "Product removed from the catalog.",
      );

      // 2. Tải lại dữ liệu mới từ Server
      await loadData();
    } catch (deleteError) {
      setError(
        getApiErrorMessage(
          deleteError,
          isVi
            ? "Không thể xóa sản phẩm. Vui lòng thử lại."
            : "Could not delete the product. Please try again.",
        ),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-black uppercase">
            {isVi ? "Quản lý sản phẩm" : "Product management"}
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            {isVi
              ? "Danh mục, giá, tồn kho và hình ảnh được lưu trực tiếp vào hệ thống."
              : "Catalog, pricing, inventory, and images are saved to the system."}
          </p>
        </div>
        <button
          type="button"
          onClick={beginCreate}
          className="inline-flex items-center gap-2 bg-[#0E4B94] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#0B3D78]"
        >
          <Plus className="h-4 w-4" />
          {isVi ? "Thêm sản phẩm" : "Add product"}
        </button>
      </div>
      {notice && (
        <p
          role="status"
          className="border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
        >
          {notice}
        </p>
      )}
      {error && !modalOpen && (
        <p
          role="alert"
          className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
      <div className="overflow-x-auto border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">{isVi ? "Ảnh" : "Image"}</th>
              <th className="px-4 py-3">{isVi ? "Sản phẩm" : "Product"}</th>
              <th className="px-4 py-3">{isVi ? "Giá" : "Price"}</th>
              <th className="px-4 py-3">{isVi ? "Danh mục" : "Category"}</th>
              <th className="px-4 py-3">{isVi ? "Tồn kho" : "Stock"}</th>
              <th className="px-4 py-3 text-right">
                {isVi ? "Thao tác" : "Actions"}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                  {isVi ? "Đang tải dữ liệu..." : "Loading..."}
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-slate-500"
                >
                  {isVi
                    ? "Chưa có sản phẩm trong cơ sở dữ liệu."
                    : "There are no products in the database yet."}
                </td>
              </tr>
            ) : (
              products.map((product, index) => {
                const name =
                  getTranslation(product?.translations, language)?.name ||
                  product.baseSku;
                return (
                  <tr key={product.id ?? product.baseSku ?? `product-${index}`}>
                    <td className="px-4 py-3">
                      <img
                        src={getProductImageUrl(product)}
                        alt={name}
                        className="h-14 w-16 rounded border border-slate-200 object-cover"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <strong className="block text-slate-900">{name}</strong>
                      <span className="font-mono text-xs text-slate-500">
                        {product.baseSku}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formatPrice(product.defaultRetailPriceUsd)}
                    </td>
                    <td className="px-4 py-3">
                      {categoryName.get(product.categoryId) ||
                        product.categoryName ||
                        "—"}
                    </td>
                    <td className="px-4 py-3">
                      {stockByProduct[product.id]?.totalPhysicalStock || 0}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => void beginEdit(product)}
                          className="rounded border border-slate-300 p-2 hover:bg-slate-50"
                          aria-label={isVi ? "Sửa sản phẩm" : "Edit product"}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleting(product)}
                          className="rounded border border-red-200 p-2 text-red-700 hover:bg-red-50"
                          aria-label={isVi ? "Xóa sản phẩm" : "Delete product"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving)
              setModalOpen(false);
          }}
        >
          <form
            onSubmit={handleSave}
            className="max-h-[92vh] w-full max-w-3xl space-y-4 overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-black">
                {editing
                  ? isVi
                    ? "Chỉnh sửa sản phẩm"
                    : "Edit product"
                  : isVi
                    ? "Thêm sản phẩm"
                    : "Add product"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                disabled={saving}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold">
                {isVi
                  ? "Tên sản phẩm (Tiếng Việt) *"
                  : "Product name (Vietnamese) *"}
                <input
                  required
                  maxLength={255}
                  value={form.nameVi}
                  onChange={(e) => setField("nameVi", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Tên tiếng Anh" : "English name"}
                <input
                  value={form.nameEn}
                  onChange={(e) => setField("nameEn", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                SKU *
                <input
                  required
                  value={form.baseSku}
                  onChange={(e) => setField("baseSku", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 font-mono text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Mã HS" : "HS code"}
                <input
                  value={form.hsCode}
                  onChange={(e) => setField("hsCode", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Giá (USD) *" : "Price (USD) *"}
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setField("price", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Danh mục *" : "Category *"}
                <select
                  required
                  value={form.categoryId}
                  onChange={(e) =>
                    setField("categoryId", Number(e.target.value))
                  }
                  className="mt-1 w-full border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value={0}>
                    {isVi ? "Chọn danh mục" : "Choose a category"}
                  </option>
                  {categories.map((category, index) => (
                    <option
                      key={category.id ?? category.slug ?? `category-${index}`}
                      value={category.id ?? 0}
                    >
                      {categoryName.get(category.id) || category.slug}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Tồn kho *" : "Inventory *"}
                <input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={form.stock}
                  onChange={(e) => setField("stock", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="flex items-center gap-2 self-end pb-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setField("isActive", e.target.checked)}
                />
                {isVi ? "Đang kinh doanh" : "Active in storefront"}
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Mô tả (Tiếng Việt)" : "Description (Vietnamese)"}
                <textarea
                  rows={3}
                  value={form.descriptionVi}
                  onChange={(e) => setField("descriptionVi", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-semibold">
                {isVi ? "Mô tả tiếng Anh" : "English description"}
                <textarea
                  rows={3}
                  value={form.descriptionEn}
                  onChange={(e) => setField("descriptionEn", e.target.value)}
                  className="mt-1 w-full border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
            </div>
            <div className="space-y-2 border-t pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-3 py-2 text-xs font-semibold hover:bg-slate-50">
                <ImagePlus className="h-4 w-4" />
                {isVi
                  ? "Chọn ảnh (tối đa 5MB/ảnh)"
                  : "Select images (up to 5MB each)"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(event) =>
                    handleFilesSelected(Array.from(event.target.files || []))
                  }
                />
              </label>
              {files.length > 0 && (
                <p className="text-xs text-slate-500">
                  {files.map((file) => file.name).join(", ")}
                </p>
              )}
              {form.imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.imageUrls.map((url, index) => (
                    <div key={`${url}-${index}`} className="relative">
                      <img
                        src={url}
                        alt="Product"
                        className="h-16 w-20 rounded border object-cover"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setField(
                            "imageUrls",
                            form.imageUrls.filter((image) => image !== url),
                          )
                        }
                        className="absolute -right-2 -top-2 rounded-full bg-white p-0.5 text-red-600 shadow"
                        aria-label={isVi ? "Xóa ảnh" : "Remove image"}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {error && (
              <p
                role="alert"
                className="border border-red-200 bg-red-50 p-3 text-xs text-red-700"
              >
                {error}
              </p>
            )}
            {saving && files.length > 0 && (
              <div className="space-y-1" role="status">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>
                    {isVi ? "Đang tải ảnh lên..." : "Uploading images..."}
                  </span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded bg-slate-200">
                  <div
                    className="h-full bg-[#0E4B94] transition-[width]"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => setModalOpen(false)}
                className="border border-slate-300 px-4 py-2 text-xs font-semibold"
              >
                {isVi ? "Hủy" : "Cancel"}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-[#0E4B94] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isVi ? "Lưu sản phẩm" : "Save product"}
              </button>
            </div>
          </form>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md space-y-4 bg-white p-6 shadow-2xl"
          >
            <h3 className="text-lg font-black">
              {isVi ? "Xác nhận xóa sản phẩm" : "Confirm product deletion"}
            </h3>
            <p className="text-sm text-slate-600">
              {isVi
                ? `Bạn có chắc muốn xóa “${getTranslation(deleting?.translations, language)?.name || deleting.baseSku}”?`
                : `Delete “${getTranslation(deleting?.translations, language)?.name || deleting.baseSku}”?`}
            </p>
            {error && (
              <p role="alert" className="text-xs text-red-700">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setDeleting(null);
                  setError("");
                }}
                className="border border-slate-300 px-4 py-2 text-xs font-semibold"
              >
                {isVi ? "Hủy" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleDelete()}
                className="bg-red-700 px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                {saving
                  ? isVi
                    ? "Đang xóa..."
                    : "Deleting..."
                  : isVi
                    ? "Xóa sản phẩm"
                    : "Delete product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
