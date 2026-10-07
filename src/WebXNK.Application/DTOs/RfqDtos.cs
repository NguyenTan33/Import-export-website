using System.ComponentModel.DataAnnotations;

namespace WebXNK.Application.DTOs;

public class CreateRfqRequestDto
{
    public long? CompanyId { get; set; }

    [Required]
    [StringLength(10)]
    public string IncotermCode { get; set; } = "FOB"; // FOB, CIF, EXW, DDP

    [Required]
    [StringLength(150)]
    public string PortOfLoading { get; set; } = "Cát Lái Port, Vietnam";

    [Required]
    [StringLength(150)]
    public string PortOfDischarge { get; set; } = string.Empty;

    public DateOnly? TargetDeliveryDate { get; set; }

    [Required]
    [MinLength(1, ErrorMessage = "Yêu cầu báo giá phải chứa ít nhất 1 mặt hàng.")]
    public List<CreateRfqItemDto> Items { get; set; } = new();
}

public class CreateRfqItemDto
{
    [Required]
    public long ProductId { get; set; }

    [Range(1, 1000000, ErrorMessage = "Số lượng đặt sỉ phải lớn hơn 0.")]
    public int Quantity { get; set; }

    public decimal? TargetPriceUsd { get; set; }

    public string? CustomRequirements { get; set; }
}

public class SubmitQuotationDto
{
    public DateOnly? PriceValidityUntil { get; set; } // Hạn báo giá (14/30 ngày)

    public decimal? CustomOceanFreightCostUsd { get; set; }
    public decimal? CustomMarineInsuranceCostUsd { get; set; }

    [Required]
    public List<QuotedItemPriceDto> ItemPrices { get; set; } = new();

    public string? SalesNote { get; set; }
}

public class QuotedItemPriceDto
{
    [Required]
    public long RfqItemId { get; set; }

    [Range(0.0001, 1000000, ErrorMessage = "Đơn giá báo cho khách phải lớn hơn 0.")]
    public decimal QuotedUnitPriceUsd { get; set; }
}

public class CounterOfferRequestDto
{
    [Required]
    public string Message { get; set; } = string.Empty;

    public decimal? ProposedTotalUsd { get; set; }
}

public class RfqDetailDto
{
    public long Id { get; set; }
    public string RfqNumber { get; set; } = string.Empty;
    public long CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string IncotermCode { get; set; } = string.Empty;
    public string PortOfLoading { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public DateOnly? TargetDeliveryDate { get; set; }
    public DateOnly? PriceValidityUntil { get; set; }
    public string Status { get; set; } = string.Empty;

    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string? SuggestedContainerType { get; set; }

    public decimal OceanFreightCostUsd { get; set; }
    public decimal MarineInsuranceCostUsd { get; set; }
    public decimal TotalQuotedAmountUsd { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public List<RfqItemDetailDto> Items { get; set; } = new();
    public List<RfqNegotiationHistoryDto> NegotiationHistories { get; set; } = new();
}

public class RfqItemDetailDto
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal? TargetPriceUsd { get; set; }
    public decimal? QuotedUnitPriceUsd { get; set; }
    public decimal CalculatedCbm { get; set; }
    public string? CustomRequirements { get; set; }
}

public class RfqNegotiationHistoryDto
{
    public long Id { get; set; }
    public long SenderUserId { get; set; }
    public string SenderName { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public decimal? ProposedTotalUsd { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class RfqSummaryDto
{
    public long Id { get; set; }
    public string RfqNumber { get; set; } = string.Empty;
    public long CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string IncotermCode { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalCbm { get; set; }
    public decimal TotalQuotedAmountUsd { get; set; }
    public DateTime CreatedAt { get; set; }
}
