using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class ContractsController : BaseApiController
{
    private readonly IContractService _contractService;

    public ContractsController(IContractService contractService)
    {
        _contractService = contractService;
    }

    /// <summary>
    /// Lấy chi tiết Hợp đồng ngoại thương theo Contract ID
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ApiResponse<SalesContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetContractById(long id)
    {
        var contract = await _contractService.GetContractByIdAsync(id);
        if (contract == null)
        {
            return NotFound(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy hợp đồng ID #{id}."));
        }
        return Ok(ApiResponse<SalesContractDto>.Ok(contract, "Lấy thông tin hợp đồng ngoại thương thành công."));
    }

    /// <summary>
    /// Lấy chi tiết Hợp đồng ngoại thương theo mã RFQ
    /// </summary>
    [HttpGet("by-rfq/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<SalesContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetContractByRfqId(long rfqId)
    {
        var contract = await _contractService.GetContractByRfqIdAsync(rfqId);
        if (contract == null)
        {
            return NotFound(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status404NotFound, $"Chưa có hợp đồng nào được khởi tạo cho RFQ ID #{rfqId}."));
        }
        return Ok(ApiResponse<SalesContractDto>.Ok(contract, "Lấy thông tin hợp đồng ngoại thương thành công."));
    }

    /// <summary>
    /// Tự động khởi tạo Hợp đồng ngoại thương từ đơn chào giá RFQ đã chốt
    /// </summary>
    [HttpPost("generate-from-rfq/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<SalesContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> GenerateContractFromRfq(long rfqId)
    {
        try
        {
            var contract = await _contractService.GenerateContractFromRfqAsync(rfqId);
            return Ok(ApiResponse<SalesContractDto>.Ok(contract, "Khởi tạo bản nháp Hợp đồng Ngoại thương thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    /// <summary>
    /// Người bán (Quang Tấn Hoàng Admin) ký số và đóng dấu điện tử lên hợp đồng
    /// </summary>
    [HttpPost("{id:long}/sign-seller")]
    [ProducesResponseType(typeof(ApiResponse<SalesContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SignContractSeller(long id, [FromBody] SignContractRequestDto dto)
    {
        try
        {
            var contract = await _contractService.SignContractSellerAsync(id, dto);
            return Ok(ApiResponse<SalesContractDto>.Ok(contract, "Người bán đã ký số và đóng dấu hợp đồng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    /// <summary>
    /// Người mua (Khách B2B Buyer) ký số xác nhận hợp đồng ngoại thương
    /// </summary>
    [HttpPost("{id:long}/sign-buyer")]
    [ProducesResponseType(typeof(ApiResponse<SalesContractDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SignContractBuyer(long id, [FromBody] SignContractRequestDto dto)
    {
        try
        {
            var contract = await _contractService.SignContractBuyerAsync(id, dto);
            return Ok(ApiResponse<SalesContractDto>.Ok(contract, "Người mua đã ký số xác nhận hợp đồng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<SalesContractDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    /// <summary>
    /// Tải file PDF Hợp đồng ngoại thương chính thức (song ngữ, có chữ ký số & mã hash toàn vẹn)
    /// </summary>
    [HttpGet("{id:long}/download-pdf")]
    [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadContractPdf(long id)
    {
        try
        {
            var (pdfBytes, fileName) = await _contractService.GenerateContractPdfAsync(id);
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<string>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Gửi đề xuất trả giá ngược nhiều vòng (Counter-Offer) cho RFQ
    /// </summary>
    [HttpPost("rfq/{rfqId:long}/counter-offer")]
    [ProducesResponseType(typeof(ApiResponse<RfqCounterOfferDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SubmitCounterOffer(long rfqId, [FromBody] SubmitCounterOfferRequestDto dto, [FromQuery] string role = "BUYER")
    {
        try
        {
            var userId = GetCurrentUserId();
            var offer = await _contractService.SubmitCounterOfferAsync(rfqId, userId, role, dto);
            return Ok(ApiResponse<RfqCounterOfferDto>.Ok(offer, "Gửi đề xuất trả giá mới thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<RfqCounterOfferDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<RfqCounterOfferDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    /// <summary>
    /// Lấy danh sách lịch sử các vòng đàm phán trả giá của RFQ
    /// </summary>
    [HttpGet("rfq/{rfqId:long}/counter-offers")]
    [ProducesResponseType(typeof(ApiResponse<List<RfqCounterOfferDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCounterOffers(long rfqId)
    {
        var list = await _contractService.GetCounterOffersByRfqIdAsync(rfqId);
        return Ok(ApiResponse<List<RfqCounterOfferDto>>.Ok(list, "Lấy lịch sử đàm phán thành công."));
    }

    /// <summary>
    /// Chấp thuận đề xuất trả giá, chuyển trạng thái RFQ thành AGREED_PENDING_CONTRACT
    /// </summary>
    [HttpPost("rfq/{rfqId:long}/counter-offer/{offerId:long}/accept")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AcceptCounterOffer(long rfqId, long offerId)
    {
        var success = await _contractService.AcceptCounterOfferAsync(rfqId, offerId);
        if (!success)
        {
            return NotFound(ApiResponse<bool>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy đề xuất trả giá hoặc đơn RFQ."));
        }
        return Ok(ApiResponse<bool>.Ok(true, "Đã chấp thuận đề xuất trả giá. Bạn có thể khởi tạo Hợp đồng ngoại thương."));
    }

    private long GetCurrentUserId()
    {
        var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdStr, out var id) ? id : 1;
    }
}
