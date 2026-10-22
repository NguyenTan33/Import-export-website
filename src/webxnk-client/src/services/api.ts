import axios from "axios";
import { getRecordCode } from "@/lib/utils";
import {
  Product,
  Category,
  Warehouse,
  CbmItemInput,
  CbmCalculationResult,
  RfqRequestDto,
  SalesContract,
  SignContractRequest,
  RfqCounterOffer,
  SubmitCounterOfferRequest,
  ExchangeRateInfo,
  B2BPaymentSlip,
  CompanyProfileDto,
  LandedCostRequest,
  LandedCostResult,
} from "@/types";
import {
  generateRealisticStowedBoxes,
  ItemStowageSpec,
} from "@/utils/fallbackStowage";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export interface ApiUserProfile {
  id: number | string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  company?: {
    companyName: string;
    taxId: string;
    countryCode: string;
    verificationStatus: string;
    website?: string;
  } | null;
}

export interface ApiAuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: ApiUserProfile;
}

export interface OrderHistoryItem {
  id: number;
  productName: string;
  quantity: number;
  unitPriceUsd: number;
  totalPriceUsd: number;
}

export interface OrderHistoryEntry {
  id: number;
  orderCode: string;
  orderType: string;
  orderNumber: string;
  destinationCountryCode: string;
  status: string;
  trackingNumber?: string;
  currencyCode: string;
  subtotalUsd: number;
  shippingFeeUsd: number;
  totalAmountUsd: number;
  orderStatus: string;
  paymentStatus: string;
  recipientName: string;
  shippingAddressLine: string;
  createdAt: string;
  items: OrderHistoryItem[];
}

export interface RfqHistoryEntry {
  id: number;
  rfqNumber: string;
  companyName: string;
  incotermCode: string;
  portOfDischarge: string;
  status: string;
  totalCbm: number;
  totalQuotedAmountUsd: number;
  createdAt: string;
}

export interface CustomerAddress {
  id: number;
  recipientName: string;
  phoneNumber: string;
  province: string;
  district: string;
  ward: string;
  addressLine: string;
  countryCode: string;
  postalCode: string;
  isDefault: boolean;
}

export type SaveCustomerAddressRequest = Omit<CustomerAddress, "id">;

export interface ProductWriteRequest {
  categoryId: number;
  baseSku: string;
  hsCode: string;
  countryOfOrigin: string;
  defaultRetailPriceUsd: number;
  imageUrl?: string | null;
  imageUrls: string[];
  translations: Array<{
    languageCode: "vi" | "en";
    name: string;
    description: string;
  }>;
  specificationsJson?: string;
  nameVi: string;
  shortDescriptionVi?: string;
  fullDescriptionVi?: string;
  nameEn?: string;
  shortDescriptionEn?: string;
  fullDescriptionEn?: string;
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  netWeightKg: number;
  grossWeightKg: number;
  pcsPerCarton: number;
  priceTiers: Array<{
    minQuantity: number;
    maxQuantity?: number | null;
    unitPriceUsd: number;
    discountPercentage: number;
  }>;
}

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | Record<string, unknown>
      | string
      | undefined;
    if (data && typeof data === "object") {
      const message = data.message ?? data.title ?? data.detail;
      if (typeof message === "string" && message.trim()) return message;
      const errors = data.errors;
      if (Array.isArray(errors)) {
        const messages = errors.filter(
          (item): item is string => typeof item === "string" && !!item.trim(),
        );
        if (messages.length) return messages.join(" ");
      }
      if (errors && typeof errors === "object") {
        const messages = Object.values(errors)
          .flatMap((value) => (Array.isArray(value) ? value : [value]))
          .filter(
            (item): item is string => typeof item === "string" && !!item.trim(),
          );
        if (messages.length) return messages.join(" ");
      }
    }
    if (typeof data === "string" && data.trim()) return data;
    if (!error.response) return fallback;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

type ProductApiRecord = Partial<Product> & {
  name?: string;
  shortDescription?: string;
  fullDescription?: string;
  categoryName?: string;
  imageUrls?: string[];
  cbmPerCarton?: number;
  grossWeightKg?: number;
  pcsPerCarton?: number;
  minimumMoq?: number;
};

const normalizeProduct = (
  raw: ProductApiRecord,
  languageCode = "vi",
): Product => ({
  id: Number(raw.id || 0),
  categoryId: Number(raw.categoryId || 0),
  categoryName: raw.categoryName,
  baseSku: raw.baseSku || "",
  hsCode: raw.hsCode || "",
  countryOfOrigin: raw.countryOfOrigin || "",
  defaultRetailPriceUsd: Number(raw.defaultRetailPriceUsd || 0),
  imageUrl:
    raw.imageUrl ||
    (Array.isArray(raw.imageUrls) ? raw.imageUrls[0] : undefined) ||
    undefined,
  imageUrls: Array.isArray(raw.imageUrls)
    ? raw.imageUrls
    : raw.imageUrl
      ? [raw.imageUrl]
      : [],
  specificationsJson: raw.specificationsJson,
  isActive: raw.isActive ?? true,
  translations:
    Array.isArray(raw.translations) && raw.translations.length
      ? raw.translations
      : [
          {
            languageCode,
            name: raw.name || raw.baseSku || "",
            shortDescription: raw.shortDescription,
            fullDescription: raw.fullDescription,
          },
        ],
  exportPackaging:
    raw.exportPackaging ||
    (raw.cbmPerCarton != null
      ? {
          cartonLengthCm: 0,
          cartonWidthCm: 0,
          cartonHeightCm: 0,
          netWeightKg: 0,
          grossWeightKg: raw.grossWeightKg || 0,
          pcsPerCarton: raw.pcsPerCarton || 1,
        }
      : undefined),
  priceTiers: Array.isArray(raw.priceTiers)
    ? raw.priceTiers
    : raw.minimumMoq
      ? [
          {
            minQuantity: raw.minimumMoq,
            unitPriceUsd: raw.defaultRetailPriceUsd || 0,
            discountPercentage: 0,
          },
        ]
      : [],
});

const normalizeRfq = (value: unknown): RfqRequestDto => {
  const record =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  return {
    ...(record as unknown as RfqRequestDto),
    id: typeof record.id === "number" ? record.id : undefined,
    rfqNumber: getRecordCode(record, ["rfqNumber", "rfqCode", "code", "id"]),
    incotermCode:
      typeof record.incotermCode === "string" ? record.incotermCode : "",
    portOfLoading:
      typeof record.portOfLoading === "string" ? record.portOfLoading : "",
    portOfDischarge:
      typeof record.portOfDischarge === "string" ? record.portOfDischarge : "",
    targetDeliveryDate:
      typeof record.targetDeliveryDate === "string"
        ? record.targetDeliveryDate
        : "",
    items: Array.isArray(record.items) ? record.items : [],
  };
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  // RFQ creation can run database lookups and CBM calculations; a 3s timeout
  // caused legitimate submissions to fail on slower local/dev servers.
  timeout: 15000,
});

export const authApi = {
  login: async (email: string, password: string): Promise<ApiAuthResponse> => {
    const response = await apiClient.post<ApiAuthResponse>("/auth/login", {
      email,
      password,
    });
    return response.data;
  },
  registerB2c: async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
  }): Promise<ApiAuthResponse> => {
    const response = await apiClient.post<ApiAuthResponse>(
      "/auth/register-b2c",
      data,
    );
    return response.data;
  },
  registerB2b: async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    companyName: string;
    taxId: string;
    countryCode: string;
    website?: string;
  }): Promise<ApiAuthResponse> => {
    const response = await apiClient.post<ApiAuthResponse>(
      "/auth/register-b2b",
      data,
    );
    return response.data;
  },
  getProfile: async (): Promise<ApiUserProfile> => {
    const response = await apiClient.get<ApiUserProfile>("/auth/me");
    return response.data;
  },
  updateProfile: async (data: {
    fullName: string;
    email: string;
    phoneNumber: string;
  }): Promise<ApiUserProfile> => {
    const response = await apiClient.put<ApiUserProfile>("/auth/me", data);
    return response.data;
  },
};

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("webxnk_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    // Critical: When data is FormData, remove Content-Type so Axios & browser can set multipart/form-data with the correct boundary!
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
      if (typeof (config.headers as Record<string, unknown>).delete === "function") {
        (config.headers as { delete: (name: string) => void }).delete("Content-Type");
      }
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response Interceptor: Auto-unwrap ApiResponse<T> and port failover
apiClient.interceptors.response.use(
  (response) => {
    // If response wrapped in standard ApiResponse<T>
    if (
      response.data &&
      typeof response.data === "object" &&
      "statusCode" in response.data &&
      "data" in response.data
    ) {
      const payload = response.data.data;
      // Only unwrap actual paginated results. RFQ/order details also have an
      // `items` array and must remain intact as their parent record.
      if (
        payload &&
        typeof payload === "object" &&
        Array.isArray(payload.items) &&
        ("totalCount" in payload ||
          "pageIndex" in payload ||
          "pageSize" in payload ||
          "totalPages" in payload)
      ) {
        return {
          ...response,
          data: payload.items,
          pagination: {
            totalCount: payload.totalCount,
            pageIndex: payload.pageIndex,
            pageSize: payload.pageSize,
            totalPages: payload.totalPages,
          },
        };
      }
      return { ...response, data: payload };
    }
    return response;
  },
  async (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("webxnk_token");
      }
    }

    // Smart Port Failover: If port 5000 fails to connect, auto-retry on port 5288 and vice versa
    const config = error.config;
    if (config && !config._retry) {
      const currentUrl = config.baseURL || API_BASE_URL;
      const isNetworkError =
        error.code === "ERR_NETWORK" ||
        error.code === "ECONNREFUSED" ||
        error.message?.includes("Network Error");
      if (isNetworkError && currentUrl.includes("localhost")) {
        config._retry = true;
        const alternativeUrl = currentUrl.includes("5000")
          ? currentUrl.replace("5000", "5288")
          : currentUrl.replace("5288", "5000");
        config.baseURL = alternativeUrl;
        apiClient.defaults.baseURL = alternativeUrl;
        return apiClient(config);
      }
    }

    return Promise.reject(error);
  },
);

// Client-side Memory Cache with TTL for high performance & reduced network roundtrips
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const cacheStore = new Map<string, CacheEntry<unknown>>();

export const clientCache = {
  get: <T>(key: string, ttlMs: number): T | null => {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > ttlMs) {
      cacheStore.delete(key);
      return null;
    }
    return entry.data as T;
  },
  set: <T>(key: string, data: T): void => {
    cacheStore.set(key, { data, timestamp: Date.now() });
  },
  clear: (pattern?: string): void => {
    if (!pattern) {
      cacheStore.clear();
      return;
    }
    cacheStore.forEach((_, key) => {
      if (key.includes(pattern)) {
        cacheStore.delete(key);
      }
    });
  },
};

export const PRODUCT_CATALOG_UPDATED_EVENT = "webxnk-catalog-updated";

export const notifyCatalogUpdated = () => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("webxnk_catalog_updated", Date.now().toString());
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(PRODUCT_CATALOG_UPDATED_EVENT));
  }
};

// 1. Catalog & Product Services
export const catalogApi = {
  getAdminProducts: async (languageCode = "vi"): Promise<Product[]> => {
    clientCache.clear();
    const response = await apiClient.get<ProductApiRecord[]>(
      "/products/admin/all",
      {
        params: { pageIndex: 1, pageSize: 100, includeInactive: true, _t: Date.now() },
        headers: { "X-Language": languageCode },
      },
    );
    return Array.isArray(response.data)
      ? response.data
          .filter(Boolean)
          .map((product) => normalizeProduct(product, languageCode))
      : [];
  },
  getProducts: async (
    categoryId?: number,
    keyword?: string,
    languageCode = "vi",
    pageSize = 100,
    forceRefresh = false,
  ): Promise<Product[]> => {
    const cacheKey = `products_${categoryId ?? "all"}_${keyword ?? "none"}_${languageCode}_${pageSize}`;
    if (!forceRefresh) {
      const cached = clientCache.get<Product[]>(cacheKey, 30 * 1000); // 30s cache
      if (cached) return cached;
    }

    try {
      const response = await apiClient.get<ProductApiRecord[]>("/products", {
        params: {
          categoryId,
          searchKeyword: keyword,
          pageSize,
          pageIndex: 1,
          _t: forceRefresh ? Date.now() : undefined,
        },
        headers: { "X-Language": languageCode },
      });
      const items = Array.isArray(response.data)
        ? response.data
            .filter(Boolean)
            .map((product) => normalizeProduct(product, languageCode))
        : [];
      clientCache.set(cacheKey, items);
      return items;
    } catch {
      return [];
    }
  },
  getProductById: async (
    id: number,
    languageCode = "vi",
  ): Promise<Product | null> => {
    const cacheKey = `product_${id}_${languageCode}`;
    const cached = clientCache.get<Product>(cacheKey, 3 * 60 * 1000); // 3m cache
    if (cached) return cached;

    try {
      const response = await apiClient.get<ProductApiRecord>(
        `/products/${id}`,
        { headers: { "X-Language": languageCode } },
      );
      if (response.data) {
        const product = normalizeProduct(response.data, languageCode);
        clientCache.set(cacheKey, product);
        return product;
      }
      return null;
    } catch {
      return null;
    }
  },
  getAdminProductById: async (
    id: number,
    languageCode = "vi",
  ): Promise<Product | null> => {
    const response = await apiClient.get<ProductApiRecord>(
      `/products/${id}/admin`,
      { headers: { "X-Language": languageCode } },
    );
    return response.data ? normalizeProduct(response.data, languageCode) : null;
  },
  getCachedProductById: (id: number): Product | null => {
    return clientCache.get<Product>(`product_${id}_vi`, 5 * 60 * 1000);
  },
  getCategories: async (languageCode = "vi"): Promise<Category[]> => {
    const cacheKey = `catalog_categories_${languageCode}`;
    const cached = clientCache.get<Category[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    try {
      const response = await apiClient.get<Array<Category & { name?: string }>>(
        "/categories",
        { headers: { "X-Language": languageCode } },
      );
      const list = Array.isArray(response.data)
        ? response.data.filter(Boolean).map((category) => ({
            ...category,
            translations:
              Array.isArray(category.translations) &&
              category.translations.length
                ? category.translations
                : [
                    {
                      languageCode,
                      name: category.name || category.slug || "",
                    },
                  ],
          }))
        : [];
      clientCache.set(cacheKey, list);
      return list;
    } catch {
      return [];
    }
  },
  createProduct: async (data: ProductWriteRequest): Promise<Product> => {
    const response = await apiClient.post<ProductApiRecord>("/products", data);
    clientCache.clear(); // Xóa sạch cache
    notifyCatalogUpdated();
    return normalizeProduct(response.data);
  },
  createProductWithImages: async (
    data: ProductWriteRequest,
    files: File[],
    onProgress?: (percent: number) => void,
  ): Promise<Product> => {
    const formData = new FormData();
    formData.append("productJson", JSON.stringify(data));
    files.forEach((file) => formData.append("files", file));
    const response = await apiClient.post<ProductApiRecord>(
      "/products/with-images",
      formData,
      {
        timeout: 60000,
        onUploadProgress: (event) => {
          if (event.total)
            onProgress?.(
              Math.min(100, Math.round((event.loaded * 100) / event.total)),
            );
        },
      },
    );
    clientCache.clear(); // Xóa sạch cache
    notifyCatalogUpdated();
    return normalizeProduct(response.data);
  },
  updateProduct: async (
    id: number,
    data: ProductWriteRequest & { isActive: boolean },
  ): Promise<Product> => {
    const response = await apiClient.put<ProductApiRecord>(
      `/products/${id}`,
      data,
    );
    clientCache.clear();
    notifyCatalogUpdated();
    return normalizeProduct(response.data);
  },
  deleteProduct: async (id: number): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
    // Xóa toàn bộ cache sản phẩm và danh mục để ép ứng dụng fetch mới
    clientCache.clear();
    notifyCatalogUpdated();
  },
  uploadProductImages: async (id: number, files: File[]): Promise<string[]> => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await apiClient.post<ProductApiRecord>(
      `/products/${id}/images`,
      formData,
      {
        timeout: 30000,
      },
    );
    clientCache.clear("products_");
    clientCache.clear(`product_${id}_`);
    notifyCatalogUpdated();
    return response.data?.imageUrls || [];
  },
  uploadProductImage: async (
    id: number,
    file: File,
  ): Promise<Product | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("files", file);
      const response = await apiClient.post<ProductApiRecord>(
        `/products/${id}/upload-image`,
        formData,
        {
          timeout: 30000,
        },
      );
      clientCache.clear("products_");
      clientCache.clear(`product_${id}`);
      notifyCatalogUpdated();
      return response.data ? normalizeProduct(response.data) : null;
    } catch {
      return null;
    }
  },
  updateProductImage: async (
    id: number,
    imageUrl: string,
  ): Promise<Product | null> => {
    try {
      const response = await apiClient.put<ProductApiRecord>(`/products/${id}/image`, {
        imageUrl,
      });
      clientCache.clear("products_");
      clientCache.clear(`product_${id}_`);
      notifyCatalogUpdated();
      return response.data ? normalizeProduct(response.data) : null;
    } catch {
      return null;
    }
  },
};

// 2. Logistics & CBM Calculation Services (EXP-67)
export const logisticsApi = {
  calculateCbm: async (
    items: CbmItemInput[],
    requirePalletization = false,
    palletType: "STANDARD_1200X1000" | "EURO_1200X800" = "STANDARD_1200X1000",
  ): Promise<CbmCalculationResult> => {
    try {
      const response = await apiClient.post<CbmCalculationResult>(
        "/logistics/calculate-cbm",
        {
          items,
          requirePalletization,
          palletType,
        },
      );
      return response.data;
    } catch {
      // Offline client-side 3D Bin-Packing & CBM Optimization fallback
      const colors = [
        "#0E4B94",
        "#D97706",
        "#059669",
        "#7C3AED",
        "#DC2626",
        "#0284C7",
      ];
      let totalCartons = 0;
      let totalCbm = 0;
      let totalGw = 0;
      let totalPallets = 0;
      const isEuro = palletType === "EURO_1200X800";
      const palletUsableVol = isEuro ? 1.44 : 1.8;

      const stowSpecs: ItemStowageSpec[] = [];
      const itemBreakdowns = items.map((it, idx) => {
        const lenCm = it.cartonLengthCm || 60;
        const widCm = it.cartonWidthCm || 40;
        const hgtCm = it.cartonHeightCm || 35;
        const gwKg = it.grossWeightPerCartonKg || 11.2;
        const pcs = it.pcsPerCarton || 12;
        const cartons =
          it.totalCartons && it.totalCartons > 0
            ? it.totalCartons
            : Math.max(1, Math.ceil((it.quantity || 120) / pcs));

        const cbmPerCtn = (lenCm * widCm * hgtCm) / 1_000_000;
        const subCbm = Number((cbmPerCtn * cartons).toFixed(3));
        const subGw = Number((gwKg * cartons).toFixed(2));
        const estPallets = requirePalletization
          ? Math.max(1, Math.ceil(subCbm / palletUsableVol))
          : 0;

        totalCartons += cartons;
        totalCbm += subCbm;
        totalGw += subGw;
        totalPallets += estPallets;

        const name =
          it.itemName || it.productName || `Export Cargo #${it.productId}`;
        stowSpecs.push({
          productId: it.productId,
          itemName: name,
          cartonLengthM: lenCm / 100,
          cartonWidthM: widCm / 100,
          cartonHeightM: hgtCm / 100,
          weightKgPerCarton: gwKg,
          totalCartons: Math.min(cartons, 180),
          colorHex: colors[idx % colors.length],
        });

        return {
          productId: it.productId,
          itemName: name,
          totalCartons: cartons,
          cbmPerCarton: Number(cbmPerCtn.toFixed(4)),
          subtotalCbm: subCbm,
          subtotalGrossWeightKg: subGw,
          estimatedPallets: estPallets,
        };
      });

      totalCbm = Number(totalCbm.toFixed(3));
      totalGw = Number(totalGw.toFixed(2));

      const is20Ft = totalCbm <= 28 && totalGw <= 21600;
      const isLcl = totalCbm < 15 && totalGw < 10000;
      const capCbm = is20Ft ? 28 : 68;
      const maxKg = is20Ft ? 21600 : 26500;
      const suggestedType = isLcl
        ? "LCL Consolidation (Ghép cont hàng lẻ Cát Lái)"
        : is20Ft
          ? "1x20ft General Purpose (GP)"
          : "1x40ft High Cube (40HC)";

      const { stowedBoxes, centerOfGravity } = generateRealisticStowedBoxes(
        is20Ft ? "20GP" : "40HC",
        stowSpecs,
      );

      return {
        totalCartons,
        totalCbm,
        totalGrossWeightKg: totalGw,
        suggestedShipmentMode: isLcl
          ? "LCL (Less than Container Load)"
          : "FCL (Full Container Load)",
        suggestedContainerType: suggestedType,
        primaryRecommendedContainer: suggestedType,
        containerCapacityCbm: capCbm,
        volumeUtilizationPercentage: Number(
          ((totalCbm / capCbm) * 100).toFixed(1),
        ),
        weightLimitKg: maxKg,
        weightUtilizationPercentage: Number(
          ((totalGw / maxKg) * 100).toFixed(1),
        ),
        logisticsAdvice: isLcl
          ? `Lô hàng ${totalCbm} CBM (${totalCartons} thùng). Khuyến nghị ghép cont hàng lẻ LCL tại Cảng Cát Lái để tối ưu cước biển.`
          : `Đóng tối ưu trong ${suggestedType} (Đạt ${((totalCbm / capCbm) * 100).toFixed(1)}% thể tích, ${((totalGw / maxKg) * 100).toFixed(1)}% tải trọng).`,
        itemBreakdowns,
        palletSummary: requirePalletization
          ? {
              isPalletized: true,
              palletType: isEuro
                ? "Euro Pallet (1200 x 800 mm)"
                : "Standard Pallet (1200 x 1000 mm)",
              totalEstimatedPallets: totalPallets,
              maxPalletsFitIn20Ft: isEuro ? 11 : 10,
              maxPalletsFitIn40Ft: isEuro ? 24 : 21,
              palletAdvice:
                totalPallets <= (isEuro ? 11 : 10)
                  ? `Xếp vừa 1 container 20ft (${totalPallets} pallets).`
                  : `Khuyến nghị đóng container 40ft (${totalPallets} pallets).`,
            }
          : null,
        stowedBoxes,
        centerOfGravity,
      };
    }
  },
  getIncoterms: async () => {
    const cacheKey = "logistics_incoterms";
    const cached = clientCache.get(cacheKey, 15 * 60 * 1000);
    if (cached) return cached;
    const response = await apiClient.get("/logistics/incoterms");
    clientCache.set(cacheKey, response.data);
    return response.data;
  },
};

// 3. Inventory Services (EXP-77, EXP-78)
export const inventoryApi = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const cacheKey = "inventory_warehouses";
    const cached = clientCache.get<Warehouse[]>(cacheKey, 10 * 60 * 1000);
    if (cached) return cached;
    const response = await apiClient.get<Warehouse[]>("/inventory/warehouses");
    const list = Array.isArray(response.data) ? response.data : [];
    if (list.length > 0) {
      clientCache.set(cacheKey, list);
    }
    return list;
  },
  getStockBalance: async (
    productId: number,
  ): Promise<{
    productId: number;
    totalPhysicalStock: number;
    availableStock: number;
    warehouseBreakdown: Array<{
      warehouseId: number;
      warehouseName: string;
      currentStock: number;
    }>;
  }> => {
    const response = await apiClient.get(`/inventory/balance/${productId}`);
    return response.data;
  },
  getAllStockSummaries: async (): Promise<
    Array<{
      productId: number;
      baseSku: string;
      productName: string;
      totalPhysicalStock: number;
      availableStock: number;
      warehouseBreakdown: Array<{
        warehouseId: number;
        warehouseName: string;
        currentStock: number;
      }>;
    }>
  > => {
    const response = await apiClient.get("/inventory/admin/stock-summary");
    return Array.isArray(response.data) ? response.data : [];
  },
  recordTransaction: async (data: {
    warehouseId: number;
    productId: number;
    transactionType: string;
    quantityChange: number;
    referenceType: string;
    referenceId: string;
    note?: string;
  }) => {
    const response = await apiClient.post("/inventory/transactions", data);
    clientCache.clear();
    return response.data;
  },
  reserveStock: async (
    productId: number,
    warehouseId: number,
    quantity: number,
  ) => {
    const response = await apiClient.post("/inventory/reserve", {
      productId,
      warehouseId,
      quantity,
    });
    return response.data;
  },
};

// 4. RFQ Services (EXP-65)
export const rfqApi = {
  createRfq: async (rfq: RfqRequestDto): Promise<RfqRequestDto> => {
    const response = await apiClient.post<unknown>("/rfq", rfq);
    // The response interceptor unwraps ApiResponse<T>. Keep this endpoint
    // resilient when a proxy/client returns the envelope without unwrapping it.
    const body = response.data;
    const created =
      body && typeof body === "object" && "data" in body && body.data
        ? body.data
        : body;
    const rfqNumber = getRecordCode(created, [
      "rfqNumber",
      "rfqCode",
      "code",
      "id",
    ]);
    if (!created || typeof created !== "object" || !rfqNumber) {
      throw new Error("The server returned an invalid RFQ response.");
    }
    return { ...normalizeRfq(created), rfqNumber };
  },
  getMyRfqs: async (): Promise<RfqRequestDto[]> => {
    const summaries = await rfqApi.getMyRfqHistory();
    return Promise.all(
      summaries.map(async (summary) => {
        if (!summary.id) return normalizeRfq(summary);
        try {
          const detail = await rfqApi.getRfqById(summary.id);
          return {
            ...normalizeRfq(summary),
            ...detail,
            rfqNumber: detail.rfqNumber || summary.rfqNumber,
            companyName: detail.companyName || summary.companyName || "",
            items: Array.isArray(detail.items) ? detail.items : [],
          };
        } catch {
          // Keep the RFQ visible when its optional detail request fails.
          return normalizeRfq(summary);
        }
      }),
    );
  },
  getMyRfqHistory: async (): Promise<RfqHistoryEntry[]> => {
    const response = await apiClient.get<RfqHistoryEntry[]>("/rfq/my-rfqs");
    return Array.isArray(response.data)
      ? response.data.filter(Boolean).map((rfq) => ({
          ...rfq,
          rfqNumber:
            getRecordCode(rfq, ["rfqNumber", "rfqCode", "code", "id"]) ?? "",
        }))
      : [];
  },
  getRfqById: async (id: number): Promise<RfqRequestDto> => {
    const response = await apiClient.get<unknown>(`/rfq/${id}`);
    return normalizeRfq(response.data);
  },
};

// 5. Document Services (EXP-56, EXP-69 - QuestPDF Engine)
export const documentsApi = {
  generateProformaInvoice: async (rfqId: number) => {
    const response = await apiClient.post(
      `/documents/proforma-invoice/${rfqId}`,
    );
    return response.data;
  },
  generateCommercialInvoice: async (rfqId: number) => {
    const response = await apiClient.post(
      `/documents/commercial-invoice/${rfqId}`,
    );
    return response.data;
  },
  generatePackingList: async (rfqId: number) => {
    const response = await apiClient.post(`/documents/packing-list/${rfqId}`);
    return response.data;
  },
  getDocumentsByRfq: async (rfqId: number) => {
    const response = await apiClient.get(`/documents/rfq/${rfqId}`);
    return response.data;
  },
  downloadDocumentById: async (documentId: number): Promise<Blob> => {
    const response = await apiClient.get(`/documents/${documentId}/download`, {
      responseType: "blob",
    });
    return response.data;
  },
  downloadProformaInvoice: async (rfqId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `/documents/proforma-invoice/${rfqId}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
  downloadCommercialInvoice: async (orderOrRfqId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `/documents/commercial-invoice/${orderOrRfqId}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
  downloadPackingList: async (orderOrRfqId: number): Promise<Blob> => {
    const response = await apiClient.get(
      `/documents/packing-list/${orderOrRfqId}`,
      {
        responseType: "blob",
      },
    );
    return response.data;
  },
};

// 6. Orders Services (EXP-39 - OrdersController)
export const addressBookApi = {
  getMine: async (): Promise<CustomerAddress[]> => {
    const response = await apiClient.get<CustomerAddress[]>("/customeraddresses");
    return Array.isArray(response.data) ? response.data.filter(Boolean) : [];
  },
  create: async (address: SaveCustomerAddressRequest): Promise<CustomerAddress> => {
    const response = await apiClient.post<CustomerAddress>("/customeraddresses", address);
    return response.data;
  },
  update: async (id: number, address: SaveCustomerAddressRequest): Promise<CustomerAddress> => {
    const response = await apiClient.put<CustomerAddress>(`/customeraddresses/${id}`, address);
    return response.data;
  },
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/customeraddresses/${id}`);
  },
};

export const ordersApi = {
  createOrder: async (data: {
    recipientName: string;
    recipientPhone: string;
    destinationCountryCode: string;
    shippingAddressLine: string;
    postalCode: string;
    currencyCode?: string;
    items: Array<{ productId: number; quantity: number }>;
  }): Promise<{ id?: number; orderNumber: string; [key: string]: unknown }> => {
    const response = await apiClient.post<Record<string, unknown>>(
      "/orders",
      data,
    );
    const orderCode = getRecordCode(response.data, [
      "orderNumber",
      "orderCode",
      "code",
      "id",
    ]);
    const rawId = response.data?.id;
    const id = typeof rawId === "number" ? rawId : Number(rawId);
    return {
      ...response.data,
      id: Number.isFinite(id) && id > 0 ? id : undefined,
      orderNumber: orderCode ?? "",
    };
  },
  getMyOrders: async (): Promise<OrderHistoryEntry[]> => {
    const response =
      await apiClient.get<OrderHistoryEntry[]>("/orders/my-orders");
    return Array.isArray(response.data)
      ? response.data.filter(Boolean).map((order) => ({
          ...order,
          orderCode:
            getRecordCode(order, ["orderCode", "orderNumber", "code", "id"]) ??
            "",
          orderNumber:
            getRecordCode(order, ["orderNumber", "orderCode", "code", "id"]) ??
            "",
          status: order.orderStatus,
          items: Array.isArray(order.items) ? order.items : [],
        }))
      : [];
  },
  getAllOrders: async (): Promise<OrderHistoryEntry[]> => {
    const response =
      await apiClient.get<OrderHistoryEntry[]>("/orders/admin/all");
    return Array.isArray(response.data)
      ? response.data.filter(Boolean).map((order) => ({
          ...order,
          orderNumber:
            getRecordCode(order, ["orderNumber", "orderCode", "code", "id"]) ??
            "",
          status: order.orderStatus,
          items: Array.isArray(order.items) ? order.items : [],
        }))
      : [];
  },
  getOrderById: async (id: number) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id: number, status: string) => {
    const response = await apiClient.put(`/orders/${id}/status`, { status });
    return response.data;
  },
};

// 7. Payments Services (EXP-40 -> 44, EXP-60 -> 63 - PaymentsController)
export const paymentsApi = {
  createStripePaymentIntent: async (
    orderId: number,
    amount?: number,
    currency = "USD",
  ) => {
    const response = await apiClient.post("/payments/b2c/create-intent", {
      orderId,
      amount,
      currency,
    });
    return response.data;
  },
  uploadBankSlipFile: async (
    file: File,
  ): Promise<{ fileUrl: string; fileName: string } | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await apiClient.post<{
        fileUrl: string;
        fileName: string;
      }>("/payments/b2b/upload-slip-file", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 10000,
      });
      return response.data;
    } catch {
      return null;
    }
  },
  submitBankSlip: async (data: {
    rfqId: number;
    paymentStage: string;
    paymentMethod: string;
    amountUsd: number;
    swiftReference: string;
    bankSlipFileUrl: string;
  }): Promise<B2BPaymentSlip> => {
    const response = await apiClient.post<B2BPaymentSlip>(
      "/payments/b2b/submit-slip",
      data,
    );
    return response.data;
  },
  uploadBankSlip: async (data: {
    rfqId: number;
    amount: number;
    currency?: string;
    bankReference: string;
    proofFileUrl: string;
    paymentStage?: string;
    paymentMethod?: string;
  }): Promise<B2BPaymentSlip> => {
    const response = await apiClient.post<B2BPaymentSlip>(
      "/payments/b2b/submit-slip",
      {
        rfqId: data.rfqId,
        paymentStage: data.paymentStage || "DEPOSIT_30",
        paymentMethod: data.paymentMethod || "T_T",
        amountUsd: data.amount,
        swiftReference: data.bankReference,
        bankSlipFileUrl: data.proofFileUrl,
      },
    );
    return response.data;
  },
  verifyBankSlip: async (
    dataOrId:
      | { paymentId: number; isApproved: boolean; rejectionReason?: string }
      | number,
    isApproved?: boolean,
    rejectionReason?: string,
  ): Promise<B2BPaymentSlip> => {
    const payload =
      typeof dataOrId === "number"
        ? {
            paymentId: dataOrId,
            isApproved: Boolean(isApproved),
            rejectionReason,
          }
        : dataOrId;
    const response = await apiClient.post<B2BPaymentSlip>(
      "/payments/b2b/verify-deposit",
      payload,
    );
    return response.data;
  },
  getB2BPaymentsByRfq: async (rfqId: number): Promise<B2BPaymentSlip[]> => {
    try {
      const response = await apiClient.get<B2BPaymentSlip[]>(
        `/payments/b2b/rfq/${rfqId}`,
      );
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },
  getAllB2BPayments: async (status?: string): Promise<B2BPaymentSlip[]> => {
    const response = await apiClient.get<B2BPaymentSlip[]>(
      "/payments/b2b/all",
      {
        params: { status },
      },
    );
    return Array.isArray(response.data) ? response.data : [];
  },
};

// 8. Pricing & Incoterms Calculation Services (EXP-47, EXP-51)
export const pricingApi = {
  getExchangeRates: async (): Promise<ExchangeRateInfo[]> => {
    const cacheKey = "pricing_exchange_rates";
    const cached = clientCache.get<ExchangeRateInfo[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    try {
      const response = await apiClient.get<ExchangeRateInfo[]>(
        "/pricing/exchange-rates",
      );
      const list = Array.isArray(response.data) ? response.data : [];
      if (list.length > 0) {
        clientCache.set(cacheKey, list);
      }
      return list;
    } catch {
      return [];
    }
  },
  calculateTierPrice: async (data: {
    productId: number;
    quantity: number;
    targetCurrency?: string;
  }) => {
    const response = await apiClient.post("/pricing/calculate-tier", data);
    return response.data;
  },
  calculateIncoterms: async (data: {
    productId: number;
    quantity: number;
    incotermCode: string;
    destinationPort: string;
  }) => {
    const response = await apiClient.post("/pricing/calculate-incoterms", data);
    return response.data;
  },
  calculateLandedCost: async (
    data: LandedCostRequest,
  ): Promise<LandedCostResult> => {
    try {
      const response = await apiClient.post<LandedCostResult>(
        "/pricing/calculate-landed-cost",
        data,
      );
      return response.data;
    } catch {
      // Client-side fallback matching Backend IncotermsCalculationService.CalculateLandedCostAsync
      const qty = Math.max(1, data.quantity);
      const unitPrice = data.unitPriceUsd > 0 ? data.unitPriceUsd : 19.5;
      const fobValue = Number((unitPrice * qty).toFixed(2));
      const incoterm = (data.incotermCode || "FOB").toUpperCase();
      const countryCode = (data.destinationCountryCode || "JPN").toUpperCase();
      const hsCode = data.hsCode || "6404.11.00";
      const hsPrefix = hsCode.slice(0, 4);

      const originLocalCharges =
        incoterm === "EXW"
          ? Number(Math.max(220, data.totalCbm * 14).toFixed(2))
          : 0;
      const baseRatePerCbm =
        countryCode === "JPN" || countryCode === "SGP" || countryCode === "KOR"
          ? 38
          : countryCode === "AUS"
            ? 52
            : 68;
      const oceanFreight = Number(
        Math.max(350, data.totalCbm * baseRatePerCbm).toFixed(2),
      );
      const marineInsurance = Number(
        ((fobValue + originLocalCharges + oceanFreight) * 1.1 * 0.0035).toFixed(
          2,
        ),
      );
      const cifValue = Number(
        (
          fobValue +
          originLocalCharges +
          oceanFreight +
          marineInsurance
        ).toFixed(2),
      );

      const baseMfn =
        hsPrefix === "6404"
          ? 12.5
          : hsPrefix === "4402"
            ? 5.0
            : hsPrefix === "4417"
              ? 6.0
              : hsPrefix === "0801"
                ? 4.5
                : 6.5;

      const scheduleMap: Record<
        string,
        {
          name: string;
          fta: string;
          co: string;
          mfn: number;
          pref: number;
          vatName: string;
          vatRate: number;
          note: string;
        }
      > = {
        JPN: {
          name: "Japan (Nhật Bản)",
          fta: "VJEPA / CPTPP / RCEP",
          co: "C/O Form JV hoặc CPTPP",
          mfn: hsPrefix === "6404" ? 10.0 : baseMfn,
          pref: 0.0,
          vatName: "JCT (Japan Consumption Tax)",
          vatRate: 10.0,
          note: "Khai báo AFR (Advance Filing Rules) 24 giờ trước khi tàu rời cảng Cát Lái",
        },
        DEU: {
          name: "Germany - EU (Đức)",
          fta: "EVFTA (EU-Vietnam FTA)",
          co: "C/O Form EUR.1 (hoặc REX)",
          mfn: hsPrefix === "6404" ? 16.9 : baseMfn,
          pref: 0.0,
          vatName: "EU Import VAT (Einfuhrumsatzsteuer)",
          vatRate: 19.0,
          note: "Khai báo ICS2 (Import Control System 2) & Mã số EORI Châu Âu",
        },
        NLD: {
          name: "Netherlands - EU (Hà Lan)",
          fta: "EVFTA (EU-Vietnam FTA)",
          co: "C/O Form EUR.1 (hoặc REX)",
          mfn: hsPrefix === "6404" ? 16.9 : baseMfn,
          pref: 0.0,
          vatName: "NL Import BTW (Article 23 Deferment Eligible)",
          vatRate: 21.0,
          note: "Khai báo ICS2 & Ưu đãi hoàn/hoãn thuế VAT nhập khẩu Điều 23 tại Cảng Rotterdam",
        },
        GBR: {
          name: "United Kingdom (Vương quốc Anh)",
          fta: "UKVFTA (UK-Vietnam FTA)",
          co: "C/O Form EUR.1 UK",
          mfn: hsPrefix === "6404" ? 16.0 : baseMfn,
          pref: 0.0,
          vatName: "UK Import VAT",
          vatRate: 20.0,
          note: "Chứng nhận hợp chuẩn UKCA & Tờ khai CDS Hải quan Anh",
        },
        SGP: {
          name: "Singapore (ASEAN)",
          fta: "ATIGA (ASEAN Trade in Goods)",
          co: "C/O Form D điện tử (e-Form D ASW)",
          mfn: 0.0,
          pref: 0.0,
          vatName: "Singapore GST",
          vatRate: 9.0,
          note: "Truyền tự động C/O e-Form D qua Cơ chế Một cửa ASEAN (ASW)",
        },
        AUS: {
          name: "Australia (Úc)",
          fta: "AANZFTA / CPTPP / RCEP",
          co: "C/O Form AANZ",
          mfn: hsPrefix === "6404" ? 5.0 : baseMfn,
          pref: 0.0,
          vatName: "Australia GST",
          vatRate: 10.0,
          note: "Khai báo An toàn Sinh học DAFF Biosecurity (BICON) nghiêm ngặt",
        },
        KOR: {
          name: "South Korea (Hàn Quốc)",
          fta: "VKFTA / RCEP",
          co: "C/O Form KV",
          mfn: hsPrefix === "6404" ? 13.0 : baseMfn,
          pref: 0.0,
          vatName: "Korea Import VAT",
          vatRate: 10.0,
          note: "Chứng nhận KC Mark / Kiểm định KFDA cho hàng nông sản & tiêu dùng",
        },
        USA: {
          name: "United States (Hoa Kỳ)",
          fta: "US-Vietnam BTA (Normal Trade Relations / MFN)",
          co: "C/O Form B (VCCI)",
          mfn: hsPrefix === "6404" ? 12.5 : hsPrefix === "0801" ? 0.0 : baseMfn,
          pref:
            hsPrefix === "6404" ? 12.5 : hsPrefix === "0801" ? 0.0 : baseMfn,
          vatName: "US Federal Import VAT (Exempt)",
          vatRate: 0.0,
          note: "Khai báo an ninh ISF 10+2 trước 24h & Đăng ký FDA Prior Notice",
        },
      };

      const sched = scheduleMap[countryCode] || scheduleMap.USA;
      const isFtaApplied = data.applyFtaCertificate && sched.pref < sched.mfn;
      const appliedDutyRate = isFtaApplied ? sched.pref : sched.mfn;

      const mfnDutyUsd = Number(((cifValue * sched.mfn) / 100).toFixed(2));
      const estimatedDutyUsd = Number(
        ((cifValue * appliedDutyRate) / 100).toFixed(2),
      );
      const ftaSavingsUsd = Number(
        Math.max(0, mfnDutyUsd - estimatedDutyUsd).toFixed(2),
      );

      const customsFee =
        countryCode === "USA"
          ? Number(
              (
                Math.min(614.35, Math.max(31.67, fobValue * 0.003464)) +
                fobValue * 0.00125 +
                125
              ).toFixed(2),
            )
          : 145;

      const destLocalUsd = Number(
        Math.max(280, data.totalCbm * 18.5).toFixed(2),
      );
      const importVatUsd = Number(
        (((cifValue + estimatedDutyUsd) * sched.vatRate) / 100).toFixed(2),
      );

      const totalExclVat = Number(
        (cifValue + estimatedDutyUsd + customsFee + destLocalUsd).toFixed(2),
      );
      const totalInclVat = Number((totalExclVat + importVatUsd).toFixed(2));
      const perUnitExclVat = Number((totalExclVat / qty).toFixed(2));
      const perUnitInclVat = Number((totalInclVat / qty).toFixed(2));
      const suggestedRetail = Number((perUnitExclVat * 2.15).toFixed(2));
      const marginPct =
        suggestedRetail > 0
          ? Number(
              (
                ((suggestedRetail - perUnitExclVat) / suggestedRetail) *
                100
              ).toFixed(1),
            )
          : 45;

      const complianceNotes: string[] = [];
      if (hsPrefix === "4402" || hsPrefix === "4417") {
        complianceNotes.push(
          "Chứng thư Hun trùng Quốc tế ISPM-15 (Fumigation Certificate)",
        );
      }
      if (hsPrefix === "4402") {
        complianceNotes.push(
          "Báo cáo kiểm nghiệm Self-Heating Test (IMDG Code Non-DG) & MSDS",
        );
      }
      if (hsPrefix === "0801") {
        complianceNotes.push(
          "Chứng nhận Kiểm dịch Thực vật (Phytosanitary Certificate) & HACCP",
        );
      }
      if (hsPrefix === "6404" || hsPrefix === "3919" || hsPrefix === "3920") {
        complianceNotes.push(
          "Chứng nhận hợp chuẩn Hóa chất & Vật liệu (REACH / RoHS / Prop 65)",
        );
      }
      complianceNotes.push(sched.note);

      return {
        hsCode,
        destinationCountryCode: countryCode,
        destinationCountryName: sched.name,
        portOfLoading: data.portOfLoading,
        portOfDischarge: data.portOfDischarge,
        incotermCode: incoterm,
        quantity: qty,
        unitPriceUsd: unitPrice,
        fobGoodsValueUsd: fobValue,
        originLocalChargesUsd: originLocalCharges,
        oceanFreightUsd: oceanFreight,
        marineInsuranceUsd: marineInsurance,
        cifValueUsd: cifValue,
        applicableFtaCode: sched.fta,
        requiredCertificateOfOrigin: sched.co,
        isFtaApplied,
        mfnDutyRatePercent: sched.mfn,
        ftaPreferentialDutyRatePercent: sched.pref,
        appliedDutyRatePercent: appliedDutyRate,
        mfnDutyAmountUsd: mfnDutyUsd,
        estimatedImportDutyUsd: estimatedDutyUsd,
        ftaDutySavingsUsd: ftaSavingsUsd,
        customsProcessingFeeUsd: customsFee,
        importVatName: sched.vatName,
        importVatRatePercent: sched.vatRate,
        estimatedImportVatUsd: importVatUsd,
        destinationLocalAndInlandUsd: destLocalUsd,
        totalLandedCostExcludingVatUsd: totalExclVat,
        totalLandedCostUsd: totalInclVat,
        landedCostPerUnitExcludingVatUsd: perUnitExclVat,
        landedCostPerUnitUsd: perUnitInclVat,
        suggestedRetailPriceUsd: suggestedRetail,
        estimatedGrossMarginPercent: marginPct,
        complianceNotes,
      };
    }
  },
};

// 9. Admin Backoffice Services (EXP-50, EXP-74 - CompanyManagement & Admin RFQs)
export const adminApi = {
  getPendingCompanies: async (): Promise<CompanyProfileDto[]> => {
    const response = await apiClient.get<CompanyProfileDto[]>(
      "/admin/companies/pending",
    );
    return Array.isArray(response.data) ? response.data : [];
  },
  verifyCompany: async (
    companyId: number,
    isApproved: boolean,
    initialCreditLimit = 50000,
    rejectionReason?: string,
  ): Promise<CompanyProfileDto> => {
    const response = await apiClient.put<CompanyProfileDto>(
      `/admin/companies/${companyId}/verify`,
      {
        isApproved,
        initialCreditLimit,
        rejectionReason,
      },
    );
    return response.data;
  },
  getAllRfqs: async (status?: string) => {
    const response = await apiClient.get("/rfq", { params: { status } });
    return Array.isArray(response.data) ? response.data.filter(Boolean) : [];
  },
  submitOfficialQuotation: async (
    rfqId: number,
    data: {
      priceValidityUntil?: string;
      customOceanFreightCostUsd?: number;
      customMarineInsuranceCostUsd?: number;
      itemPrices: Array<{ rfqItemId: number; quotedUnitPriceUsd: number }>;
      salesNote?: string;
    },
  ) => {
    const response = await apiClient.post(`/rfq/${rfqId}/quote`, data);
    return response.data;
  },
};

// 10. Sales Contracts & B2B Negotiation Services (E-Contract)
interface ContractApiResponse<T> {
  data?: T;
  success?: boolean;
}

export const contractsApi = {
  getContractById: async (id: number): Promise<SalesContract> => {
    const response = await apiClient.get<ContractApiResponse<SalesContract>>(
      `/contracts/${id}`,
    );
    return response.data?.data ?? (response.data as unknown as SalesContract);
  },
  getContractByRfqId: async (rfqId: number): Promise<SalesContract | null> => {
    try {
      const response = await apiClient.get<ContractApiResponse<SalesContract>>(
        `/contracts/by-rfq/${rfqId}`,
      );
      return response.data?.data ?? (response.data as unknown as SalesContract);
    } catch {
      return null;
    }
  },
  generateContractFromRfq: async (rfqId: number): Promise<SalesContract> => {
    const response = await apiClient.post<ContractApiResponse<SalesContract>>(
      `/contracts/generate-from-rfq/${rfqId}`,
    );
    return response.data?.data ?? (response.data as unknown as SalesContract);
  },
  signContractSeller: async (
    id: number,
    data: SignContractRequest,
  ): Promise<SalesContract> => {
    const response = await apiClient.post<ContractApiResponse<SalesContract>>(
      `/contracts/${id}/sign-seller`,
      data,
    );
    return response.data?.data ?? (response.data as unknown as SalesContract);
  },
  signContractBuyer: async (
    id: number,
    data: SignContractRequest,
  ): Promise<SalesContract> => {
    const response = await apiClient.post<ContractApiResponse<SalesContract>>(
      `/contracts/${id}/sign-buyer`,
      data,
    );
    return response.data?.data ?? (response.data as unknown as SalesContract);
  },
  downloadContractPdf: async (id: number): Promise<Blob> => {
    const response = await apiClient.get(`/contracts/${id}/download-pdf`, {
      responseType: "blob",
    });
    return response.data;
  },
  submitCounterOffer: async (
    rfqId: number,
    data: SubmitCounterOfferRequest,
    role = "BUYER",
  ): Promise<RfqCounterOffer> => {
    const response = await apiClient.post<ContractApiResponse<RfqCounterOffer>>(
      `/contracts/rfq/${rfqId}/counter-offer`,
      data,
      {
        params: { role },
      },
    );
    return response.data?.data ?? (response.data as unknown as RfqCounterOffer);
  },
  getCounterOffers: async (rfqId: number): Promise<RfqCounterOffer[]> => {
    try {
      const response = await apiClient.get<
        ContractApiResponse<RfqCounterOffer[]>
      >(`/contracts/rfq/${rfqId}/counter-offers`);
      const offers = response.data?.data ?? response.data;
      return Array.isArray(offers) ? offers : [];
    } catch {
      return [];
    }
  },
  acceptCounterOffer: async (
    rfqId: number,
    offerId: number,
  ): Promise<boolean> => {
    const response = await apiClient.post<ContractApiResponse<boolean>>(
      `/contracts/rfq/${rfqId}/counter-offer/${offerId}/accept`,
    );
    return response.data?.data ?? true;
  },
};
