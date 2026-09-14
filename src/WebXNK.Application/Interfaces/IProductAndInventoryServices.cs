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
    Task<StockSummaryDto> GetStockSummaryAsync(long productId);
    Task<bool> RecordTransactionAsync(RecordStockTransactionRequestDto request, long createdByUserId);
}
