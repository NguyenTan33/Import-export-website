import axios from "axios";
import { Product, Category, Warehouse, InventoryBalance, CbmItemInput, CbmCalculationResult, RfqRequestDto } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request Interceptor: Attach JWT Bearer Token if present
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("webxnk_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Unwrap ApiResponse<T> envelope automatically
apiClient.interceptors.response.use(
  (response) => {
    if (response.data && typeof response.data === "object" && "data" in response.data && "success" in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("webxnk_token");
      }
    }
    return Promise.reject(error);
  }
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
    for (const key of cacheStore.keys()) {
      if (key.includes(pattern)) {
        cacheStore.delete(key);
      }
    }
  },
};

// 1. Catalog & Product Services
export const catalogApi = {
  getProducts: async (categoryId?: number, keyword?: string): Promise<Product[]> => {
    try {
      const response = await apiClient.get<Product[]>("/products", {
        params: { categoryId, keyword },
      });
      return response.data;
    } catch {
      return [];
    }
  },
  getProductById: async (id: number): Promise<Product | null> => {
    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      return response.data;
    } catch {
      return null;
    }
  },
  getCategories: async (): Promise<Category[]> => {
    const cacheKey = "catalog_categories";
    const cached = clientCache.get<Category[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    try {
      const response = await apiClient.get<Category[]>("/categories");
      clientCache.set(cacheKey, response.data);
      return response.data;
    } catch {
      return [];
    }
  },
};

// 2. Logistics & CBM Calculation Services (EXP-67)
export const logisticsApi = {
  calculateCbm: async (items: CbmItemInput[]): Promise<CbmCalculationResult> => {
    const response = await apiClient.post<CbmCalculationResult>("/logistics/calculate-cbm", { items });
    return response.data;
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
    const cached = clientCache.get<Warehouse[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    const response = await apiClient.get<Warehouse[]>("/inventory/warehouses");
    clientCache.set(cacheKey, response.data);
    return response.data;
  },
  getStockBalance: async (productId: number, warehouseId?: number): Promise<InventoryBalance[]> => {
    const response = await apiClient.get<InventoryBalance[]>(`/inventory/balance/${productId}`, {
      params: { warehouseId },
    });
    return response.data;
  },
  reserveStock: async (productId: number, warehouseId: number, quantity: number) => {
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
  createRfq: async (rfq: RfqRequestDto) => {
    const response = await apiClient.post("/rfq", rfq);
    return response.data;
  },
  getMyRfqs: async (): Promise<RfqRequestDto[]> => {
    const response = await apiClient.get<RfqRequestDto[]>("/rfq/my-rfqs");
    return response.data;
  },
  getRfqById: async (id: number): Promise<RfqRequestDto> => {
    const response = await apiClient.get<RfqRequestDto>(`/rfq/${id}`);
    return response.data;
  },
};

// 5. Document Services (EXP-56, EXP-69 - QuestPDF Engine)
export const documentsApi = {
  downloadProformaInvoice: async (rfqId: number) => {
    const response = await apiClient.get(`/documents/proforma-invoice/${rfqId}/download`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
  downloadCommercialInvoice: async (orderId: number) => {
    const response = await apiClient.get(`/documents/commercial-invoice/${orderId}/download`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
  downloadPackingList: async (orderId: number) => {
    const response = await apiClient.get(`/documents/packing-list/${orderId}/download`, {
      responseType: "blob",
    });
    return response.data as Blob;
  },
};

// 6. Tracking & Vessel Milestones Services (EXP-72 to EXP-75)
export const trackingApi = {
  getShipment: async (blOrBookingNumber: string) => {
    try {
      const response = await apiClient.get(`/tracking/${encodeURIComponent(blOrBookingNumber)}`);
      return response.data;
    } catch {
      return null;
    }
  },
  getActiveShipments: async () => {
    try {
      const response = await apiClient.get("/tracking/active");
      return response.data;
    } catch {
      return [];
    }
  },
};

// 7. Admin ERP & BI Analytics Services (EXP-90 to EXP-93)
export const adminApi = {
  getAnalytics: async () => {
    try {
      const response = await apiClient.get("/admin/analytics");
      return response.data;
    } catch {
      return null;
    }
  },
};
