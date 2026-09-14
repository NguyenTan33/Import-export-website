using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class LogisticsController : BaseApiController
{
    private readonly ICbmCalculatorService _cbmCalculatorService;

    public LogisticsController(ICbmCalculatorService cbmCalculatorService)
    {
        _cbmCalculatorService = cbmCalculatorService;
    }

    /// <summary>
    /// Thuật toán tối ưu hóa CBM và đóng Container xuất khẩu (20ft, 40ft HC, FCL / LCL)
    /// </summary>
    [HttpPost("cbm-calculator")]
    [ProducesResponseType(typeof(ApiResponse<CalculateCbmResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CalculateContainerCbm([FromBody] CalculateCbmRequestDto request)
    {
        if (request.CartonLengthCm <= 0 || request.CartonWidthCm <= 0 || request.CartonHeightCm <= 0)
        {
            return BadRequest(ApiResponse<CalculateCbmResponseDto>.Fail(
                StatusCodes.Status400BadRequest, 
                "Kích thước thùng carton (Dài, Rộng, Cao) phải lớn hơn 0."));
        }

        if (request.TotalCartons <= 0)
        {
            return BadRequest(ApiResponse<CalculateCbmResponseDto>.Fail(
                StatusCodes.Status400BadRequest, 
                "Tổng số lượng thùng carton phải lớn hơn hoặc bằng 1."));
        }

        var result = _cbmCalculatorService.Calculate(request);
        return Ok(ApiResponse<CalculateCbmResponseDto>.Ok(result, "Tính toán phương án đóng container thành công."));
    }
}
