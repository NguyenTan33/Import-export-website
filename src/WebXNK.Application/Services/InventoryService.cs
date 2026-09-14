using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;

    public InventoryService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<StockSummaryDto> GetStockSummaryAsync(long productId)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.Translations)
            .FirstOrDefaultAsync(p => p.Id == productId)
            ?? throw new KeyNotFoundException($"Không tìm thấy sản phẩm có ID = {productId}");

        var pName = product.Translations.FirstOrDefault(t => t.LanguageCode == "vi")?.Name 
                 ?? product.Translations.FirstOrDefault()?.Name 
                 ?? product.BaseSku;

        // 1. Tính tổng tồn kho vật lý theo từng kho từ Sổ cái (Ledger)
        var warehouseStocks = await _context.InventoryLedger
            .AsNoTracking()
            .Where(l => l.ProductId == productId)
            .GroupBy(l => l.WarehouseId)
            .Select(g => new
            {
                WarehouseId = g.Key,
                TotalQty = g.Sum(x => x.QuantityChange)
            })
            .ToListAsync();

        var warehouses = await _context.Warehouses
            .AsNoTracking()
            .Where(w => w.IsActive)
            .ToListAsync();

        var warehouseBreakdowns = warehouses.Select(w =>
        {
            var stock = warehouseStocks.FirstOrDefault(s => s.WarehouseId == w.Id)?.TotalQty ?? 0;
            return new WarehouseStockDto
            {
                WarehouseId = w.Id,
                WarehouseCode = w.Code,
                WarehouseName = w.Name,
                CurrentStock = Math.Max(0, stock)
            };
        }).ToList();

        var totalPhysical = warehouseBreakdowns.Sum(w => w.CurrentStock);

        // 2. Tính số lượng đang bị giữ chỗ tạm thời (Reservation 30 phút - EXP-79)
        var totalReserved = await _context.StockReservations
            .AsNoTracking()
            .Where(r => r.ProductId == productId && !r.IsReleased && r.ExpiresAt > DateTime.UtcNow)
            .SumAsync(r => r.Quantity);

        var available = Math.Max(0, totalPhysical - totalReserved);

        return new StockSummaryDto
        {
            ProductId = product.Id,
            BaseSku = product.BaseSku,
            ProductName = pName,
            TotalPhysicalStock = totalPhysical,
            TotalReservedStock = totalReserved,
            AvailableStock = available,
            WarehouseBreakdown = warehouseBreakdowns
        };
    }

    public async Task<bool> RecordTransactionAsync(RecordStockTransactionRequestDto request, long createdByUserId)
    {
        if (request.QuantityChange == 0)
        {
            throw new ArgumentException("Số lượng biến động kho (QuantityChange) không được bằng 0.");
        }

        var warehouseExists = await _context.Warehouses.AnyAsync(w => w.Id == request.WarehouseId && w.IsActive);
        if (!warehouseExists)
        {
            throw new KeyNotFoundException($"Kho hàng có ID = {request.WarehouseId} không tồn tại hoặc đã ngừng hoạt động.");
        }

        var productExists = await _context.Products.AnyAsync(p => p.Id == request.ProductId && p.IsActive);
        if (!productExists)
        {
            throw new KeyNotFoundException($"Sản phẩm có ID = {request.ProductId} không tồn tại.");
        }

        // Nếu là xuất kho (QuantityChange âm), kiểm tra xem tồn kho tại kho đó có đủ không
        if (request.QuantityChange < 0)
        {
            var currentStockInWarehouse = await _context.InventoryLedger
                .Where(l => l.WarehouseId == request.WarehouseId && l.ProductId == request.ProductId)
                .SumAsync(l => l.QuantityChange);

            if (currentStockInWarehouse + request.QuantityChange < 0)
            {
                throw new InvalidOperationException($"Số lượng xuất ({Math.Abs(request.QuantityChange)}) vượt quá tồn kho khả dụng ({currentStockInWarehouse}) tại kho này.");
            }
        }

        var ledgerEntry = new InventoryLedger
        {
            WarehouseId = request.WarehouseId,
            ProductId = request.ProductId,
            TransactionType = request.TransactionType.ToUpperInvariant(),
            QuantityChange = request.QuantityChange,
            ReferenceType = request.ReferenceType.ToUpperInvariant(),
            ReferenceId = string.IsNullOrWhiteSpace(request.ReferenceId) ? Guid.NewGuid().ToString() : request.ReferenceId.Trim(),
            Note = request.Note?.Trim(),
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryLedger.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return true;
    }
}
