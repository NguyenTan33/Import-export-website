using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class Warehouse : BaseEntity<int>
{
    public string Code { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string WarehouseType { get; set; } = "DOMESTIC";
    public string Address { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;

    public ICollection<InventoryLedger> InventoryLedgers { get; set; } = new List<InventoryLedger>();
    public ICollection<StockReservation> StockReservations { get; set; } = new List<StockReservation>();
}

public class InventoryLedger : BaseEntity<long>
{
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string TransactionType { get; set; } = string.Empty;
    public int QuantityChange { get; set; }
    public string ReferenceType { get; set; } = string.Empty;
    public string ReferenceId { get; set; } = string.Empty;
    public string? Note { get; set; }
    public long CreatedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class StockReservation : BaseEntity<long>
{
    public int WarehouseId { get; set; }
    public Warehouse Warehouse { get; set; } = null!;

    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public int Quantity { get; set; }
    public string ReservedForType { get; set; } = string.Empty;
    public string ReservedForId { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsReleased { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ShipmentMilestone : BaseEntity<long>
{
    public long RfqId { get; set; }
    public RfqRequest RfqRequest { get; set; } = null!;

    public string TrackingNumber { get; set; } = string.Empty;
    public string VesselName { get; set; } = string.Empty;
    public string VoyageNumber { get; set; } = string.Empty;
    public string MilestoneStatus { get; set; } = string.Empty;
    public DateOnly? EstimatedArrivalDate { get; set; }
    public DateTime? ActualDate { get; set; }
    public string? CurrentLocation { get; set; }
    public string? Note { get; set; }
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
