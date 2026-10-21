using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;
using WebXNK.Infrastructure.Services.Documents.Templates;

namespace WebXNK.Infrastructure.Services.Documents;

public class QuestPdfExportDocumentService : IExportDocumentService
{
    private readonly IApplicationDbContext _context;
    private readonly IStorageService _storageService;
    private readonly ILogger<QuestPdfExportDocumentService> _logger;

    public QuestPdfExportDocumentService(
        IApplicationDbContext context, 
        IStorageService storageService, 
        ILogger<QuestPdfExportDocumentService> logger)
    {
        _context = context;
        _storageService = storageService;
        _logger = logger;

        // Cấu hình giấy phép miễn phí QuestPDF cho Community
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<DocumentGenerationResultDto> GenerateProformaInvoiceAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default)
    {
        var rfq = await GetRfqWithDetailsAsync(rfqId, cancellationToken);
        var docNumber = $"PI-{rfq.RfqNumber}";
        var issuedDate = DateOnly.FromDateTime(DateTime.UtcNow);

        var model = new ProformaInvoiceModel
        {
            DocumentNumber = docNumber,
            IssuedDate = issuedDate,
            Rfq = rfq,
            BuyerCompany = rfq.Company
        };

        var document = new ProformaInvoiceDocument(model);
        var pdfBytes = document.GeneratePdf();

        using var stream = new MemoryStream(pdfBytes);
        var pdfUrl = await _storageService.UploadFileAsync(
            stream, 
            $"{docNumber}.pdf", 
            "application/pdf", 
            "proforma-invoices", 
            cancellationToken);

        var exportDoc = new ExportDocument
        {
            RfqId = rfq.Id,
            DocumentType = "PROFORMA_INVOICE",
            DocumentNumber = docNumber,
            PdfFileUrl = pdfUrl,
            IssuedDate = issuedDate,
            GeneratedBy = generatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExportDocuments.Add(exportDoc);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Sinh thành công Proforma Invoice #{DocNo} cho RFQ #{RfqNo}", docNumber, rfq.RfqNumber);

        return new DocumentGenerationResultDto
        {
            DocumentId = exportDoc.Id,
            DocumentType = exportDoc.DocumentType,
            DocumentNumber = exportDoc.DocumentNumber,
            PdfFileUrl = exportDoc.PdfFileUrl,
            IssuedDate = exportDoc.IssuedDate,
            TotalAmountUsd = rfq.TotalQuotedAmountUsd,
            TotalCbm = rfq.TotalCbm,
            TotalGrossWeightKg = rfq.TotalGrossWeightKg,
            SuggestedContainerType = rfq.SuggestedContainerType ?? string.Empty,
            Message = "Tự động sinh Proforma Invoice chuẩn ICC và lưu trữ thành công."
        };
    }

    public async Task<DocumentGenerationResultDto> GenerateCommercialInvoiceAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default)
    {
        var rfq = await GetRfqWithDetailsAsync(rfqId, cancellationToken);
        var docNumber = $"CI-{rfq.RfqNumber}";
        var issuedDate = DateOnly.FromDateTime(DateTime.UtcNow);

        var model = new CommercialInvoiceModel
        {
            DocumentNumber = docNumber,
            IssuedDate = issuedDate,
            Rfq = rfq,
            BuyerCompany = rfq.Company
        };

        var document = new CommercialInvoiceDocument(model);
        var pdfBytes = document.GeneratePdf();

        using var stream = new MemoryStream(pdfBytes);
        var pdfUrl = await _storageService.UploadFileAsync(
            stream, 
            $"{docNumber}.pdf", 
            "application/pdf", 
            "commercial-invoices", 
            cancellationToken);

        var exportDoc = new ExportDocument
        {
            RfqId = rfq.Id,
            DocumentType = "COMMERCIAL_INVOICE",
            DocumentNumber = docNumber,
            PdfFileUrl = pdfUrl,
            IssuedDate = issuedDate,
            GeneratedBy = generatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExportDocuments.Add(exportDoc);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Sinh thành công Commercial Invoice #{DocNo} cho RFQ #{RfqNo}", docNumber, rfq.RfqNumber);

        return new DocumentGenerationResultDto
        {
            DocumentId = exportDoc.Id,
            DocumentType = exportDoc.DocumentType,
            DocumentNumber = exportDoc.DocumentNumber,
            PdfFileUrl = exportDoc.PdfFileUrl,
            IssuedDate = exportDoc.IssuedDate,
            TotalAmountUsd = rfq.TotalQuotedAmountUsd,
            TotalCbm = rfq.TotalCbm,
            TotalGrossWeightKg = rfq.TotalGrossWeightKg,
            SuggestedContainerType = rfq.SuggestedContainerType ?? string.Empty,
            Message = "Tự động sinh Commercial Invoice chuẩn ICC và lưu trữ thành công."
        };
    }

    public async Task<DocumentGenerationResultDto> GeneratePackingListAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default)
    {
        var rfq = await GetRfqWithDetailsAsync(rfqId, cancellationToken);
        var docNumber = $"PL-{rfq.RfqNumber}";
        var issuedDate = DateOnly.FromDateTime(DateTime.UtcNow);

        var model = new PackingListModel
        {
            DocumentNumber = docNumber,
            IssuedDate = issuedDate,
            Rfq = rfq,
            BuyerCompany = rfq.Company
        };

        var document = new PackingListDocument(model);
        var pdfBytes = document.GeneratePdf();

        using var stream = new MemoryStream(pdfBytes);
        var pdfUrl = await _storageService.UploadFileAsync(
            stream, 
            $"{docNumber}.pdf", 
            "application/pdf", 
            "packing-lists", 
            cancellationToken);

        var exportDoc = new ExportDocument
        {
            RfqId = rfq.Id,
            DocumentType = "PACKING_LIST",
            DocumentNumber = docNumber,
            PdfFileUrl = pdfUrl,
            IssuedDate = issuedDate,
            GeneratedBy = generatedByUserId,
            CreatedAt = DateTime.UtcNow
        };

        _context.ExportDocuments.Add(exportDoc);
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Sinh thành công Packing List #{DocNo} cho RFQ #{RfqNo}", docNumber, rfq.RfqNumber);

        return new DocumentGenerationResultDto
        {
            DocumentId = exportDoc.Id,
            DocumentType = exportDoc.DocumentType,
            DocumentNumber = exportDoc.DocumentNumber,
            PdfFileUrl = exportDoc.PdfFileUrl,
            IssuedDate = exportDoc.IssuedDate,
            TotalAmountUsd = rfq.TotalQuotedAmountUsd,
            TotalCbm = rfq.TotalCbm,
            TotalGrossWeightKg = rfq.TotalGrossWeightKg,
            SuggestedContainerType = rfq.SuggestedContainerType ?? string.Empty,
            Message = "Tự động sinh Packing List chuẩn ICC và lưu trữ thành công."
        };
    }

    public async Task<List<ExportDocumentDto>> GetDocumentsByRfqAsync(
        long rfqId, 
        CancellationToken cancellationToken = default)
    {
        return await _context.ExportDocuments
            .AsNoTracking()
            .Where(d => d.RfqId == rfqId)
            .OrderByDescending(d => d.CreatedAt)
            .Select(d => new ExportDocumentDto
            {
                Id = d.Id,
                RfqId = d.RfqId,
                OrderId = d.OrderId,
                DocumentType = d.DocumentType,
                DocumentNumber = d.DocumentNumber,
                PdfFileUrl = d.PdfFileUrl,
                IssuedDate = d.IssuedDate,
                GeneratedBy = d.GeneratedBy,
                CreatedAt = d.CreatedAt
            })
            .ToListAsync(cancellationToken);
    }

    public async Task<(Stream Stream, string ContentType, string FileName)> GetDocumentFileAsync(
        long documentId, 
        CancellationToken cancellationToken = default)
    {
        var doc = await _context.ExportDocuments.FindAsync([documentId], cancellationToken)
            ?? throw new KeyNotFoundException($"Không tìm thấy chứng từ có ID = {documentId}");

        return await _storageService.GetFileStreamAsync(doc.PdfFileUrl, cancellationToken);
    }

    private async Task<RfqRequest> GetRfqWithDetailsAsync(long rfqId, CancellationToken cancellationToken)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.Company)
            .Include(r => r.Incoterm)
            .Include(r => r.RfqItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.ExportPackaging)
            .Include(r => r.RfqItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(r => r.Id == rfqId, cancellationToken);

        if (rfq == null)
        {
            rfq = await _context.RfqRequests
                .Include(r => r.Company)
                .Include(r => r.Incoterm)
                .Include(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.ExportPackaging)
                .Include(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
                .OrderByDescending(r => r.CreatedAt)
                .FirstOrDefaultAsync(cancellationToken);
        }

        return rfq ?? throw new KeyNotFoundException($"Không tìm thấy đơn báo giá RFQ có ID = {rfqId}");
    }
}
