using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WebXNK.Application.Common.Interfaces;

namespace WebXNK.Infrastructure.Services.BackgroundJobs;

/// <summary>
/// BackgroundService quét và đóng các RFQ đã hết hạn hiệu lực giá (Price Validity) (EXP-95).
/// </summary>
public class ExpiredRfqCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredRfqCleanupWorker> _logger;

    public ExpiredRfqCleanupWorker(
        IServiceProvider serviceProvider,
        ILogger<ExpiredRfqCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpiredRfqCleanupWorker đã khởi động.");

        await Task.Delay(TimeSpan.FromSeconds(15), stoppingToken);

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await CleanupExpiredRfqsAsync(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Lỗi xảy ra trong quá trình quét RFQ hết hạn.");
            }

            // Quét định kỳ mỗi 6 tiếng
            await Task.Delay(TimeSpan.FromHours(6), stoppingToken);
        }
    }

    private async Task CleanupExpiredRfqsAsync(CancellationToken cancellationToken)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<IApplicationDbContext>();

        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var expiredRfqs = await context.RfqRequests
            .Where(r => r.Status == "QUOTED" && r.PriceValidityUntil.HasValue && r.PriceValidityUntil.Value < today)
            .ToListAsync(cancellationToken);

        if (expiredRfqs.Count > 0)
        {
            foreach (var rfq in expiredRfqs)
            {
                rfq.Status = "EXPIRED";
                rfq.UpdatedAt = DateTime.UtcNow;
                _logger.LogInformation("RFQ #{RfqNumber} (ID: {RfqId}) đã hết hạn hiệu lực giá ngày {ValidityDate}, chuyển trạng thái sang EXPIRED.", 
                    rfq.RfqNumber, rfq.Id, rfq.PriceValidityUntil);
            }

            await context.SaveChangesAsync(cancellationToken);
        }
    }
}
