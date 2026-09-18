namespace WebXNK.Application.DTOs;

public class ExportDocumentDto
{
    public long Id { get; set; }
    public long? RfqId { get; set; }
    public long? OrderId { get; set; }
    public string DocumentType { get; set; } = string.Empty; // PROFORMA_INVOICE, COMMERCIAL_INVOICE, PACKING_LIST
    public string DocumentNumber { get; set; } = string.Empty;
    public string PdfFileUrl { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public long GeneratedBy { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class DocumentGenerationResultDto
{
    public long DocumentId { get; set; }
    public string DocumentType { get; set; } = string.Empty;
    public string DocumentNumber { get; set; } = string.Empty;
    public string PdfFileUrl { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public decimal TotalAmountUsd { get; set; }
    public decimal TotalCbm { get; set; }
    public decimal TotalGrossWeightKg { get; set; }
    public string SuggestedContainerType { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
