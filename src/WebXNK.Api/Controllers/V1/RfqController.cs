using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class RfqController : BaseApiController
{
    private readonly IRfqService _rfqService;

    public RfqController(IRfqService rfqService)
    {
        _rfqService = rfqService;
    }

    /// <summary>
    /// Doanh nghiệp B2B gửi yêu cầu báo giá xuất khẩu (RFQ) (EXP-45 đến EXP-49)
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<RfqDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateRfq([FromBody] CreateRfqRequestDto request)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        try
        {
            var result = await _rfqService.CreateRfqAsync(userId, request);
            return CreatedAtAction(nameof(GetRfqById), new { id = result.Id }, ApiResponse<RfqDetailDto>.Ok(result, "Tạo yêu cầu báo giá RFQ thành công."));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Lấy chi tiết yêu cầu báo giá và toàn bộ lịch sử đàm phán nhiều vòng
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ApiResponse<RfqDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRfqById(long id)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        try
        {
            var result = await _rfqService.GetRfqByIdAsync(id, userId);
            return Ok(ApiResponse<RfqDetailDto>.Ok(result, "Lấy thông tin RFQ thành công."));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Lấy danh sách RFQ của doanh nghiệp mà người dùng hiện tại đang đăng nhập (EXP-45, EXP-50)
    /// </summary>
    [Authorize]
    [HttpGet("my-rfqs")]
    [ProducesResponseType(typeof(ApiResponse<List<RfqSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyRfqs()
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) return Unauthorized();
        var result = await _rfqService.GetMyRfqsAsync(userId);
        return Ok(ApiResponse<List<RfqSummaryDto>>.Ok(result, "Lấy danh sách RFQ doanh nghiệp của bạn thành công."));
    }

    /// <summary>
    /// Lấy danh sách RFQ của một doanh nghiệp
    /// </summary>
    [HttpGet("company/{companyId:long}")]
    [ProducesResponseType(typeof(ApiResponse<List<RfqSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompanyRfqs(long companyId)
    {
        var result = await _rfqService.GetCompanyRfqsAsync(companyId);
        return Ok(ApiResponse<List<RfqSummaryDto>>.Ok(result, "Lấy danh sách RFQ doanh nghiệp thành công."));
    }

    /// <summary>
    /// Admin/Sales lấy toàn bộ danh sách RFQ trong hệ thống kèm lọc theo trạng thái
    /// </summary>
    [HttpGet]
    [HttpGet("admin/all")]
    [Authorize(Roles = "Admin_Super")]
    [ProducesResponseType(typeof(ApiResponse<List<RfqSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllRfqs([FromQuery] string? status)
    {
        var result = await _rfqService.GetAllRfqsAsync(status);
        return Ok(ApiResponse<List<RfqSummaryDto>>.Ok(result, "Lấy toàn bộ danh sách RFQ thành công."));
    }

    /// <summary>
    /// Sales/Admin gửi Báo giá chính thức kèm Incoterms, cước biển và thời hạn hiệu lực giá (EXP-50 đến EXP-52)
    /// </summary>
    [HttpPost("{id:long}/quote")]
    [HttpPost("{id:long}/official-quotation")]
    [Authorize(Roles = "Admin_Super")]
    [ProducesResponseType(typeof(ApiResponse<RfqDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitQuotation(long id, [FromBody] SubmitQuotationDto request)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0) userId = 1;
        try
        {
            var result = await _rfqService.SubmitOfficialQuotationAsync(userId, id, request);
            return Ok(ApiResponse<RfqDetailDto>.Ok(result, "Phát hành báo giá chính thức thành công."));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Khách hàng doanh nghiệp gửi phản hồi đàm phán lại giá (Counter-Offer) (EXP-54)
    /// </summary>
    [HttpPost("{id:long}/counter-offer")]
    [ProducesResponseType(typeof(ApiResponse<RfqDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CounterOffer(long id, [FromBody] CounterOfferRequestDto request)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _rfqService.AddCounterOfferAsync(userId, id, request);
            return Ok(ApiResponse<RfqDetailDto>.Ok(result, "Gửi đề xuất thương lượng giá thành công."));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Khách hàng doanh nghiệp chấp thuận báo giá chính thức để tiến hành đặt cọc (Accept Quotation)
    /// </summary>
    [HttpPost("{id:long}/accept")]
    [ProducesResponseType(typeof(ApiResponse<RfqDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> AcceptQuotation(long id)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _rfqService.AcceptQuotationAsync(userId, id);
            return Ok(ApiResponse<RfqDetailDto>.Ok(result, "Chấp thuận báo giá thành công."));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqDetailDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }
}
