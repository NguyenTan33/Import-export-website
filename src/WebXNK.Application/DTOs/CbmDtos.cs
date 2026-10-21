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
    public List<StowedBoxCoordinateDto> StowedBoxes { get; set; } = new();
    public CenterOfGravityDto? CenterOfGravity { get; set; }
}

public class MultiItemCargoItemDto
{
    public long? ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public int PcsPerCarton { get; set; }
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
    public string SuggestedContainerType { get; set; } = string.Empty;
    public decimal ContainerCapacityCbm { get; set; }
    public decimal VolumeUtilizationPercentage { get; set; }
    public decimal WeightLimitKg { get; set; }
    public decimal WeightUtilizationPercentage { get; set; }
    public List<ContainerPlanDto> ContainerPlan { get; set; } = new();
    public PalletSummaryDto? PalletSummary { get; set; }
    public List<MultiItemCargoBreakdownDto> ItemBreakdowns { get; set; } = new();
    public string LogisticsAdvice { get; set; } = string.Empty;
    public List<StowedBoxCoordinateDto> StowedBoxes { get; set; } = new();
    public CenterOfGravityDto? CenterOfGravity { get; set; }
}

public class StowedBoxCoordinateDto
{
    public long? ProductId { get; set; }
    public string Sku { get; set; } = string.Empty;
    public string ItemName { get; set; } = string.Empty;
    public decimal X { get; set; } // Chiều dài dọc container (m)
    public decimal Y { get; set; } // Chiều cao nâng (m)
    public decimal Z { get; set; } // Chiều rộng ngang (m)
    public decimal LengthM { get; set; }
    public decimal WidthM { get; set; }
    public decimal HeightM { get; set; }
    public decimal WeightKg { get; set; }
    public string ColorHex { get; set; } = "#0E4B94";
    public int LayerIndex { get; set; }
}

public class CenterOfGravityDto
{
    public decimal CenterXM { get; set; }
    public decimal CenterYM { get; set; }
    public decimal CenterZM { get; set; }
    public decimal LongitudeDeviationPercent { get; set; }
    public decimal LateralDeviationPercent { get; set; }
    public string BalanceStatus { get; set; } = "BALANCED_SAFE";
    public string StatusTextVi { get; set; } = "Cân bằng tải an toàn";
    public string StatusTextEn { get; set; } = "Optimal Balanced Stowage";
    public string SafetyAdvice { get; set; } = string.Empty;
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
