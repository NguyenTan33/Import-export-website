using WebXNK.Application.Common.Incoterms;
using WebXNK.Application.Common.Logistics;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

/// <summary>
/// Thin Service điều phối tính toán Incoterms 2020 dựa trên Strategy Pattern và các Engine chuyên biệt.
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
        var strategy = _strategyFactory.GetStrategy(request.IncotermCode);

        // Ước lượng cước biển và bảo hiểm
        var oceanFreight = _freightEstimator.EstimateFreight(
            request.PortOfLoading, 
            request.PortOfDischarge, 
            request.TotalCbm, 
            request.TotalGrossWeightKg);

        var cfrAmount = request.GoodsSubtotalUsd + oceanFreight;
        var marineInsurance = _insuranceCalculator.CalculatePremium(cfrAmount);

        // Áp dụng Incoterm Strategy tương ứng (FOB, CIF, EXW, DDP...)
        var breakdown = strategy.Calculate(request.GoodsSubtotalUsd, oceanFreight, marineInsurance);

        var response = new CalculateIncotermsQuoteResponseDto
        {
            IncotermCode = breakdown.IncotermCode,
            IncotermName = breakdown.IncotermCode,
            PortOfLoading = request.PortOfLoading,
            PortOfDischarge = request.PortOfDischarge,
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

    public Task<decimal> EstimateOceanFreightAsync(string portOfLoading, string portOfDischarge, decimal totalCbm, decimal grossWeightKg)
    {
        var freight = _freightEstimator.EstimateFreight(portOfLoading, portOfDischarge, totalCbm, grossWeightKg);
        return Task.FromResult(freight);
    }

    public decimal CalculateMarineInsurance(decimal cfrAmountUsd, decimal insuranceRatePercent = 0.35m)
    {
        return _insuranceCalculator.CalculatePremium(cfrAmountUsd, insuranceRatePercent);
    }
}
