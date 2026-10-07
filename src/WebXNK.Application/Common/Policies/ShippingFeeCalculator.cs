namespace WebXNK.Application.Common.Policies;

public interface IShippingFeeCalculator
{
    decimal CalculateShippingFee(string countryCode, int itemCount);
}

public class ShippingFeeCalculator : IShippingFeeCalculator
{
    public decimal CalculateShippingFee(string countryCode, int itemCount)
    {
        var code = (countryCode ?? string.Empty).ToUpperInvariant();
        decimal baseRate = code switch
        {
            "USA" or "US" => 25.00m,
            "CAN" or "CA" => 28.00m,
            "GBR" or "UK" or "DEU" or "FRA" => 32.00m,
            "JPN" or "KOR" or "SGP" => 18.00m,
            "AUS" or "NZL" => 26.00m,
            _ => 35.00m
        };

        // Phụ phí thêm cho mỗi món đồ tiếp theo $2.50
        decimal additionalPerItem = Math.Max(0, itemCount - 1) * 2.50m;
        return Math.Round(baseRate + additionalPerItem, 2);
    }
}
