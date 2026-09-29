using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class PricingController : BaseApiController
{
    private readonly ITierPricingService _tierPricingService;

    public PricingController(ITierPricingService tierPricingService)
    {
        _tierPricingService = tierPricingService;
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
}
