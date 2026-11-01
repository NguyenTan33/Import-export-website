namespace WebXNK.Application.DTOs;

public class CalculateTierPriceRequestDto
{
    public long ProductId { get; set; }
    public int Quantity { get; set; }
    public string TargetCurrency { get; set; } = "USD";
}

public class CalculateTierPriceResponseDto
{
    public long ProductId { get; set; }
    public int RequestedQuantity { get; set; }
    public int MinimumOrderQuantity { get; set; }
    public decimal BasePriceUsd { get; set; }
    public decimal AppliedUnitPriceUsd { get; set; }
    public decimal DiscountPercentage { get; set; }
    public decimal TotalAmountUsd { get; set; }
    public string Currency { get; set; } = "USD";
    public decimal ConvertedUnitPrice { get; set; }
    public decimal ConvertedTotalAmount { get; set; }
    public bool IsMoqSatisfied { get; set; }
}

public class ExchangeRateDto
{
    public string FromCurrency { get; set; } = "USD";
    public string ToCurrency { get; set; } = string.Empty;
    public decimal Rate { get; set; }
    public string Source { get; set; } = string.Empty;
    public DateTime FetchedAt { get; set; }
}

