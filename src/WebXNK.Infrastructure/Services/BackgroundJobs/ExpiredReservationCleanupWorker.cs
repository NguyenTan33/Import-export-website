using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using WebXNK.Application.Interfaces;

namespace WebXNK.Infrastructure.Services.BackgroundJobs;

public class ExpiredReservationCleanupWorker : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExpiredReservationCleanupWorker> _logger;
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

    public ExpiredReservationCleanupWorker(
        IServiceProvider serviceProvider, 
        ILogger<ExpiredReservationCleanupWorker> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("ExpiredReservationCleanupWorker đã bắt đầu chạy ngầm (chu kỳ quét: {Interval} phút)...", _checkInterval.TotalMinutes);

        try
        {
            using var timer = new PeriodicTimer(_checkInterval);

            while (!stoppingToken.IsCancellationRequested && await timer.WaitForNextTickAsync(stoppingToken))
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var inventoryService = scope.ServiceProvider.GetRequiredService<IInventoryService>();

                    var cleanedCount = await inventoryService.CleanupExpiredReservationsAsync();
                    if (cleanedCount > 0)
                    {
                        _logger.LogInformation("Đã tự động hoàn trả {Count} phiếu giữ hàng (Reservation) quá hạn 30 phút về tồn kho khả dụng.", cleanedCount);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi quét dọn các phiếu giữ hàng quá hạn trong ExpiredReservationCleanupWorker.");
                }
            }
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("ExpiredReservationCleanupWorker đã dừng lại an toàn (Graceful Shutdown).");
        }
    }
}
