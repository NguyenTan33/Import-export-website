using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class ExportDocument : BaseEntity<long>
{
    public long? RfqId { get; set; }
    public RfqRequest? RfqRequest { get; set; }

    public long? OrderId { get; set; }
    public Order? Order { get; set; }

    public string DocumentType { get; set; } = string.Empty; // PROFORMA_INVOICE, COMMERCIAL_INVOICE, PACKING_LIST, BILL_OF_LADING, CERTIFICATE_OF_ORIGIN
    public string DocumentNumber { get; set; } = string.Empty;
    public string PdfFileUrl { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public long GeneratedBy { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog : BaseEntity<long>
{
    public long? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string? OldValuesJson { get; set; }
    public string? NewValuesJson { get; set; }
    public string? IpAddress { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}

public class ProcessedWebhookEvent
{
    public string EventId { get; set; } = string.Empty; // Stripe event id: evt_xxx
    public string EventType { get; set; } = string.Empty;
    public DateTime ProcessedAt { get; set; } = DateTime.UtcNow;
}
