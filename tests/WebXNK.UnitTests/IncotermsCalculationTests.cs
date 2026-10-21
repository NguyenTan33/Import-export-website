using WebXNK.Application.Common.Incoterms;
using WebXNK.Application.Common.Logistics;
using WebXNK.Application.DTOs;
using WebXNK.Application.Services;
using Xunit;

namespace WebXNK.UnitTests;

public class IncotermsCalculationTests
{
    private readonly IncotermsCalculationService _service;

    public IncotermsCalculationTests()
    {
        var strategies = new IIncotermPriceStrategy[]
        {
            new FobIncotermStrategy(),
            new CifIncotermStrategy(),
            new CfrIncotermStrategy(),
            new ExwIncotermStrategy(),
            new DdpIncotermStrategy()
        };

        var factory = new IncotermStrategyFactory(strategies);
        var freight = new OceanFreightEstimator();
        var insurance = new MarineInsuranceCalculator();

        _service = new IncotermsCalculationService(factory, freight, insurance);
    }

    [Fact]
    public async Task CalculateIncotermsQuote_WhenFOB_ShouldHaveZeroFreightAndZeroInsurance()
    {
        var request = new CalculateIncotermsQuoteRequestDto
        {
            IncotermCode = "FOB",
            PortOfLoading = "Cát Lái Port, Vietnam",
            PortOfDischarge = "Los Angeles Port, USA",
            GoodsSubtotalUsd = 10000m,
            TotalCbm = 10m,
            TotalGrossWeightKg = 2500m
        };

        var result = await _service.CalculateIncotermsQuoteAsync(request);

        Assert.Equal("FOB", result.IncotermCode);
        Assert.Equal(10000m, result.GoodsSubtotalUsd);
        Assert.Equal(0m, result.OceanFreightCostUsd);
        Assert.Equal(0m, result.MarineInsuranceCostUsd);
        Assert.Equal(10000m, result.TotalQuotedAmountUsd);
        Assert.False(result.RequiresFreightCost);
        Assert.False(result.RequiresInsuranceCost);
    }

    [Fact]
    public async Task CalculateIncotermsQuote_WhenCIF_ShouldIncludeFreightAndMarineInsurance()
    {
        var request = new CalculateIncotermsQuoteRequestDto
        {
            IncotermCode = "CIF",
            PortOfLoading = "Cát Lái Port, Vietnam",
            PortOfDischarge = "Los Angeles Port, USA",
            GoodsSubtotalUsd = 20000m,
            TotalCbm = 15m,
            TotalGrossWeightKg = 3000m
        };

        var result = await _service.CalculateIncotermsQuoteAsync(request);

        Assert.Equal("CIF", result.IncotermCode);
        Assert.True(result.OceanFreightCostUsd > 0);
        Assert.True(result.MarineInsuranceCostUsd > 0);
        Assert.Equal(result.GoodsSubtotalUsd + result.OceanFreightCostUsd + result.MarineInsuranceCostUsd, result.TotalQuotedAmountUsd);
        Assert.True(result.RequiresFreightCost);
        Assert.True(result.RequiresInsuranceCost);
    }

    [Fact]
    public async Task CalculateIncotermsQuote_WhenDDP_ShouldIncludeCustomsTax()
    {
        var request = new CalculateIncotermsQuoteRequestDto
        {
            IncotermCode = "DDP",
            PortOfLoading = "Hải Phòng Port, Vietnam",
            PortOfDischarge = "Rotterdam Port, Netherlands",
            GoodsSubtotalUsd = 50000m,
            TotalCbm = 30m,
            TotalGrossWeightKg = 8000m
        };

        var result = await _service.CalculateIncotermsQuoteAsync(request);

        Assert.Equal("DDP", result.IncotermCode);
        Assert.True(result.EstimatedCustomsAndTaxUsd > 0);
        Assert.Equal(result.GoodsSubtotalUsd + result.OceanFreightCostUsd + result.MarineInsuranceCostUsd + result.EstimatedCustomsAndTaxUsd, result.TotalQuotedAmountUsd);
    }
}
