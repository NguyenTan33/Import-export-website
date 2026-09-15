namespace WebXNK.Application.DTOs;

public class CalculateCbmRequestDto
{
    public decimal CartonLengthCm { get; set; }
    public decimal CartonWidthCm { get; set; }
    public decimal CartonHeightCm { get; set; }
    public decimal GrossWeightPerCartonKg { get; set; }
    public int TotalCartons { get; set; }
}

public class CalculateCbmResponseDto
{
    public decimal CbmPerCarton { get; set; }
    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string SuggestedShipmentMode { get; set; } = string.Empty; // FCL or LCL
    public string RecommendedContainerType { get; set; } = string.Empty; // 20ft GP, 40ft HC, LCL Consolidation
    public decimal ContainerSpaceUtilizationPercentage { get; set; }
    public decimal ContainerWeightUtilizationPercentage { get; set; }
    public string LogisticsAdvice { get; set; } = string.Empty;
}

public class MultiItemCargoItemDto
{
    public long? ProductId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public decimal CartonLengthCm { get; set; }
    public decimal CartonWidthCm { get; set; }
    public decimal CartonHeightCm { get; set; }
    public decimal GrossWeightPerCartonKg { get; set; }
    public int TotalCartons { get; set; }
}

public class CalculateMultiItemCbmRequestDto
{
    public List<MultiItemCargoItemDto> Items { get; set; } = new();
    public bool RequirePalletization { get; set; } = false;
    public string PalletType { get; set; } = "STANDARD_1200X1000"; // STANDARD_1200X1000, EURO_1200X800
}

public class MultiItemCargoBreakdownDto
{
    public long? ProductId { get; set; }
    public string ItemName { get; set; } = string.Empty;
    public int TotalCartons { get; set; }
    public decimal CbmPerCarton { get; set; }
    public decimal SubtotalCbm { get; set; }
    public decimal SubtotalGrossWeightKg { get; set; }
    public int EstimatedPallets { get; set; }
}

public class ContainerPlanDto
{
    public string ContainerType { get; set; } = string.Empty; // 20ft GP, 40ft HC
    public int Quantity { get; set; }
    public decimal UsableCapacityCbm { get; set; }
    public decimal MaxPayloadKg { get; set; }
    public decimal SpaceUtilizationPercentage { get; set; }
    public decimal WeightUtilizationPercentage { get; set; }
}

public class PalletSummaryDto
{
    public bool IsPalletized { get; set; }
    public string PalletType { get; set; } = string.Empty;
    public int TotalEstimatedPallets { get; set; }
    public int MaxPalletsFitIn20Ft { get; set; }
    public int MaxPalletsFitIn40Ft { get; set; }
    public string PalletAdvice { get; set; } = string.Empty;
}

public class CalculateMultiItemCbmResponseDto
{
    public int TotalItemsCount { get; set; }
    public int TotalCartons { get; set; }
    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string SuggestedShipmentMode { get; set; } = string.Empty; // FCL or LCL
    public string PrimaryRecommendedContainer { get; set; } = string.Empty;
    public List<ContainerPlanDto> ContainerPlan { get; set; } = new();
    public PalletSummaryDto? PalletSummary { get; set; }
    public List<MultiItemCargoBreakdownDto> ItemBreakdowns { get; set; } = new();
    public string LogisticsAdvice { get; set; } = string.Empty;
}

public class RfqPackingOptimizationResultDto
{
    public long RfqId { get; set; }
    public string RfqNumber { get; set; } = string.Empty;
    public int ItemsCount { get; set; }
    public int TotalCartons { get; set; }
    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string SuggestedContainerType { get; set; } = string.Empty;
    public CalculateMultiItemCbmResponseDto Details { get; set; } = new();
}
