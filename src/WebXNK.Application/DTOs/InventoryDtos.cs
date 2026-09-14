namespace WebXNK.Application.DTOs;

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
    public string TransactionType { get; set; } = "IMPORT_PO"; // IMPORT_PO, B2C_SHIPPED, B2B_EXPORTED, ADJUSTMENT
    public int QuantityChange { get; set; } // Số dương khi nhập, số âm khi xuất
    public string ReferenceType { get; set; } = "PO";
    public string ReferenceId { get; set; } = string.Empty;
    public string? Note { get; set; }
}
