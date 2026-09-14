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
