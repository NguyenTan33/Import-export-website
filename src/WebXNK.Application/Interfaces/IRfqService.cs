using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IRfqService
{
    Task<RfqDetailDto> CreateRfqAsync(long userId, CreateRfqRequestDto request);
    Task<RfqDetailDto> GetRfqByIdAsync(long rfqId, long? requestingUserId = null);
    Task<List<RfqSummaryDto>> GetCompanyRfqsAsync(long companyId);
    Task<List<RfqSummaryDto>> GetAllRfqsAsync(string? status = null);

    // Sales báo giá
    Task<RfqDetailDto> SubmitOfficialQuotationAsync(long salesUserId, long rfqId, SubmitQuotationDto request);

    // Đàm phán thương lượng nhiều vòng
    Task<RfqDetailDto> AddCounterOfferAsync(long userId, long rfqId, CounterOfferRequestDto request);

    // Khách chấp thuận báo giá
    Task<RfqDetailDto> AcceptQuotationAsync(long userId, long rfqId);
}
