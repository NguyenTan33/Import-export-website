import axios from "axios";
import {
  Product,
  Category,
  CbmCalculationResult,
  RfqRequestDto,
  Warehouse,
  InventoryBalance,
} from "@/types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Interceptor: Gắn JWT Token vào Authorization Header nếu đã đăng nhập
apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("webxnk_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: Tự động unwrap ApiResponse<T> ({ success, data, message })
apiClient.interceptors.response.use(
  (response) => {
    if (
      response.data &&
      typeof response.data === "object" &&
      "data" in response.data &&
      "success" in response.data
    ) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Client In-Memory Caching để tối ưu tốc độ phản hồi < 10ms
interface CacheItem<T> {
  data: T;
  timestamp: number;
}
const cacheStore = new Map<string, CacheItem<unknown>>();

export const clientCache = {
  get: <T>(key: string, ttlMs: number = 60000): T | null => {
    const item = cacheStore.get(key) as CacheItem<T> | undefined;
    if (!item) return null;
    if (Date.now() - item.timestamp > ttlMs) {
      cacheStore.delete(key);
      return null;
    }
    return item.data;
  },
  set: <T>(key: string, data: T): void => {
    cacheStore.set(key, { data, timestamp: Date.now() });
  },
  invalidate: (pattern?: string): void => {
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
    const cacheKey = `products_${categoryId ?? "all"}_${keyword ?? "none"}`;
    const cached = clientCache.get<Product[]>(cacheKey, 60 * 1000);
    if (cached) return cached;

    try {
      const response = await apiClient.get<Product[]>("/products", {
        params: { categoryId, keyword },
      });
      const items = Array.isArray(response.data) ? response.data : [];
      if (items.length > 0) {
        clientCache.set(cacheKey, items);
      }
      return items;
    } catch {
      return [];
    }
  },
  getProductById: async (id: number): Promise<Product | null> => {
    const cacheKey = `product_${id}`;
    const cached = clientCache.get<Product>(cacheKey, 3 * 60 * 1000);
    if (cached) return cached;

    try {
      const response = await apiClient.get<Product>(`/products/${id}`);
      if (response.data) {
        clientCache.set(cacheKey, response.data);
      }
      return response.data;
    } catch {
      return null;
    }
  },
  getCachedProductById: (id: number): Product | null => {
    return clientCache.get<Product>(`product_${id}`, 5 * 60 * 1000);
  },
  getCategories: async (): Promise<Category[]> => {
    const cacheKey = "catalog_categories";
    const cached = clientCache.get<Category[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    try {
      const response = await apiClient.get<Category[]>("/categories");
      const list = Array.isArray(response.data) ? response.data : [];
      if (list.length > 0) {
        clientCache.set(cacheKey, list);
      }
      return list;
    } catch {
      return [];
    }
  },
};

// 2. Logistics & Container CBM Services (EXP-53)
export const logisticsApi = {
  calculateCbm: async (payload: {
    productId: number;
    quantity: number;
    containerType: "20GP" | "40GP" | "40HC";
    customCartonLengthCm?: number;
    customCartonWidthCm?: number;
    customCartonHeightCm?: number;
    customPcsPerCarton?: number;
  }): Promise<CbmCalculationResult> => {
    const response = await apiClient.post<CbmCalculationResult>(
      "/logistics/cbm-calculator",
      payload
    );
    return response.data;
  },
};

// 3. Multi-Warehouse & Inventory Services (EXP-77, EXP-78)
export const inventoryApi = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const cacheKey = "inventory_warehouses";
    const cached = clientCache.get<Warehouse[]>(cacheKey, 5 * 60 * 1000);
    if (cached) return cached;
    try {
      const response = await apiClient.get<Warehouse[]>("/inventory/warehouses");
      const list = Array.isArray(response.data) ? response.data : [];
      if (list.length > 0) {
        clientCache.set(cacheKey, list);
      }
      return list;
    } catch {
      return [];
    }
  },
  getStockBalance: async (productId: number, warehouseId?: number): Promise<InventoryBalance[]> => {
    const response = await apiClient.get<InventoryBalance[]>(`/inventory/balance/${productId}`, {
      params: { warehouseId },
    });
    return response.data;
  },
};

// 4. B2B RFQ Portal Services (EXP-39, EXP-45, EXP-54)
export const rfqApi = {
  createRfq: async (payload: RfqRequestDto) => {
    const response = await apiClient.post("/rfq", payload);
    return response.data;
  },
  getMyRfqs: async () => {
    try {
      const response = await apiClient.get("/rfq/my-rfqs");
      return response.data;
    } catch {
      return [];
    }
  },
  getRfqById: async (id: number) => {
    const response = await apiClient.get(`/rfq/${id}`);
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

// 6. Orders Services (EXP-39 - OrdersController)
export const ordersApi = {
  createOrder: async (data: {
    shippingAddress: string;
    city: string;
    country: string;
    postalCode: string;
    phone: string;
    notes?: string;
    items: Array<{ productId: number; quantity: number }>;
  }) => {
    const response = await apiClient.post("/orders", data);
    return response.data;
  },
  getMyOrders: async () => {
    const response = await apiClient.get("/orders/my-orders");
    return response.data;
  },
  getOrderById: async (id: number) => {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },
  updateOrderStatus: async (id: number, status: string, trackingNumber?: string) => {
    const response = await apiClient.put(`/orders/${id}/status`, { status, trackingNumber });
    return response.data;
  },
};

// 7. Payments Services (EXP-40 -> 44, EXP-60 -> 63 - PaymentsController)
export const paymentsApi = {
  createStripePaymentIntent: async (orderId: number) => {
    const response = await apiClient.post("/payments/b2c/create-intent", { orderId });
    return response.data;
  },
  uploadBankSlip: async (data: {
    rfqId: number;
    amount: number;
    currency: string;
    bankReference: string;
    proofFileUrl: string;
    notes?: string;
  }) => {
    const response = await apiClient.post("/payments/b2b/upload-slip", data);
    return response.data;
  },
  verifyBankSlip: async (data: {
    paymentId: number;
    isApproved: boolean;
    verificationNotes?: string;
  }) => {
    const response = await apiClient.post("/payments/b2b/verify-slip", data);
    return response.data;
  },
};

// 8. Pricing & Incoterms Calculation Services (EXP-47, EXP-51)
export const pricingApi = {
  calculateIncoterms: async (data: {
    productId: number;
    quantity: number;
    incotermCode: string;
    destinationPort: string;
  }) => {
    const response = await apiClient.post("/pricing/calculate-incoterms", data);
    return response.data;
  },
};

// 9. Tracking & Vessel Milestones Services (EXP-72 to EXP-75)
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

// 10. Admin Backoffice & BI Analytics Services (EXP-50, EXP-74, EXP-90 to EXP-93)
export const adminApi = {
  getAnalytics: async () => {
    try {
      const response = await apiClient.get("/admin/analytics");
      return response.data;
    } catch {
      return null;
    }
  },
  getPendingCompanies: async () => {
    const response = await apiClient.get("/admin/companies/pending");
    return response.data;
  },
  verifyCompany: async (companyId: number, isVerified: boolean, notes?: string) => {
    const response = await apiClient.post(`/admin/companies/${companyId}/verify`, { isVerified, notes });
    return response.data;
  },
  getAllRfqs: async (status?: string) => {
    const response = await apiClient.get("/rfq/admin/all", { params: { status } });
    return response.data;
  },
  submitOfficialQuotation: async (rfqId: number, data: {
    quotedPricePerUnit: number;
    validityDays: number;
    notes?: string;
  }) => {
    const response = await apiClient.post(`/rfq/${rfqId}/official-quotation`, data);
    return response.data;
  },
};
