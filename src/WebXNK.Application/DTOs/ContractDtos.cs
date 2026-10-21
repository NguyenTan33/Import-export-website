namespace WebXNK.Application.DTOs;

public class ContractItemDto
{
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string Sku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal TotalAmountUsd { get; set; }
    public decimal CalculatedCbm { get; set; }
    public string PackagingSpec { get; set; } = string.Empty;
}

public class SalesContractDto
{
    public long Id { get; set; }
    public string ContractNumber { get; set; } = string.Empty;
    public long RfqRequestId { get; set; }
    public string RfqNumber { get; set; } = string.Empty;

    // Seller Information
    public string SellerCompanyName { get; set; } = string.Empty;
    public string SellerTaxCode { get; set; } = string.Empty;
    public string SellerAddress { get; set; } = string.Empty;
    public string SellerRepresentative { get; set; } = string.Empty;
    public string SellerTitle { get; set; } = string.Empty;

    // Buyer Information
    public string BuyerCompanyName { get; set; } = string.Empty;
    public string BuyerTaxCode { get; set; } = string.Empty;
    public string BuyerAddress { get; set; } = string.Empty;
    public string BuyerRepresentative { get; set; } = string.Empty;
    public string BuyerTitle { get; set; } = string.Empty;

    // Commercial Terms
    public string IncotermCode { get; set; } = string.Empty;
    public string PortOfLoading { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public string PaymentTerms { get; set; } = string.Empty;
    public string? TargetDeliveryDate { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal TotalAmountUsd { get; set; }

    // Status: DRAFT, SELLER_SIGNED, BUYER_SIGNED, LEGALLY_BINDING, CANCELLED
    public string Status { get; set; } = "DRAFT";

    // Signatures
    public string? SellerSignatureData { get; set; }
    public DateTime? SellerSignedAt { get; set; }
    public string? SellerSignedBy { get; set; }
    public string? SellerStampData { get; set; }

    public string? BuyerSignatureData { get; set; }
    public DateTime? BuyerSignedAt { get; set; }
    public string? BuyerSignedBy { get; set; }

    public string? DigitalSignatureHash { get; set; }
    public string? ContractPdfUrl { get; set; }
    public DateTime CreatedAt { get; set; }

    public List<ContractItemDto> Items { get; set; } = new();
}

public class SignContractRequestDto
{
    public string SignerName { get; set; } = string.Empty;
    public string SignerTitle { get; set; } = string.Empty;
    public string SignatureData { get; set; } = string.Empty; // Base64 PNG image
    public bool IncludeCompanyStamp { get; set; } = true;
}

public class RfqCounterOfferDto
{
    public long Id { get; set; }
    public long RfqRequestId { get; set; }
    public int RevisionNumber { get; set; }
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
    public DateTime CreatedAt { get; set; }
}

public class SubmitCounterOfferRequestDto
{
    public decimal? ProposedUnitPriceUsd { get; set; }
    public string? ProposedIncotermCode { get; set; }
    public string? ProposedPaymentTerms { get; set; }
    public string Note { get; set; } = string.Empty;
    public int ValidityDays { get; set; } = 3;
}
