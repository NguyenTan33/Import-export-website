using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class Currency
{
    public string Code { get; set; } = string.Empty; // 'USD', 'EUR', 'VND', 'JPY'
    public string Name { get; set; } = string.Empty;
    public string Symbol { get; set; } = string.Empty;
    public int DecimalPlaces { get; set; } = 2;
    public bool IsBaseCurrency { get; set; }
    public bool IsActive { get; set; } = true;

    public ICollection<ExchangeRate> FromExchangeRates { get; set; } = new List<ExchangeRate>();
    public ICollection<ExchangeRate> ToExchangeRates { get; set; } = new List<ExchangeRate>();
}

public class ExchangeRate : BaseEntity<long>
{
    public string FromCurrency { get; set; } = string.Empty;
    public Currency FromCurrencyNavigation { get; set; } = null!;

    public string ToCurrency { get; set; } = string.Empty;
    public Currency ToCurrencyNavigation { get; set; } = null!;

    public decimal Rate { get; set; }
    public string Source { get; set; } = "OpenExchangeRates";
    public DateTime FetchedAt { get; set; } = DateTime.UtcNow;
}

public class ProductPriceTier : BaseEntity<long>
{
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal DiscountPercentage { get; set; }
}
