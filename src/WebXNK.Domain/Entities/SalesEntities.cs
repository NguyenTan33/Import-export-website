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
