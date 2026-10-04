using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IAnalyticsService
{
    Task<ExportAnalyticsResponseDto> GetExportAnalyticsAsync(CancellationToken cancellationToken = default);
}
