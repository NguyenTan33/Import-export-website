using WebXNK.Application.Common.Policies;
using Xunit;

namespace WebXNK.UnitTests;

public class ShippingFeeCalculatorTests
{
    private readonly ShippingFeeCalculator _calculator = new();

    [Fact]
    public void CalculateShippingFee_ForUSA_WithSingleItem_ShouldReturnBaseRate()
    {
        var fee = _calculator.CalculateShippingFee("USA", 1);
        Assert.Equal(25.00m, fee);
    }

    [Fact]
    public void CalculateShippingFee_ForUSA_WithMultipleItems_ShouldAddPerItemCharge()
    {
        // 1 item = $25, + 3 additional items * $2.50 = $32.50
        var fee = _calculator.CalculateShippingFee("USA", 4);
        Assert.Equal(32.50m, fee);
    }

    [Theory]
    [InlineData("JPN", 1, 18.00)]
    [InlineData("DEU", 1, 32.00)]
    [InlineData("OTHER_COUNTRY", 1, 35.00)]
    public void CalculateShippingFee_ForVariousCountries_ShouldMatchRegionalBaseRates(string country, int count, decimal expectedFee)
    {
        var fee = _calculator.CalculateShippingFee(country, count);
        Assert.Equal(expectedFee, fee);
    }
}
