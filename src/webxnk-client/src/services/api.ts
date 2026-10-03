import axios from "axios";
import { Product, Category, Warehouse, InventoryBalance, CbmItemInput, CbmCalculationResult, RfqRequestDto } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 3000,
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

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("webxnk_token");
      }
    }
    return Promise.reject(error);
  }
);

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
    try {
      const response = await apiClient.get<Category[]>("/categories");
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
    const response = await apiClient.get("/logistics/incoterms");
    return response.data;
  },
};

// 3. Inventory Services (EXP-77, EXP-78)
export const inventoryApi = {
  getWarehouses: async (): Promise<Warehouse[]> => {
    const response = await apiClient.get<Warehouse[]>("/inventory/warehouses");
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
    const response = await apiClient.get(`/documents/proforma-invoice/${rfqId}`, {
      responseType: "blob",
    });
    return response.data;
  },
  downloadCommercialInvoice: async (orderId: number) => {
    const response = await apiClient.get(`/documents/commercial-invoice/${orderId}`, {
      responseType: "blob",
    });
    return response.data;
  },
  downloadPackingList: async (orderId: number) => {
    const response = await apiClient.get(`/documents/packing-list/${orderId}`, {
      responseType: "blob",
    });
    return response.data;
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

// 9. Admin Backoffice Services (EXP-50, EXP-74 - CompanyManagement & Admin RFQs)
export const adminApi = {
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

