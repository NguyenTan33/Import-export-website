using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Api.Controllers.V1;

public class LogisticsController : BaseApiController
{
    private readonly ICbmCalculatorService _cbmCalculatorService;
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public LogisticsController(
        ICbmCalculatorService cbmCalculatorService,
        IApplicationDbContext context,
        IMemoryCache? cache = null)
    {
        _cbmCalculatorService = cbmCalculatorService;
        _context = context;
        _cache = cache;
    }

    /// <summary>
    /// Lấy danh mục các điều kiện thương mại quốc tế Incoterms 2020 (FOB, CIF, EXW, DDP...) (EXP-47)
    /// </summary>
    [HttpGet("incoterms")]
    [ResponseCache(Duration = 3600, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(ApiResponse<List<Incoterm>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIncoterms()
    {
        const string cacheKey = "Logistics_Incoterms_List";
        if (_cache != null && _cache.TryGetValue(cacheKey, out List<Incoterm>? cachedList) && cachedList != null)
        {
            return Ok(ApiResponse<List<Incoterm>>.Ok(cachedList, "Lấy danh mục Incoterms 2020 thành công."));
        }

        var list = await _context.Incoterms.AsNoTracking().ToListAsync();
        _cache?.Set(cacheKey, list, TimeSpan.FromHours(1));

        return Ok(ApiResponse<List<Incoterm>>.Ok(list, "Lấy danh mục Incoterms 2020 thành công."));
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
    [HttpPost("calculate-cbm")]
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
