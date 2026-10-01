using WebXNK.Application.Common.Logistics;
using Xunit;

namespace WebXNK.UnitTests;

public class LogisticsEstimatorTests
{
    private readonly OceanFreightEstimator _freightEstimator = new();
    private readonly MarineInsuranceCalculator _insuranceCalculator = new();

    [Fact]
    public void EstimateFreight_WhenVolumeDominant_UsesCbmAsRevenueTon()
    {
        // 10 CBM, 2000 kg (2 metric tons) -> Revenue Ton = 10
        // Route: Los Angeles -> $85/CBM + $60 doc fee = 10 * 85 + 60 = 910
        var freight = _freightEstimator.EstimateFreight("Cát Lái", "Los Angeles Port, USA", 10m, 2000m);
        Assert.Equal(910.00m, freight);
    }

    [Fact]
    public void EstimateFreight_WhenWeightDominant_UsesMetricTonsAsRevenueTon()
    {
        // 5 CBM, 12000 kg (12 metric tons) -> Revenue Ton = 12
        // Route: Rotterdam -> $95/CBM + $60 doc fee = 12 * 95 + 60 = 1200
        var freight = _freightEstimator.EstimateFreight("Hải Phòng", "Rotterdam Port, Europe", 5m, 12000m);
        Assert.Equal(1200.00m, freight);
    }

    [Fact]
    public void EstimateFreight_WhenSmallCargo_EnforcesMinimumOneRevenueTon()
    {
        // 0.2 CBM, 100 kg -> Revenue Ton clamped to 1.0
        // Route: Tokyo -> $42/CBM + $60 doc fee = 102.00
        var freight = _freightEstimator.EstimateFreight("Cát Lái", "Tokyo Port, Japan", 0.2m, 100m);
        Assert.Equal(102.00m, freight);
    }

    [Fact]
    public void CalculatePremium_WhenAmountIsZero_ReturnsZero()
    {
        var premium = _insuranceCalculator.CalculatePremium(0m);
        Assert.Equal(0m, premium);
    }

    [Fact]
    public void CalculatePremium_StandardCalculation_FollowsIcc110PercentRule()
    {
        // CFR = 100,000 USD
        // Insured Value = 110,000 USD
        // Rate = 0.35% -> Premium = 110,000 * 0.0035 = 385.00 USD
        var premium = _insuranceCalculator.CalculatePremium(100000m, 0.35m);
        Assert.Equal(385.00m, premium);
    }

    [Fact]
    public void CalculatePremium_SmallCfrAmount_EnforcesMinimumFee()
    {
        // CFR = 1,000 USD
        // Insured Value = 1,100 USD
        // Rate = 0.35% -> Premium = 3.85 USD -> Enforces minimum floor of 25.00 USD
        var premium = _insuranceCalculator.CalculatePremium(1000m, 0.35m);
        Assert.Equal(25.00m, premium);
    }
}
