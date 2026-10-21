using WebXNK.Application.Common.Incoterms;
using WebXNK.Application.Common.Logistics;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

/// <summary>
/// Thin Service điều phối tính toán Incoterms 2020, Landed Cost Door-to-Door và Biểu thuế quan Hiệp định FTA.
/// </summary>
public class IncotermsCalculationService : IIncotermsCalculationService
{
    private readonly IIncotermStrategyFactory _strategyFactory;
    private readonly IOceanFreightEstimator _freightEstimator;
    private readonly IMarineInsuranceCalculator _insuranceCalculator;

    public IncotermsCalculationService(
        IIncotermStrategyFactory strategyFactory,
        IOceanFreightEstimator freightEstimator,
        IMarineInsuranceCalculator insuranceCalculator)
    {
        _strategyFactory = strategyFactory;
        _freightEstimator = freightEstimator;
        _insuranceCalculator = insuranceCalculator;
    }

    public Task<CalculateIncotermsQuoteResponseDto> CalculateIncotermsQuoteAsync(CalculateIncotermsQuoteRequestDto request)
    {
        var pod = !string.IsNullOrWhiteSpace(request.DestinationPort)
            ? request.DestinationPort
            : request.PortOfDischarge;

        var subtotal = request.GoodsSubtotalUsd;
        var cbm = request.TotalCbm;
        var gw = request.TotalGrossWeightKg;

        if (subtotal <= 0 && request.Quantity > 0)
        {
            var unitPrice = request.ProductId switch
            {
                1 => 19.5m,
                2 => 0.95m,
                3 => 0.55m,
                4 => 7.20m,
                5 => 0.68m,
                6 => 2.65m,
                _ => 15.0m
            };
            subtotal = unitPrice * request.Quantity;
            if (cbm <= 0) cbm = Math.Max(1.0m, Math.Round(request.Quantity * 0.008m, 2));
            if (gw <= 0) gw = Math.Max(50.0m, Math.Round(request.Quantity * 0.95m, 1));
        }

        var strategy = _strategyFactory.GetStrategy(request.IncotermCode);

        // Ước lượng cước biển và bảo hiểm
        var oceanFreight = _freightEstimator.EstimateFreight(
            request.PortOfLoading,
            pod,
            cbm,
            gw);

        var cfrAmount = subtotal + oceanFreight;
        var marineInsurance = _insuranceCalculator.CalculatePremium(cfrAmount);

        // Áp dụng Incoterm Strategy tương ứng (FOB, CIF, EXW, DDP...)
        var breakdown = strategy.Calculate(subtotal, oceanFreight, marineInsurance);

        var response = new CalculateIncotermsQuoteResponseDto
        {
            IncotermCode = breakdown.IncotermCode,
            IncotermName = breakdown.IncotermCode,
            PortOfLoading = request.PortOfLoading,
            PortOfDischarge = pod,
            GoodsSubtotalUsd = breakdown.GoodsSubtotal,
            OceanFreightCostUsd = breakdown.OceanFreight,
            MarineInsuranceCostUsd = breakdown.MarineInsurance,
            EstimatedCustomsAndTaxUsd = breakdown.CustomsTax,
            TotalQuotedAmountUsd = breakdown.TotalAmount,
            RequiresFreightCost = breakdown.RequiresFreight,
            RequiresInsuranceCost = breakdown.RequiresInsurance,
            CostBreakdownDescription = breakdown.Description
        };

        return Task.FromResult(response);
    }

    public Task<CalculateLandedCostResponseDto> CalculateLandedCostAsync(CalculateLandedCostRequestDto request)
    {
        var qty = Math.Max(1, request.Quantity);
        var unitPrice = request.UnitPriceUsd > 0 ? request.UnitPriceUsd : 19.50m;
        var fobValue = Math.Round(unitPrice * qty, 2);

        var incoterm = string.IsNullOrWhiteSpace(request.IncotermCode) ? "FOB" : request.IncotermCode.ToUpperInvariant();
        var countryCode = string.IsNullOrWhiteSpace(request.DestinationCountryCode) ? "JPN" : request.DestinationCountryCode.ToUpperInvariant();
        var hsCode = string.IsNullOrWhiteSpace(request.HsCode) ? "6404.11.00" : request.HsCode.Trim();

        // 1. Origin local charges (only paid separately by buyer if EXW; included in FOB/CFR/CIF/DDP)
        var originLocalCharges = incoterm == "EXW"
            ? Math.Round(Math.Max(220m, request.TotalCbm * 14m), 2)
            : 0m;

        // 2. Ocean Freight & Marine Insurance
        var rawOceanFreight = _freightEstimator.EstimateFreight(
            request.PortOfLoading,
            request.PortOfDischarge,
            Math.Max(1.0m, request.TotalCbm),
            Math.Max(100.0m, request.TotalGrossWeightKg));

        var rawInsurance = _insuranceCalculator.CalculatePremium(fobValue + originLocalCharges + rawOceanFreight);

        var cifValue = Math.Round(fobValue + originLocalCharges + rawOceanFreight + rawInsurance, 2);

        // 3. Lookup Tariff Schedule & FTA Rules by Country + HS Code prefix
        var (countryName, ftaCode, coForm, mfnRate, ftaRate, vatName, vatRate, complianceList) =
            ResolveTariffAndFtaSchedule(countryCode, hsCode);

        var isFtaEligible = request.ApplyFtaCertificate && ftaRate < mfnRate;
        var appliedDutyRate = isFtaEligible ? ftaRate : mfnRate;

        var mfnDutyUsd = Math.Round(cifValue * (mfnRate / 100.0m), 2);
        var appliedDutyUsd = Math.Round(cifValue * (appliedDutyRate / 100.0m), 2);
        var ftaSavingsUsd = Math.Max(0m, mfnDutyUsd - appliedDutyUsd);

        // 4. Customs Processing / MPF + HMF / Brokerage Fee
        decimal customsProcessingFeeUsd;
        if (countryCode == "USA")
        {
            // US CBP Merchandise Processing Fee (0.3464%, min $31.67, max $614.35) + Harbor Maintenance Fee (0.125%)
            var mpf = Math.Clamp(fobValue * 0.003464m, 31.67m, 614.35m);
            var hmf = fobValue * 0.00125m;
            customsProcessingFeeUsd = Math.Round(mpf + hmf + 125m, 2);
        }
        else
        {
            customsProcessingFeeUsd = 145.00m;
        }

        // 5. Destination Port THC, D/O & Inland Drayage
        var destLocalAndInlandUsd = Math.Round(Math.Max(280m, request.TotalCbm * 18.5m), 2);

        // 6. Import VAT / GST (calculated on CIF + Import Duty)
        var vatBase = cifValue + appliedDutyUsd;
        var importVatUsd = Math.Round(vatBase * (vatRate / 100.0m), 2);

        var totalExclVat = Math.Round(
            cifValue + appliedDutyUsd + customsProcessingFeeUsd + destLocalAndInlandUsd,
            2);
        var totalInclVat = Math.Round(totalExclVat + importVatUsd, 2);

        var landedPerUnitExclVat = Math.Round(totalExclVat / qty, 2);
        var landedPerUnitInclVat = Math.Round(totalInclVat / qty, 2);
        var suggestedRetailUsd = Math.Round(landedPerUnitExclVat * 2.15m, 2);
        var grossMarginPercent = suggestedRetailUsd > 0
            ? Math.Round(((suggestedRetailUsd - landedPerUnitExclVat) / suggestedRetailUsd) * 100.0m, 1)
            : 45.0m;

        var result = new CalculateLandedCostResponseDto
        {
            HsCode = hsCode,
            DestinationCountryCode = countryCode,
            DestinationCountryName = countryName,
            PortOfLoading = request.PortOfLoading,
            PortOfDischarge = request.PortOfDischarge,
            IncotermCode = incoterm,
            Quantity = qty,
            UnitPriceUsd = unitPrice,
            FobGoodsValueUsd = fobValue,
            OriginLocalChargesUsd = originLocalCharges,
            OceanFreightUsd = rawOceanFreight,
            MarineInsuranceUsd = rawInsurance,
            CifValueUsd = cifValue,
            ApplicableFtaCode = ftaCode,
            RequiredCertificateOfOrigin = coForm,
            IsFtaApplied = isFtaEligible,
            MfnDutyRatePercent = mfnRate,
            FtaPreferentialDutyRatePercent = ftaRate,
            AppliedDutyRatePercent = appliedDutyRate,
            MfnDutyAmountUsd = mfnDutyUsd,
            EstimatedImportDutyUsd = appliedDutyUsd,
            FtaDutySavingsUsd = ftaSavingsUsd,
            CustomsProcessingFeeUsd = customsProcessingFeeUsd,
            ImportVatName = vatName,
            ImportVatRatePercent = vatRate,
            EstimatedImportVatUsd = importVatUsd,
            DestinationLocalAndInlandUsd = destLocalAndInlandUsd,
            TotalLandedCostExcludingVatUsd = totalExclVat,
            TotalLandedCostUsd = totalInclVat,
            LandedCostPerUnitExcludingVatUsd = landedPerUnitExclVat,
            LandedCostPerUnitUsd = landedPerUnitInclVat,
            SuggestedRetailPriceUsd = suggestedRetailUsd,
            EstimatedGrossMarginPercent = grossMarginPercent,
            ComplianceNotes = complianceList
        };

        return Task.FromResult(result);
    }

    public Task<decimal> EstimateOceanFreightAsync(string portOfLoading, string portOfDischarge, decimal totalCbm, decimal grossWeightKg)
    {
        var freight = _freightEstimator.EstimateFreight(portOfLoading, portOfDischarge, totalCbm, grossWeightKg);
        return Task.FromResult(freight);
    }

    public decimal CalculateMarineInsurance(decimal cfrAmountUsd, decimal insuranceRatePercent = 0.35m)
    {
        return _insuranceCalculator.CalculatePremium(cfrAmountUsd, insuranceRatePercent);
    }

    private static (
        string CountryName,
        string FtaCode,
        string CoForm,
        decimal MfnRate,
        decimal FtaRate,
        string VatName,
        decimal VatRate,
        List<string> ComplianceNotes) ResolveTariffAndFtaSchedule(string countryCode, string hsCode)
    {
        var hsPrefix = hsCode.Length >= 4 ? hsCode[..4] : hsCode;

        // Base MFN rate by HS Chapter/Heading
        decimal baseMfn = hsPrefix switch
        {
            "6404" => 12.5m, // Giày dép thể thao đế cao su/nhựa
            "4402" => 5.0m,  // Than củi / Than gáo dừa
            "4417" => 6.0m,  // Cán chổi gỗ & dụng cụ gỗ
            "0801" => 4.5m,  // Hạt điều nhân xuất khẩu
            "3919" => 6.5m,  // Băng keo OPP công nghiệp
            "3920" => 6.5m,  // Màng PE quấn pallet
            _ => 8.0m
        };

        var notes = new List<string>();
        if (hsPrefix == "4402" || hsPrefix == "4417")
        {
            notes.Add("Chứng thư Hun trùng Quốc tế ISPM-15 (Fumigation Certificate)");
        }
        if (hsPrefix == "4402")
        {
            notes.Add("Báo cáo kiểm nghiệm Hàng nguy hiểm / Self-Heating Test (IMDG Code Non-DG) & MSDS");
        }
        if (hsPrefix == "0801")
        {
            notes.Add("Chứng nhận Kiểm dịch Thực vật (Phytosanitary Certificate) & Phân tích Aflatoxin/HACCP");
        }
        if (hsPrefix == "6404" || hsPrefix == "3919" || hsPrefix == "3920")
        {
            notes.Add("Chứng nhận hợp chuẩn Hóa chất & An toàn vật liệu (REACH / RoHS / Prop 65)");
        }

        return countryCode switch
        {
            "JPN" => (
                "Japan (Nhật Bản)",
                "VJEPA / CPTPP / RCEP",
                "C/O Form JV hoặc CPTPP",
                hsPrefix == "6404" ? 10.0m : baseMfn,
                0.0m,
                "JCT (Japan Consumption Tax)",
                10.0m,
                new List<string>(notes) { "Khai báo AFR (Advance Filing Rules) 24 giờ trước khi tàu rời cảng Cát Lái" }
            ),
            "DEU" => (
                "Germany - EU (Đức)",
                "EVFTA (EU-Vietnam FTA)",
                "C/O Form EUR.1 (hoặc REX)",
                hsPrefix == "6404" ? 16.9m : baseMfn,
                0.0m,
                "EU Import VAT (Einfuhrumsatzsteuer)",
                19.0m,
                new List<string>(notes) { "Khai báo ICS2 (Import Control System 2) & Mã số EORI Châu Âu" }
            ),
            "NLD" => (
                "Netherlands - EU (Hà Lan)",
                "EVFTA (EU-Vietnam FTA)",
                "C/O Form EUR.1 (hoặc REX)",
                hsPrefix == "6404" ? 16.9m : baseMfn,
                0.0m,
                "NL Import BTW (VAT - Article 23 Deferment Eligible)",
                21.0m,
                new List<string>(notes) { "Khai báo ICS2 & Ưu đãi hoàn/hoãn thuế VAT nhập khẩu Điều 23 tại Cảng Rotterdam" }
            ),
            "GBR" => (
                "United Kingdom (Vương quốc Anh)",
                "UKVFTA (UK-Vietnam FTA)",
                "C/O Form EUR.1 UK",
                hsPrefix == "6404" ? 16.0m : baseMfn,
                0.0m,
                "UK Import VAT",
                20.0m,
                new List<string>(notes) { "Chứng nhận hợp chuẩn UKCA & Tờ khai CDS Hải quan Anh" }
            ),
            "SGP" => (
                "Singapore (ASEAN)",
                "ATIGA (ASEAN Trade in Goods)",
                "C/O Form D điện tử (e-Form D ASW)",
                0.0m,
                0.0m,
                "Singapore GST",
                9.0m,
                new List<string>(notes) { "Truyền tự động C/O e-Form D qua Cơ chế Một cửa ASEAN (ASW)" }
            ),
            "AUS" => (
                "Australia (Úc)",
                "AANZFTA / CPTPP / RCEP",
                "C/O Form AANZ",
                hsPrefix == "6404" ? 5.0m : baseMfn,
                0.0m,
                "Australia GST",
                10.0m,
                new List<string>(notes) { "Khai báo An toàn Sinh học DAFF Biosecurity (BICON) nghiêm ngặt" }
            ),
            "KOR" => (
                "South Korea (Hàn Quốc)",
                "VKFTA / RCEP",
                "C/O Form KV",
                hsPrefix == "6404" ? 13.0m : baseMfn,
                0.0m,
                "Korea Import VAT",
                10.0m,
                new List<string>(notes) { "Chứng nhận KC Mark / Kiểm định KFDA cho hàng nông sản & tiêu dùng" }
            ),
            _ => (
                "United States (Hoa Kỳ)",
                "US-Vietnam BTA (Normal Trade Relations / MFN)",
                "C/O Form B (VCCI)",
                hsPrefix == "6404" ? 12.5m : hsPrefix == "0801" ? 0.0m : baseMfn,
                hsPrefix == "6404" ? 12.5m : hsPrefix == "0801" ? 0.0m : baseMfn,
                "US Federal Import VAT (Exempt)",
                0.0m,
                new List<string>(notes) { "Khai báo an ninh ISF 10+2 trước 24h & Đăng ký FDA Prior Notice (với hàng nông sản)" }
            )
        };
    }
}
