export interface CategoryTranslation {
  languageCode: string;
  name: string;
  description?: string;
}

export interface Category {
  id: number;
  slug: string;
  translations: CategoryTranslation[];
}

export interface ExportPackaging {
  cartonLengthCm: number;
  cartonWidthCm: number;
  cartonHeightCm: number;
  netWeightKg: number;
  grossWeightKg: number;
  pcsPerCarton: number;
}

export interface PriceTier {
  id?: number;
  minQuantity: number;
  maxQuantity?: number | null;
  unitPriceUsd: number;
  discountPercentage: number;
}

export interface ProductTranslation {
  languageCode: string;
  name: string;
  shortDescription?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  baseSku: string;
  hsCode: string;
  countryOfOrigin: string;
  defaultRetailPriceUsd: number;
  specificationsJson?: string;
  isActive: boolean;
  translations: ProductTranslation[];
  exportPackaging?: ExportPackaging;
  priceTiers: PriceTier[];
}

export interface Warehouse {
  id: number;
  code: string;
  name: string;
  warehouseType: string;
  address: string;
  isActive: boolean;
}

export interface InventoryBalance {
  warehouseId: number;
  warehouseName: string;
  warehouseCode: string;
  productId: number;
  productSku: string;
  availableQuantity: number;
  reservedQuantity: number;
}

export interface CbmItemInput {
  productId: number;
  quantity: number;
  productName?: string;
  sku?: string;
}

export interface CbmCalculationResult {
  totalCartons: number;
  totalCbm: number;
  totalGrossWeightKg: number;
  suggestedContainerType: string;
  containerCapacityCbm: number;
  volumeUtilizationPercentage: number;
  weightLimitKg: number;
  weightUtilizationPercentage: number;
}

export interface RfqItemDto {
  productId: number;
  productName?: string;
  sku?: string;
  quantity: number;
  targetPriceUsd?: number;
  quotedUnitPriceUsd?: number;
  calculatedCbm?: number;
  customRequirements?: string;
}

export interface RfqRequestDto {
  id?: number;
  rfqNumber?: string;
  companyName?: string;
  incotermCode: string;
  portOfLoading: string;
  portOfDischarge: string;
  targetDeliveryDate: string;
  priceValidityUntil?: string;
  status?: string;
  totalCbm?: number;
  totalGrossWeightKg?: number;
  suggestedContainerType?: string;
  oceanFreightCostUsd?: number;
  marineInsuranceCostUsd?: number;
  totalQuotedAmountUsd?: number;
  items: RfqItemDto[];
}

export interface UserProfile {
  id: number;
  email: string;
  fullName: string;
  phoneNumber?: string;
  roles: string[];
  companyName?: string;
}
