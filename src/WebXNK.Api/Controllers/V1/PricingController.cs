using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class PricingController : BaseApiController
{
    private readonly ITierPricingService _tierPricingService;
    private readonly IIncotermsCalculationService _incotermsService;

    public PricingController(
        ITierPricingService tierPricingService,
        IIncotermsCalculationService incotermsService)
    {
        _tierPricingService = tierPricingService;
        _incotermsService = incotermsService;
    }

    /// <summary>
    /// Tính toán bảng giá bậc thang sỉ/lẻ B2B theo số lượng đặt hàng (MOQ) và tiền tệ
    /// </summary>
    [HttpPost("calculate-tier")]
    [ProducesResponseType(typeof(ApiResponse<CalculateTierPriceResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CalculateTierPrice([FromBody] CalculateTierPriceRequestDto request)
    {
        try
        {
            var result = await _tierPricingService.CalculatePriceAsync(request);
            return Ok(ApiResponse<CalculateTierPriceResponseDto>.Ok(result, "Tính toán định giá theo bậc thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<CalculateTierPriceResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Động cơ tính toán báo giá Incoterms 2020 gồm cước biển (Ocean Freight) và bảo hiểm hàng hải (Marine Insurance) (EXP-47, EXP-51)
    /// </summary>
    [HttpPost("calculate-incoterms")]
    [ProducesResponseType(typeof(ApiResponse<CalculateIncotermsQuoteResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CalculateIncoterms([FromBody] CalculateIncotermsQuoteRequestDto request)
    {
        try
        {
            var result = await _incotermsService.CalculateIncotermsQuoteAsync(request);
            return Ok(ApiResponse<CalculateIncotermsQuoteResponseDto>.Ok(result, "Tính toán báo giá Incoterms thành công."));
        }
        catch (NotSupportedException ex)
        {
            return BadRequest(ApiResponse<CalculateIncotermsQuoteResponseDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }
}
