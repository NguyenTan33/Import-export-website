using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface ICbmCalculatorService
{
    CalculateCbmResponseDto Calculate(CalculateCbmRequestDto request);
    CalculateMultiItemCbmResponseDto CalculateMultiItem(CalculateMultiItemCbmRequestDto request);
    Task<RfqPackingOptimizationResultDto> OptimizePackingForRfqAsync(long rfqId);
}

public interface ITierPricingService
{
    Task<CalculateTierPriceResponseDto> CalculatePriceAsync(CalculateTierPriceRequestDto request);
}
