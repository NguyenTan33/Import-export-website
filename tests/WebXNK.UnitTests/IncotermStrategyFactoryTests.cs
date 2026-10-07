using WebXNK.Application.Common.Incoterms;
using Xunit;

namespace WebXNK.UnitTests;

public class IncotermStrategyFactoryTests
{
    private readonly IncotermStrategyFactory _factory;

    public IncotermStrategyFactoryTests()
    {
        var strategies = new IIncotermPriceStrategy[]
        {
            new FobIncotermStrategy(),
            new CifIncotermStrategy(),
            new CfrIncotermStrategy(),
            new ExwIncotermStrategy(),
            new DdpIncotermStrategy()
        };

        _factory = new IncotermStrategyFactory(strategies);
    }

    [Theory]
    [InlineData("FOB", typeof(FobIncotermStrategy))]
    [InlineData("CIF", typeof(CifIncotermStrategy))]
    [InlineData("CFR", typeof(CfrIncotermStrategy))]
    [InlineData("EXW", typeof(ExwIncotermStrategy))]
    [InlineData("DDP", typeof(DdpIncotermStrategy))]
    public void GetStrategy_WithValidCodes_ReturnsCorrectStrategyType(string code, Type expectedType)
    {
        var strategy = _factory.GetStrategy(code);
        Assert.IsType(expectedType, strategy);
    }

    [Theory]
    [InlineData("fob")]
    [InlineData("cif")]
    [InlineData("Cfr")]
    [InlineData("exw")]
    [InlineData("  DDP  ")]
    public void GetStrategy_CaseInsensitiveAndWhitespace_ReturnsMatchingStrategy(string code)
    {
        var strategy = _factory.GetStrategy(code);
        Assert.NotNull(strategy);
        Assert.Equal(code.Trim().ToUpperInvariant(), strategy.IncotermCode);
    }

    [Theory]
    [InlineData("XYZ")]
    [InlineData("INVALID")]
    [InlineData("")]
    public void GetStrategy_WithUnsupportedCode_FallsBackToDefaultFobStrategy(string code)
    {
        var strategy = _factory.GetStrategy(code);
        Assert.NotNull(strategy);
        Assert.Equal("FOB", strategy.IncotermCode);
    }

    [Fact]
    public void FobStrategy_Characteristics_AreCorrect()
    {
        var strategy = _factory.GetStrategy("FOB");
        var breakdown = strategy.Calculate(1000m, 500m, 100m);

        Assert.False(breakdown.RequiresFreight);
        Assert.False(breakdown.RequiresInsurance);
        Assert.Equal(1000m, breakdown.TotalAmount);
        Assert.Equal(0m, breakdown.OceanFreight);
        Assert.Equal(0m, breakdown.MarineInsurance);
    }

    [Fact]
    public void CfrStrategy_Characteristics_AreCorrect()
    {
        var strategy = _factory.GetStrategy("CFR");
        var breakdown = strategy.Calculate(1000m, 500m, 100m);

        Assert.True(breakdown.RequiresFreight);
        Assert.False(breakdown.RequiresInsurance);
        Assert.Equal(1500m, breakdown.TotalAmount);
        Assert.Equal(500m, breakdown.OceanFreight);
        Assert.Equal(0m, breakdown.MarineInsurance);
    }

    [Fact]
    public void CifStrategy_Characteristics_AreCorrect()
    {
        var strategy = _factory.GetStrategy("CIF");
        var breakdown = strategy.Calculate(1000m, 500m, 100m);

        Assert.True(breakdown.RequiresFreight);
        Assert.True(breakdown.RequiresInsurance);
        Assert.Equal(1600m, breakdown.TotalAmount);
        Assert.Equal(500m, breakdown.OceanFreight);
        Assert.Equal(100m, breakdown.MarineInsurance);
    }

    [Fact]
    public void ExwStrategy_Characteristics_AreCorrect()
    {
        var strategy = _factory.GetStrategy("EXW");
        var breakdown = strategy.Calculate(2500m, 600m, 150m);

        Assert.False(breakdown.RequiresFreight);
        Assert.False(breakdown.RequiresInsurance);
        Assert.Equal(2500m, breakdown.TotalAmount);
        Assert.Equal(0m, breakdown.OceanFreight);
        Assert.Equal(0m, breakdown.MarineInsurance);
    }

    [Fact]
    public void DdpStrategy_Characteristics_AreCorrect()
    {
        var strategy = _factory.GetStrategy("DDP");
        var breakdown = strategy.Calculate(10000m, 2000m, 300m);

        Assert.True(breakdown.RequiresFreight);
        Assert.True(breakdown.RequiresInsurance);
        // DDP includes estimated import duty/tax (15%) + goods + freight + insurance
        Assert.True(breakdown.TotalAmount > 12300m);
        Assert.True(breakdown.CustomsTax > 0);
    }
}
