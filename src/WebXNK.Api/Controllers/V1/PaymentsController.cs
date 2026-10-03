using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class PaymentsController : BaseApiController
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    /// <summary>
    /// Tạo Stripe PaymentIntent cho đơn hàng B2C kèm hỗ trợ 3D Secure / SCA (EXP-40 đến EXP-42)
    /// </summary>
    [HttpPost("b2c/create-intent")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<StripePaymentIntentResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateStripePaymentIntent([FromBody] CreateStripePaymentIntentRequestDto request)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _paymentService.CreateStripePaymentIntentAsync(userId, request);
            return Ok(ApiResponse<StripePaymentIntentResponseDto>.Ok(result, "Khởi tạo PaymentIntent thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<StripePaymentIntentResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ApiResponse<StripePaymentIntentResponseDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    /// <summary>
    /// Endpoint nhận Stripe Webhook xử lý Idempotency và cập nhật trạng thái đơn hàng PAID (EXP-43, EXP-44)
    /// </summary>
    [HttpPost("stripe-webhook")]
    [AllowAnonymous]
    public async Task<IActionResult> StripeWebhook()
    {
        Request.EnableBuffering();
        using var reader = new StreamReader(Request.Body, System.Text.Encoding.UTF8, leaveOpen: true);
        var json = await reader.ReadToEndAsync();
        Request.Body.Position = 0;

        var signatureHeader = Request.Headers["Stripe-Signature"].ToString();

        var success = await _paymentService.HandleStripeWebhookEventAsync(json, signatureHeader);
        if (success)
        {
            return Ok();
        }

        return BadRequest();
    }

    /// <summary>
    /// Nhà nhập khẩu B2B nộp Ủy nhiệm chi (Bank Slip / Swift MT103) đặt cọc 30% (EXP-60, EXP-61)
    /// </summary>
    [HttpPost("b2b/submit-slip")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<B2BPaymentResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitB2BPaymentSlip([FromBody] SubmitB2BPaymentSlipRequestDto request)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0)
        {
            return Unauthorized(ApiResponse<B2BPaymentResponseDto>.Fail(StatusCodes.Status401Unauthorized, "Token không hợp lệ."));
        }

        try
        {
            var result = await _paymentService.SubmitB2BPaymentSlipAsync(userId, request);
            return StatusCode(StatusCodes.Status201Created, ApiResponse<B2BPaymentResponseDto>.Ok(result, "Nộp chứng từ chuyển tiền thành công, đang chờ thẩm định."));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<B2BPaymentResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Kế toán / Sales thẩm định đối soát Ủy nhiệm chi ngân hàng và duyệt cọc -> chuyển RFQ sang IN_PRODUCTION (EXP-62, EXP-63)
    /// </summary>
    [HttpPost("b2b/verify-deposit")]
    [Authorize(Roles = "Admin_Super,Sales_Executive")]
    [ProducesResponseType(typeof(ApiResponse<B2BPaymentResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> VerifyB2BPayment([FromBody] VerifyB2BPaymentRequestDto request)
    {
        var userId = GetCurrentUserId();
        try
        {
            var result = await _paymentService.VerifyB2BPaymentAsync(userId, request);
            return Ok(ApiResponse<B2BPaymentResponseDto>.Ok(result, "Thẩm định chứng từ thanh toán thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<B2BPaymentResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Lấy lịch sử các lần thanh toán / đặt cọc của một yêu cầu RFQ
    /// </summary>
    [HttpGet("b2b/rfq/{rfqId:long}")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<List<B2BPaymentResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetB2BPaymentsByRfq(long rfqId)
    {
        var result = await _paymentService.GetB2BPaymentsByRfqAsync(rfqId);
        return Ok(ApiResponse<List<B2BPaymentResponseDto>>.Ok(result, "Lấy danh sách thanh toán RFQ thành công."));
    }

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }
}
