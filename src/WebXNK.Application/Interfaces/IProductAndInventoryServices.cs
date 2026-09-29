using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IProductService
{
    Task<PaginatedResult<ProductSummaryDto>> GetProductsAsync(ProductFilterRequestDto filter);
    Task<ProductDetailDto?> GetProductByIdAsync(long id, string languageCode = "vi");
    Task<ProductDetailDto> CreateProductAsync(CreateProductRequestDto request, long createdByUserId);
}

public interface IInventoryService
{
    Task<List<WarehouseDto>> GetWarehousesAsync();
    Task<StockSummaryDto> GetStockSummaryAsync(long productId);
    Task<bool> RecordTransactionAsync(RecordStockTransactionRequestDto request, long createdByUserId);
    Task<StockReservationDto> ReserveStockAsync(ReserveStockRequestDto request);
    Task<bool> ReleaseReservationAsync(long reservationId);
    Task<bool> ConfirmReservationAsync(ConfirmReservationRequestDto request, long createdByUserId);
    Task<bool> TransferStockAsync(TransferStockRequestDto request, long createdByUserId);
    Task<int> CleanupExpiredReservationsAsync();
}
