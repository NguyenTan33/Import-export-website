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
    /// Thuật toán tối ưu hóa CBM và đóng Container xuất khẩu cho 1 loại hàng (20ft, 40ft HC, FCL / LCL)
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

    /// <summary>
    /// Động cơ tối ưu hóa đóng hàng hỗn hợp (Mixed Cargo) và Pallet cho nhiều sản phẩm khác nhau (EXP-64, EXP-65)
    /// </summary>
    [HttpPost("cbm-calculator/multi-item")]
    [ProducesResponseType(typeof(ApiResponse<CalculateMultiItemCbmResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public IActionResult CalculateMultiItemContainer([FromBody] CalculateMultiItemCbmRequestDto request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(ApiResponse<CalculateMultiItemCbmResponseDto>.Fail(
                StatusCodes.Status400BadRequest,
                "Danh sách sản phẩm đóng hàng không được rỗng."));
        }

        var result = _cbmCalculatorService.CalculateMultiItem(request);
        return Ok(ApiResponse<CalculateMultiItemCbmResponseDto>.Ok(result, "Tối ưu hóa đóng hàng container hỗn hợp thành công."));
    }

    /// <summary>
    /// Tự động quét thông số bao bì đóng gói và tối ưu phương án đóng container cho đơn chào giá xuất khẩu (RFQ)
    /// </summary>
    /// <param name="rfqId">ID đơn RFQ</param>
    [HttpPost("rfq/{rfqId:long}/optimize-packing")]
    [ProducesResponseType(typeof(ApiResponse<RfqPackingOptimizationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> OptimizePackingForRfq(long rfqId)
    {
        var result = await _cbmCalculatorService.OptimizePackingForRfqAsync(rfqId);
        return Ok(ApiResponse<RfqPackingOptimizationResultDto>.Ok(result, "Tối ưu phương án container cho hồ sơ RFQ thành công."));
    }
}
