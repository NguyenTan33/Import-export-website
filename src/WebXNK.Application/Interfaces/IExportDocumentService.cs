using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IExportDocumentService
{
    Task<DocumentGenerationResultDto> GenerateProformaInvoiceAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default);

    Task<DocumentGenerationResultDto> GenerateCommercialInvoiceAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default);

    Task<DocumentGenerationResultDto> GeneratePackingListAsync(
        long rfqId, 
        long generatedByUserId, 
        CancellationToken cancellationToken = default);

    Task<List<ExportDocumentDto>> GetDocumentsByRfqAsync(
        long rfqId, 
        CancellationToken cancellationToken = default);

    Task<(Stream Stream, string ContentType, string FileName)> GetDocumentFileAsync(
        long documentId, 
        CancellationToken cancellationToken = default);
}
