using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

[AllowAnonymous]
public class TrackingController : BaseApiController
{
    private readonly ITrackingService _trackingService;

    public TrackingController(ITrackingService trackingService)
    {
        _trackingService = trackingService;
    }

    /// <summary>
    /// Tra cứu chi tiết tiến độ hành trình vận đơn đường biển B/L, tàu ONE APUS và các mốc kiểm định hải quan (EXP-72, EXP-73)
    /// </summary>
    /// <param name="blOrBookingNumber">Mã vận đơn B/L hoặc Booking Number (Ví dụ: QTH-BL-2026-JP01)</param>
    [HttpGet("{blOrBookingNumber}")]
    [ProducesResponseType(typeof(ApiResponse<ShipmentTrackingDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetShipmentByTrackingNumber(string blOrBookingNumber, CancellationToken cancellationToken)
    {
        var result = await _trackingService.GetShipmentByTrackingNumberAsync(blOrBookingNumber, cancellationToken);
        if (result == null)
        {
            return NotFound(ApiResponse<ShipmentTrackingDetailDto>.Fail(
                StatusCodes.Status404NotFound, 
                $"Không tìm thấy dữ liệu vận đơn cho mã '{blOrBookingNumber}'."));
        }

        return Ok(ApiResponse<ShipmentTrackingDetailDto>.Ok(result, "Tra cứu tiến độ tàu biển và chứng từ vận tải thành công."));
    }

    /// <summary>
    /// Lấy danh sách các chuyến tàu biển xuất khẩu đang hoạt động (EXP-74)
    /// </summary>
    [HttpGet("active")]
    [ProducesResponseType(typeof(ApiResponse<List<ShipmentTrackingDetailDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetActiveShipments(CancellationToken cancellationToken)
    {
        var result = await _trackingService.GetActiveShipmentsAsync(cancellationToken);
        return Ok(ApiResponse<List<ShipmentTrackingDetailDto>>.Ok(result, "Lấy danh sách hải trình đang vận chuyển thành công."));
    }
}
