namespace WebXNK.Application.DTOs;

public class CalculateIncotermsQuoteRequestDto
{
    public string IncotermCode { get; set; } = "FOB"; // 'FOB', 'CIF', 'EXW', 'DDP', 'CFR'
    public string PortOfLoading { get; set; } = "Cát Lái Port, Vietnam";
    public string PortOfDischarge { get; set; } = "Los Angeles Port, USA";
    public decimal GoodsSubtotalUsd { get; set; }
    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
}

public class CalculateIncotermsQuoteResponseDto
{
    public string IncotermCode { get; set; } = string.Empty;
    public string IncotermName { get; set; } = string.Empty;
    public string PortOfLoading { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public decimal GoodsSubtotalUsd { get; set; }
    public decimal OceanFreightCostUsd { get; set; }
    public decimal MarineInsuranceCostUsd { get; set; }
    public decimal EstimatedCustomsAndTaxUsd { get; set; }
    public decimal TotalQuotedAmountUsd { get; set; }
    public bool RequiresFreightCost { get; set; }
    public bool RequiresInsuranceCost { get; set; }
    public string CostBreakdownDescription { get; set; } = string.Empty;
}
