using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface ICbmCalculatorService
{
    CalculateCbmResponseDto Calculate(CalculateCbmRequestDto request);
}

public interface ITierPricingService
{
    Task<CalculateTierPriceResponseDto> CalculatePriceAsync(CalculateTierPriceRequestDto request);
}
