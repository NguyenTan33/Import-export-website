using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class PricingController : BaseApiController
{
    private readonly ITierPricingService _tierPricingService;
    private readonly IIncotermsCalculationService _incotermsService;
    private readonly IApplicationDbContext? _context;

    public PricingController(
        ITierPricingService tierPricingService,
        IIncotermsCalculationService incotermsService,
        IApplicationDbContext? context = null)
    {
        _tierPricingService = tierPricingService;
        _incotermsService = incotermsService;
        _context = context;
    }

    /// <summary>
    /// Lấy bảng tỷ giá ngoại tệ FX thời gian thực (USD -> EUR, JPY, VND) từ SQL Server (EXP-19)
    /// </summary>
    [HttpGet("exchange-rates")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(ApiResponse<List<ExchangeRateDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetExchangeRates()
    {
        if (_context == null)
        {
            return Ok(ApiResponse<List<ExchangeRateDto>>.Ok(new List<ExchangeRateDto>(), "Trả về tỷ giá mặc định."));
        }

        var rates = await _context.ExchangeRates
            .AsNoTracking()
            .Where(r => r.FromCurrency == "USD")
            .Select(r => new ExchangeRateDto
            {
                FromCurrency = r.FromCurrency,
                ToCurrency = r.ToCurrency,
                Rate = r.Rate,
                Source = r.Source,
                FetchedAt = r.FetchedAt
            })
            .ToListAsync();

        return Ok(ApiResponse<List<ExchangeRateDto>>.Ok(rates, "Lấy bảng tỷ giá ngoại tệ FX thành công."));
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

    /// <summary>
    /// Động cơ tính toán Giá vốn Nhập khẩu Door-to-Door (Landed Cost) & Ưu đãi Thuế quan Hiệp định FTA (EVFTA, CPTPP, VJEPA, ATIGA, RCEP)
    /// </summary>
    [HttpPost("calculate-landed-cost")]
    [ProducesResponseType(typeof(ApiResponse<CalculateLandedCostResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> CalculateLandedCost([FromBody] CalculateLandedCostRequestDto request)
    {
        var result = await _incotermsService.CalculateLandedCostAsync(request);
        return Ok(ApiResponse<CalculateLandedCostResponseDto>.Ok(result, "Tính toán dự toán Landed Cost & Ưu đãi thuế quan FTA thành công."));
    }
}
