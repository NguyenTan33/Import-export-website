using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public InventoryService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<WarehouseDto>> GetWarehousesAsync()
    {
        const string cacheKey = "Inventory_Warehouses_All";
        if (_cache != null && _cache.TryGetValue(cacheKey, out List<WarehouseDto>? cached) && cached != null)
        {
            return cached;
        }

        var list = await _context.Warehouses
            .AsNoTracking()
            .Where(w => w.IsActive)
            .OrderBy(w => w.Id)
            .Select(w => new WarehouseDto
            {
                Id = w.Id,
                Code = w.Code,
                Name = w.Name,
                WarehouseType = w.WarehouseType,
                Address = w.Address,
                IsActive = w.IsActive
            })
            .ToListAsync();

        _cache?.Set(cacheKey, list, TimeSpan.FromMinutes(30));
        return list;
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

        // Tối ưu: Lấy danh sách kho bãi từ bộ nhớ cache thay vì truy vấn lại database
        var warehouses = await GetWarehousesAsync();

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

    public async Task<List<StockSummaryDto>> GetAllStockSummariesAsync()
    {
        var products = await _context.Products.AsNoTracking()
            .Include(p => p.Translations).ToListAsync();
        var warehouses = await GetWarehousesAsync();
        var ledger = await _context.InventoryLedger.AsNoTracking()
            .GroupBy(x => new { x.ProductId, x.WarehouseId })
            .Select(g => new { g.Key.ProductId, g.Key.WarehouseId, Quantity = g.Sum(x => x.QuantityChange) })
            .ToListAsync();
        var reservations = await _context.StockReservations.AsNoTracking()
            .Where(x => !x.IsReleased && x.ExpiresAt > DateTime.UtcNow)
            .GroupBy(x => x.ProductId).Select(g => new { ProductId = g.Key, Quantity = g.Sum(x => x.Quantity) })
            .ToListAsync();

        return products.Select(product =>
        {
            var breakdown = warehouses.Select(warehouse => new WarehouseStockDto
            {
                WarehouseId = warehouse.Id,
                WarehouseCode = warehouse.Code,
                WarehouseName = warehouse.Name,
                CurrentStock = Math.Max(0, ledger.FirstOrDefault(x => x.ProductId == product.Id && x.WarehouseId == warehouse.Id)?.Quantity ?? 0)
            }).ToList();
            var physical = breakdown.Sum(x => x.CurrentStock);
            var reserved = reservations.FirstOrDefault(x => x.ProductId == product.Id)?.Quantity ?? 0;
            return new StockSummaryDto
            {
                ProductId = product.Id,
                BaseSku = product.BaseSku,
                ProductName = product.Translations.FirstOrDefault(x => x.LanguageCode == "vi")?.Name ?? product.BaseSku,
                TotalPhysicalStock = physical,
                TotalReservedStock = reserved,
                AvailableStock = Math.Max(0, physical - reserved),
                WarehouseBreakdown = breakdown
            };
        }).ToList();
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
            ReferenceId = string.IsNullOrWhiteSpace(request.ReferenceId) ? Guid.NewGuid().ToString("N") : request.ReferenceId.Trim(),
            Note = request.Note?.Trim(),
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryLedger.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<StockReservationDto> ReserveStockAsync(ReserveStockRequestDto request)
    {
        if (request.Quantity <= 0)
        {
            throw new ArgumentException("Số lượng giữ hàng (Quantity) phải lớn hơn 0.");
        }

        var warehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.WarehouseId && w.IsActive)
            ?? throw new KeyNotFoundException($"Kho hàng ID = {request.WarehouseId} không tồn tại hoặc đã ngừng hoạt động.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive)
            ?? throw new KeyNotFoundException($"Sản phẩm ID = {request.ProductId} không tồn tại.");

        // Kiểm tra tồn kho khả dụng tại kho cụ thể: Tồn kho thực tế - Giữ chỗ chưa hết hạn
        var physicalStock = await _context.InventoryLedger
            .Where(l => l.WarehouseId == request.WarehouseId && l.ProductId == request.ProductId)
            .SumAsync(l => l.QuantityChange);

        var activeReserved = await _context.StockReservations
            .Where(r => r.WarehouseId == request.WarehouseId && r.ProductId == request.ProductId && !r.IsReleased && r.ExpiresAt > DateTime.UtcNow)
            .SumAsync(r => r.Quantity);

        var availableInWarehouse = physicalStock - activeReserved;

        if (request.Quantity > availableInWarehouse)
        {
            throw new InvalidOperationException(
                $"Tồn kho khả dụng tại {warehouse.Name} không đủ để giữ hàng. Khả dụng: {Math.Max(0, availableInWarehouse)}, Yêu cầu: {request.Quantity}.");
        }

        var duration = request.DurationMinutes > 0 ? request.DurationMinutes : 30;
        var reservation = new StockReservation
        {
            WarehouseId = request.WarehouseId,
            ProductId = request.ProductId,
            Quantity = request.Quantity,
            ReservedForType = string.IsNullOrWhiteSpace(request.ReservedForType) ? "B2C_ORDER" : request.ReservedForType.Trim().ToUpperInvariant(),
            ReservedForId = string.IsNullOrWhiteSpace(request.ReservedForId) ? Guid.NewGuid().ToString("N") : request.ReservedForId.Trim(),
            ExpiresAt = DateTime.UtcNow.AddMinutes(duration),
            IsReleased = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.StockReservations.Add(reservation);
        await _context.SaveChangesAsync();

        return new StockReservationDto
        {
            Id = reservation.Id,
            WarehouseId = warehouse.Id,
            WarehouseName = warehouse.Name,
            ProductId = product.Id,
            ProductSku = product.BaseSku,
            Quantity = reservation.Quantity,
            ReservedForType = reservation.ReservedForType,
            ReservedForId = reservation.ReservedForId,
            ExpiresAt = reservation.ExpiresAt,
            IsReleased = reservation.IsReleased,
            CreatedAt = reservation.CreatedAt
        };
    }

    public async Task<bool> ReleaseReservationAsync(long reservationId)
    {
        var reservation = await _context.StockReservations.FindAsync(reservationId)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu giữ hàng có ID = {reservationId}");

        if (reservation.IsReleased)
        {
            return true; // Đã giải phóng trước đó
        }

        reservation.IsReleased = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> ConfirmReservationAsync(ConfirmReservationRequestDto request, long createdByUserId)
    {
        var reservation = await _context.StockReservations.FindAsync(request.ReservationId)
            ?? throw new KeyNotFoundException($"Không tìm thấy phiếu giữ hàng có ID = {request.ReservationId}");

        if (reservation.IsReleased)
        {
            throw new InvalidOperationException("Phiếu giữ hàng này đã bị hủy hoặc đã kết chuyển xuất kho trước đó.");
        }

        if (reservation.ExpiresAt <= DateTime.UtcNow)
        {
            reservation.IsReleased = true;
            await _context.SaveChangesAsync();
            throw new InvalidOperationException("Thời gian giữ hàng đã quá hạn 30 phút. Vui lòng thực hiện đặt lại.");
        }

        // 1. Đánh dấu giải phóng reservation
        reservation.IsReleased = true;

        // 2. Ghi nhận bút toán xuất kho vĩnh viễn trên sổ cái (Ledger)
        var ledgerEntry = new InventoryLedger
        {
            WarehouseId = reservation.WarehouseId,
            ProductId = reservation.ProductId,
            TransactionType = "ORDER_FULFILLED",
            QuantityChange = -reservation.Quantity, // Trừ kho
            ReferenceType = reservation.ReservedForType,
            ReferenceId = string.IsNullOrWhiteSpace(request.OrderCode) ? reservation.ReservedForId : request.OrderCode.Trim(),
            Note = request.Note ?? $"Xác nhận xuất kho từ giữ chỗ #{reservation.Id}",
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryLedger.Add(ledgerEntry);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<bool> TransferStockAsync(TransferStockRequestDto request, long createdByUserId)
    {
        if (request.Quantity <= 0)
        {
            throw new ArgumentException("Số lượng chuyển kho (Quantity) phải lớn hơn 0.");
        }

        if (request.FromWarehouseId == request.ToWarehouseId)
        {
            throw new ArgumentException("Kho xuất và kho nhập không được trùng nhau.");
        }

        var fromWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.FromWarehouseId && w.IsActive)
            ?? throw new KeyNotFoundException($"Kho xuất hàng ID = {request.FromWarehouseId} không tồn tại.");

        var toWarehouse = await _context.Warehouses.FirstOrDefaultAsync(w => w.Id == request.ToWarehouseId && w.IsActive)
            ?? throw new KeyNotFoundException($"Kho nhập hàng ID = {request.ToWarehouseId} không tồn tại.");

        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == request.ProductId && p.IsActive)
            ?? throw new KeyNotFoundException($"Sản phẩm ID = {request.ProductId} không tồn tại.");

        // Kiểm tra tồn kho tại kho xuất
        var physicalStock = await _context.InventoryLedger
            .Where(l => l.WarehouseId == request.FromWarehouseId && l.ProductId == request.ProductId)
            .SumAsync(l => l.QuantityChange);

        var activeReserved = await _context.StockReservations
            .Where(r => r.WarehouseId == request.FromWarehouseId && r.ProductId == request.ProductId && !r.IsReleased && r.ExpiresAt > DateTime.UtcNow)
            .SumAsync(r => r.Quantity);

        var available = physicalStock - activeReserved;
        if (request.Quantity > available)
        {
            throw new InvalidOperationException(
                $"Kho xuất ({fromWarehouse.Name}) không đủ hàng khả dụng để chuyển. Khả dụng: {Math.Max(0, available)}, Cần chuyển: {request.Quantity}.");
        }

        var transferCode = $"TRF-{DateTime.UtcNow:yyyyMMddHHmmss}-{Guid.NewGuid():N}"[..24];

        // Bút toán 1: Xuất khỏi kho nguồn (ví dụ: Kho Bình Dương)
        var outEntry = new InventoryLedger
        {
            WarehouseId = request.FromWarehouseId,
            ProductId = request.ProductId,
            TransactionType = "TRANSFER_OUT",
            QuantityChange = -request.Quantity,
            ReferenceType = "INTERNAL_TRANSFER",
            ReferenceId = transferCode,
            Note = request.Note ?? $"Chuyển sang {toWarehouse.Name}",
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        // Bút toán 2: Nhập vào kho đích (ví dụ: Kho Cát Lái)
        var inEntry = new InventoryLedger
        {
            WarehouseId = request.ToWarehouseId,
            ProductId = request.ProductId,
            TransactionType = "TRANSFER_IN",
            QuantityChange = request.Quantity,
            ReferenceType = "INTERNAL_TRANSFER",
            ReferenceId = transferCode,
            Note = request.Note ?? $"Nhập chuyển từ {fromWarehouse.Name}",
            CreatedBy = createdByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.InventoryLedger.AddRange(outEntry, inEntry);
        await _context.SaveChangesAsync();

        return true;
    }

    public async Task<int> CleanupExpiredReservationsAsync()
    {
        var expiredList = await _context.StockReservations
            .Where(r => !r.IsReleased && r.ExpiresAt <= DateTime.UtcNow)
            .ToListAsync();

        if (expiredList.Count == 0) return 0;

        foreach (var reservation in expiredList)
        {
            reservation.IsReleased = true;
        }

        await _context.SaveChangesAsync();
        return expiredList.Count;
    }
}
