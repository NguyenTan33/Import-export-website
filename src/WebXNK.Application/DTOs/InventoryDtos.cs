namespace WebXNK.Application.DTOs;

public class WarehouseDto
{
    public int Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WarehouseType { get; set; } = string.Empty; // FACTORY_CENTRAL, PORT_BONDED, DOMESTIC
    public string Address { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}

public class StockSummaryDto
{
    public long ProductId { get; set; }
    public string BaseSku { get; set; } = string.Empty;
    public string ProductName { get; set; } = string.Empty;
    public int TotalPhysicalStock { get; set; }
    public int TotalReservedStock { get; set; }
    public int AvailableStock { get; set; }
    public List<WarehouseStockDto> WarehouseBreakdown { get; set; } = new();
}

public class WarehouseStockDto
{
    public int WarehouseId { get; set; }
    public string WarehouseCode { get; set; } = string.Empty;
    public string WarehouseName { get; set; } = string.Empty;
    public int CurrentStock { get; set; }
}

public class RecordStockTransactionRequestDto
{
    public int WarehouseId { get; set; }
    public long ProductId { get; set; }
    public string TransactionType { get; set; } = "IMPORT_PO"; // IMPORT_PO, B2C_SHIPPED, B2B_EXPORTED, ADJUSTMENT, INITIAL_STOCK
    public int QuantityChange { get; set; } // Số dương khi nhập, số âm khi xuất
    public string ReferenceType { get; set; } = "PO";
    public string ReferenceId { get; set; } = string.Empty;
    public string? Note { get; set; }
}

public class ReserveStockRequestDto
{
    public int WarehouseId { get; set; }
    public long ProductId { get; set; }
    public int Quantity { get; set; }
    public string ReservedForType { get; set; } = "B2C_ORDER"; // B2C_ORDER, B2B_RFQ, B2B_PROFORMA
    public string ReservedForId { get; set; } = string.Empty;
    public int DurationMinutes { get; set; } = 30; // Mặc định 30 phút theo yêu cầu EXP-79
}

public class StockReservationDto
{
    public long Id { get; set; }
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public long ProductId { get; set; }
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string ReservedForType { get; set; } = string.Empty;
    public string ReservedForId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsReleased { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransferStockRequestDto
{
    public int FromWarehouseId { get; set; } // Ví dụ: Kho Bình Dương
    public int ToWarehouseId { get; set; }   // Ví dụ: Kho Cát Lái
    public long ProductId { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class ConfirmReservationRequestDto
{
    public long ReservationId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string? Note { get; set; }
}
