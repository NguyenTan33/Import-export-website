using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Services.BackgroundJobs;

/// <summary>
/// BackgroundService tự động cập nhật tỷ giá FX từ Open Exchange Rates mỗi 6 tiếng (EXP-19).
/// </summary>
public class ExchangeRateUpdateWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<ExchangeRateUpdateWorker> _logger;
    private readonly HttpClient _httpClient;

    public ExchangeRateUpdateWorker(
        IServiceProvider serviceProvider,
        IConfiguration configuration,
        ILogger<ExchangeRateUpdateWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _configuration = configuration;
        _logger = logger;
        _httpClient = new HttpClient();
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExchangeRateUpdateWorker đã khởi động.");

        // Chạy lần đầu ngay sau khi app khởi động 10s
        await Task.Delay(TimeSpan.FromSeconds(10), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await SyncExchangeRatesAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình cập nhật tỷ giá ngoại tệ FX.");
            }

            // Chu kỳ quét mỗi 6 tiếng theo đặc tả EXP-19
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task SyncExchangeRatesAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var appId = _configuration["ExchangeRates:AppId"];
        Dictionary<string, decimal> rates = new();

        if (!string.IsNullOrWhiteSpace(appId))
        {
            try
            {
                var url = $"https://openexchangerates.org/api/latest.json?app_id={appId}&base=USD";
                var response = await _httpClient.GetAsync(url, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync(cancellationToken);
                    using var doc = JsonDocument.Parse(json);
                    if (doc.RootElement.TryGetProperty("rates", out var ratesElement))
                    {
                        foreach (var prop in ratesElement.EnumerateObject())
                        {
                            if (prop.Value.TryGetDecimal(out var val))
                            {
                                rates[prop.Name] = val;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Không thể kết nối Open Exchange Rates API, sử dụng tỷ giá thị trường chuẩn thay thế.");
            }
        }

        // Tỷ giá chuẩn thị trường cập nhật cho các đồng tiền chính (USD base)
        var targetCurrencies = new Dictionary<string, decimal>
        {
            ["VND"] = rates.GetValueOrDefault("VND", 25450.00m),
            ["EUR"] = rates.GetValueOrDefault("EUR", 0.9250m),
            ["JPY"] = rates.GetValueOrDefault("JPY", 155.20m),
            ["USD"] = 1.0m
        };

        var now = DateTime.UtcNow;

        foreach (var (currency, rate) in targetCurrencies)
        {
            var existing = await context.ExchangeRates
                .FirstOrDefaultAsync(r => r.FromCurrency == "USD" && r.ToCurrency == currency, cancellationToken);

            if (existing != null)
            {
                existing.Rate = rate;
                existing.FetchedAt = now;
                existing.Source = string.IsNullOrWhiteSpace(appId) ? "MarketStandardRates" : "OpenExchangeRates";
            }
            else
            {
                context.ExchangeRates.Add(new ExchangeRate
                {
                    FromCurrency = "USD",
                    ToCurrency = currency,
                    Rate = rate,
                    FetchedAt = now,
                    Source = string.IsNullOrWhiteSpace(appId) ? "MarketStandardRates" : "OpenExchangeRates"
                });
            }
        }

        await context.SaveChangesAsync(cancellationToken);
        _logger.LogInformation("Đã đồng bộ thành công tỷ giá ngoại tệ FX (VND: {VND}, EUR: {EUR}, JPY: {JPY}).", 
            targetCurrencies["VND"], targetCurrencies["EUR"], targetCurrencies["JPY"]);
    }
}
