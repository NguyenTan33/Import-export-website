using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class Incoterm
{
    public string Code { get; set; } = string.Empty; // 'FOB', 'CIF', 'EXW', 'DDP'
    public string Name { get; set; } = string.Empty;
    public bool RequiresFreightCost { get; set; }
    public bool RequiresInsuranceCost { get; set; }
}

public class Order : BaseEntity<long>, IAuditableEntity
{
    public string OrderCode { get; set; } = string.Empty;
    public long UserId { get; set; }
    public User User { get; set; } = null!;

    public string OrderType { get; set; } = "B2C"; // B2C, B2B
    public string CurrencyCode { get; set; } = "USD";
    public Currency Currency { get; set; } = null!;
    public decimal ExchangeRateToUsd { get; set; } = 1;

    public decimal SubtotalUsd { get; set; }
    public decimal ShippingFeeUsd { get; set; }
    public decimal TaxAmountUsd { get; set; }
    public decimal TotalAmountUsd { get; set; }

    public string OrderStatus { get; set; } = "PENDING";
    public string PaymentStatus { get; set; } = "UNPAID";

    public string? StripePaymentIntentId { get; set; }
    public string? StripeClientSecret { get; set; }

    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string DestinationCountryCode { get; set; } = string.Empty;
    public string ShippingAddressLine { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public byte[]? RowVersion { get; set; }

    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}

public class OrderItem : BaseEntity<long>
{
    public long OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal TotalPriceUsd { get; set; }
}

public class RfqRequest : BaseEntity<long>, IAuditableEntity
{
    public string RfqNumber { get; set; } = string.Empty;
    public long CompanyId { get; set; }
    public Company Company { get; set; } = null!;

    public string IncotermCode { get; set; } = string.Empty;
    public Incoterm Incoterm { get; set; } = null!;

    public string PortOfLoading { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public DateOnly? TargetDeliveryDate { get; set; }
    public DateOnly? PriceValidityUntil { get; set; }
    public string Status { get; set; } = "SUBMITTED";

    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string? SuggestedContainerType { get; set; }

    public decimal OceanFreightCostUsd { get; set; }
    public decimal MarineInsuranceCostUsd { get; set; }
    public decimal TotalQuotedAmountUsd { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public byte[]? RowVersion { get; set; }

    public ICollection<RfqItem> RfqItems { get; set; } = new List<RfqItem>();
    public ICollection<RfqNegotiationHistory> NegotiationHistories { get; set; } = new List<RfqNegotiationHistory>();
    public ICollection<B2BPayment> Payments { get; set; } = new List<B2BPayment>();
    public ICollection<ShipmentMilestone> ShipmentMilestones { get; set; } = new List<ShipmentMilestone>();
    public ICollection<RfqCounterOffer> CounterOffers { get; set; } = new List<RfqCounterOffer>();
    public SalesContract? SalesContract { get; set; }
}

public class RfqItem : BaseEntity<long>
{
    public long RfqId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public decimal? TargetPriceUsd { get; set; }
    public decimal? QuotedUnitPriceUsd { get; set; }
    public decimal CalculatedCbm { get; set; }
    public string? CustomRequirements { get; set; }
}

public class RfqNegotiationHistory : BaseEntity<long>
{
    public long RfqId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    public long SenderUserId { get; set; }
    public User SenderUser { get; set; } = null!;

    public string Message { get; set; } = string.Empty;
    public decimal? ProposedTotalUsd { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class B2BPayment : BaseEntity<long>
{
    public long RfqId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    public string PaymentStage { get; set; } = "DEPOSIT_30";
    public string PaymentMethod { get; set; } = "T_T";
    public decimal AmountUsd { get; set; }
    public string SwiftReference { get; set; } = string.Empty;
    public string BankSlipFileUrl { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = "PENDING";
    public long? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class SalesContract : BaseEntity<long>, IAuditableEntity
{
    public string ContractNumber { get; set; } = string.Empty; // e.g. "SC-2026-QTH-JP01"
    public long RfqRequestId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    // Seller Information (Quang Tan Hoang Co., Ltd)
    public string SellerCompanyName { get; set; } = "CÔNG TY TNHH XUẤT NHẬP KHẨU QUANG TẤN HOÀNG";
    public string SellerTaxCode { get; set; } = "0318992145";
    public string SellerAddress { get; set; } = "Số 88, Đường Số 7, KCN Sóng Thần 1, Dĩ An, Bình Dương, Việt Nam";
    public string SellerRepresentative { get; set; } = "Nguyễn Văn A";
    public string SellerTitle { get; set; } = "Giám Đốc Điều Hành (Managing Director)";

    // Buyer Information
    public string BuyerCompanyName { get; set; } = string.Empty;
    public string BuyerTaxCode { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerRepresentative { get; set; } = string.Empty;
    public string BuyerTitle { get; set; } = string.Empty;

    // Commercial Terms (Incoterms 2020)
    public string IncotermCode { get; set; } = "FOB";
    public string PortOfLoading { get; set; } = "Tân Cảng Cát Lái, TP. Hồ Chí Minh (VN)";
    public string PortOfDischarge { get; set; } = string.Empty;
    public string PaymentTerms { get; set; } = "30% T/T Deposit upon Contract Signing, 70% T/T against Copy of B/L";
    public DateOnly? TargetDeliveryDate { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal TotalAmountUsd { get; set; }

    // Status: DRAFT, SELLER_SIGNED, BUYER_SIGNED, LEGALLY_BINDING, CANCELLED
    public string Status { get; set; } = "DRAFT";

    // Digital Signatures
    public string? SellerSignatureData { get; set; } // Base64 PNG image
    public DateTime? SellerSignedAt { get; set; }
    public string? SellerSignedBy { get; set; }
    public string? SellerStampData { get; set; } // Base64 PNG company seal

    public string? BuyerSignatureData { get; set; } // Base64 PNG image
    public DateTime? BuyerSignedAt { get; set; }
    public string? BuyerSignedBy { get; set; }

    public string? DigitalSignatureHash { get; set; } // SHA-256 integrity hash
    public string? ContractPdfUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public byte[]? RowVersion { get; set; }
}

public class RfqCounterOffer : BaseEntity<long>
{
    public long RfqRequestId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    public int RevisionNumber { get; set; } // 1, 2, 3...
    public string SenderRole { get; set; } = "BUYER"; // "BUYER" or "SELLER"
    public long? SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;

    public decimal? ProposedUnitPriceUsd { get; set; }
    public decimal? ProposedTotalAmountUsd { get; set; }
    public string? ProposedIncotermCode { get; set; }
    public string? ProposedPaymentTerms { get; set; }
    public string Note { get; set; } = string.Empty;

    public DateTime? ExpiresAt { get; set; }
    public string Status { get; set; } = "PENDING"; // PENDING, ACCEPTED, REJECTED, SUPERSEDED
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

