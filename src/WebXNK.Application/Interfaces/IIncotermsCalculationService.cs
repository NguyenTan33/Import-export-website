using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IIncotermsCalculationService
{
    Task<CalculateIncotermsQuoteResponseDto> CalculateIncotermsQuoteAsync(CalculateIncotermsQuoteRequestDto request);
    Task<CalculateLandedCostResponseDto> CalculateLandedCostAsync(CalculateLandedCostRequestDto request);
    Task<decimal> EstimateOceanFreightAsync(string portOfLoading, string portOfDischarge, decimal totalCbm, decimal grossWeightKg);
    decimal CalculateMarineInsurance(decimal cfrAmountUsd, decimal insuranceRatePercent = 0.35m);
}
