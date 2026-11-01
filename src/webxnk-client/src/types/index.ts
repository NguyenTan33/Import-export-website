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
  fullDescription?: string;
}

export interface Product {
  id: number;
  categoryId: number;
  categoryName?: string;
  baseSku: string;
  hsCode: string;
  countryOfOrigin: string;
  defaultRetailPriceUsd: number;
  imageUrl?: string;
  imageUrls?: string[];
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
  itemName?: string;
  sku?: string;
  cartonLengthCm?: number;
  cartonWidthCm?: number;
  cartonHeightCm?: number;
  grossWeightPerCartonKg?: number;
  pcsPerCarton?: number;
  totalCartons?: number;
}

export interface StowedBoxCoordinate {
  productId?: number;
  sku?: string;
  itemName: string;
  x: number;
  y: number;
  z: number;
  lengthM: number;
  widthM: number;
  heightM: number;
  weightKg: number;
  colorHex: string;
  layerIndex: number;
}

export interface CenterOfGravity {
  centerXM: number;
  centerYM: number;
  centerZM: number;
  longitudeDeviationPercent: number;
  lateralDeviationPercent: number;
  balanceStatus: string;
  statusTextVi: string;
  statusTextEn: string;
  safetyAdvice: string;
}

export interface ContainerPlanItem {
  containerType: string;
  quantity: number;
  usableCapacityCbm: number;
  maxPayloadKg: number;
  spaceUtilizationPercentage: number;
  weightUtilizationPercentage: number;
}

export interface PalletSummary {
  isPalletized: boolean;
  palletType: string;
  totalEstimatedPallets: number;
  maxPalletsFitIn20Ft: number;
  maxPalletsFitIn40Ft: number;
  palletAdvice: string;
}

export interface MultiItemCargoBreakdown {
  productId?: number;
  itemName: string;
  totalCartons: number;
  cbmPerCarton: number;
  subtotalCbm: number;
  subtotalGrossWeightKg: number;
  estimatedPallets: number;
}

export interface CbmCalculationResult {
  totalCartons: number;
  totalCbm: number;
  totalGrossWeightKg: number;
  suggestedShipmentMode?: string;
  suggestedContainerType: string;
  primaryRecommendedContainer?: string;
  containerCapacityCbm: number;
  volumeUtilizationPercentage: number;
  weightLimitKg: number;
  weightUtilizationPercentage: number;
  logisticsAdvice?: string;
  containerPlan?: ContainerPlanItem[];
  palletSummary?: PalletSummary | null;
  itemBreakdowns?: MultiItemCargoBreakdown[];
  stowedBoxes?: StowedBoxCoordinate[];
  centerOfGravity?: CenterOfGravity;
}

export interface LandedCostRequest {
  productId?: number;
  hsCode: string;
  quantity: number;
  unitPriceUsd: number;
  incotermCode: string;
  portOfLoading: string;
  destinationCountryCode: string;
  portOfDischarge: string;
  totalCbm: number;
  totalGrossWeightKg: number;
  applyFtaCertificate: boolean;
}

export interface LandedCostResult {
  hsCode: string;
  destinationCountryCode: string;
  destinationCountryName: string;
  portOfLoading: string;
  portOfDischarge: string;
  incotermCode: string;
  quantity: number;
  unitPriceUsd: number;
  fobGoodsValueUsd: number;
  originLocalChargesUsd: number;
  oceanFreightUsd: number;
  marineInsuranceUsd: number;
  cifValueUsd: number;
  applicableFtaCode: string;
  requiredCertificateOfOrigin: string;
  isFtaApplied: boolean;
  mfnDutyRatePercent: number;
  ftaPreferentialDutyRatePercent: number;
  appliedDutyRatePercent: number;
  mfnDutyAmountUsd: number;
  estimatedImportDutyUsd: number;
  ftaDutySavingsUsd: number;
  customsProcessingFeeUsd: number;
  importVatName: string;
  importVatRatePercent: number;
  estimatedImportVatUsd: number;
  destinationLocalAndInlandUsd: number;
  totalLandedCostExcludingVatUsd: number;
  totalLandedCostUsd: number;
  landedCostPerUnitExcludingVatUsd: number;
  landedCostPerUnitUsd: number;
  suggestedRetailPriceUsd: number;
  estimatedGrossMarginPercent: number;
  complianceNotes: string[];
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

export interface ContractItem {
  productId: number;
  productName: string;
  sku: string;
  quantity: number;
  unitPriceUsd: number;
  totalAmountUsd: number;
  calculatedCbm: number;
  packagingSpec: string;
}

export interface SalesContract {
  id: number;
  contractNumber: string;
  rfqRequestId: number;
  rfqNumber: string;
  sellerCompanyName: string;
  sellerTaxCode: string;
  sellerAddress: string;
  sellerRepresentative: string;
  sellerTitle: string;
  buyerCompanyName: string;
  buyerTaxCode: string;
  buyerAddress: string;
  buyerRepresentative: string;
  buyerTitle: string;
  incotermCode: string;
  portOfLoading: string;
  portOfDischarge: string;
  paymentTerms: string;
  targetDeliveryDate?: string;
  currency: string;
  totalAmountUsd: number;
  status: "DRAFT" | "SELLER_SIGNED" | "BUYER_SIGNED" | "LEGALLY_BINDING" | "CANCELLED";
  sellerSignatureData?: string;
  sellerSignedAt?: string;
  sellerSignedBy?: string;
  sellerStampData?: string;
  buyerSignatureData?: string;
  buyerSignedAt?: string;
  buyerSignedBy?: string;
  digitalSignatureHash?: string;
  contractPdfUrl?: string;
  createdAt: string;
  items: ContractItem[];
}

export interface SignContractRequest {
  signerName: string;
  signerTitle: string;
  signatureData: string;
  includeCompanyStamp?: boolean;
}

export interface RfqCounterOffer {
  id: number;
  rfqRequestId: number;
  revisionNumber: number;
  senderRole: "BUYER" | "SELLER";
  senderUserId?: number;
  senderName: string;
  proposedUnitPriceUsd?: number;
  proposedTotalAmountUsd?: number;
  proposedIncotermCode?: string;
  proposedPaymentTerms?: string;
  note: string;
  expiresAt?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED" | "SUPERSEDED";
  createdAt: string;
}

export interface SubmitCounterOfferRequest {
  proposedUnitPriceUsd?: number;
  proposedIncotermCode?: string;
  proposedPaymentTerms?: string;
  note: string;
  validityDays?: number;
}

export interface ExchangeRateInfo {
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  source: string;
  fetchedAt: string;
}

export interface B2BPaymentSlip {
  id: number;
  rfqId: number;
  rfqNumber: string;
  companyName?: string;
  paymentStage: "DEPOSIT_30" | "BALANCE_70" | "FULL_100" | string;
  paymentMethod: "T_T" | "L_C" | string;
  amountUsd: number;
  swiftReference: string;
  bankSlipFileUrl: string;
  verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED" | string;
  status?: "PENDING_VERIFICATION" | "PENDING" | "VERIFIED" | "REJECTED" | string;
  verifiedBy?: number;
  verifiedAt?: string;
  createdAt?: string;
  submittedAt?: string;
}

export interface CompanyProfileDto {
  id: number;
  companyName: string;
  taxId: string;
  taxIdentificationNumber?: string;
  countryCode: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | string;
  isVerified?: boolean;
  businessLicenseUrl?: string;
  businessAddress?: string;
  representativeName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  creditLimit: number;
  defaultPaymentTerms: string;
  createdAt?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unitPriceUsd?: number;
}



