using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IContractService
{
    Task<SalesContractDto> GenerateContractFromRfqAsync(long rfqId, CancellationToken cancellationToken = default);
    Task<SalesContractDto?> GetContractByRfqIdAsync(long rfqId, CancellationToken cancellationToken = default);
    Task<SalesContractDto?> GetContractByIdAsync(long contractId, CancellationToken cancellationToken = default);
    Task<SalesContractDto> SignContractSellerAsync(long contractId, SignContractRequestDto dto, CancellationToken cancellationToken = default);
    Task<SalesContractDto> SignContractBuyerAsync(long contractId, SignContractRequestDto dto, CancellationToken cancellationToken = default);

    Task<RfqCounterOfferDto> SubmitCounterOfferAsync(long rfqId, long currentUserId, string userRole, SubmitCounterOfferRequestDto dto, CancellationToken cancellationToken = default);
    Task<List<RfqCounterOfferDto>> GetCounterOffersByRfqIdAsync(long rfqId, CancellationToken cancellationToken = default);
    Task<bool> AcceptCounterOfferAsync(long rfqId, long counterOfferId, CancellationToken cancellationToken = default);

    Task<(byte[] PdfBytes, string FileName)> GenerateContractPdfAsync(long contractId, CancellationToken cancellationToken = default);
}
