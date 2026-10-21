namespace WebXNK.Application.DTOs;

public class CalculateIncotermsQuoteRequestDto
{
    public long? ProductId { get; set; }
    public int Quantity { get; set; }
    public string IncotermCode { get; set; } = "FOB"; // 'FOB', 'CIF', 'EXW', 'DDP', 'CFR'
    public string PortOfLoading { get; set; } = "Cát Lái Port, Vietnam";
    public string PortOfDischarge { get; set; } = "Los Angeles Port, USA";
    public string? DestinationPort { get; set; }
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

public class CalculateLandedCostRequestDto
{
    public long? ProductId { get; set; }
    public string HsCode { get; set; } = "6404.11.00";
    public int Quantity { get; set; } = 1200;
    public decimal UnitPriceUsd { get; set; } = 19.50m;
    public string IncotermCode { get; set; } = "FOB"; // EXW, FOB, CFR, CIF, DDP
    public string PortOfLoading { get; set; } = "Cat Lai Port, Ho Chi Minh City";
    public string DestinationCountryCode { get; set; } = "JPN"; // JPN, USA, DEU, NLD, SGP, AUS, KOR, GBR
    public string PortOfDischarge { get; set; } = "Tokyo Port, Japan";
    public decimal TotalCbm { get; set; } = 7.0m;
    public decimal TotalGrossWeightKg { get; set; } = 1120.0m;
    public bool ApplyFtaCertificate { get; set; } = true;
}

public class CalculateLandedCostResponseDto
{
    public string HsCode { get; set; } = string.Empty;
    public string DestinationCountryCode { get; set; } = string.Empty;
    public string DestinationCountryName { get; set; } = string.Empty;
    public string PortOfLoading { get; set; } = string.Empty;
    public string PortOfDischarge { get; set; } = string.Empty;
    public string IncotermCode { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal FobGoodsValueUsd { get; set; }
    public decimal OriginLocalChargesUsd { get; set; }
    public decimal OceanFreightUsd { get; set; }
    public decimal MarineInsuranceUsd { get; set; }
    public decimal CifValueUsd { get; set; }

    public string ApplicableFtaCode { get; set; } = string.Empty;
    public string RequiredCertificateOfOrigin { get; set; } = string.Empty;
    public bool IsFtaApplied { get; set; }
    public decimal MfnDutyRatePercent { get; set; }
    public decimal FtaPreferentialDutyRatePercent { get; set; }
    public decimal AppliedDutyRatePercent { get; set; }
    public decimal MfnDutyAmountUsd { get; set; }
    public decimal EstimatedImportDutyUsd { get; set; }
    public decimal FtaDutySavingsUsd { get; set; }

    public decimal CustomsProcessingFeeUsd { get; set; }
    public string ImportVatName { get; set; } = string.Empty;
    public decimal ImportVatRatePercent { get; set; }
    public decimal EstimatedImportVatUsd { get; set; }
    public decimal DestinationLocalAndInlandUsd { get; set; }

    public decimal TotalLandedCostExcludingVatUsd { get; set; }
    public decimal TotalLandedCostUsd { get; set; }
    public decimal LandedCostPerUnitUsd { get; set; }
    public decimal LandedCostPerUnitExcludingVatUsd { get; set; }
    public decimal SuggestedRetailPriceUsd { get; set; }
    public decimal EstimatedGrossMarginPercent { get; set; }

    public List<string> ComplianceNotes { get; set; } = new();
}
