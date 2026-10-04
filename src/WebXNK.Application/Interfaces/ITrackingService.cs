using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface ITrackingService
{
    Task<ShipmentTrackingDetailDto?> GetShipmentByTrackingNumberAsync(string trackingOrBlNumber, CancellationToken cancellationToken = default);
    Task<List<ShipmentTrackingDetailDto>> GetActiveShipmentsAsync(CancellationToken cancellationToken = default);
}
