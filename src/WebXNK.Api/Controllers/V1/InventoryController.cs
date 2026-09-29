using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

[Authorize]
public class InventoryController : BaseApiController
{
    private readonly IInventoryService _inventoryService;

    public InventoryController(IInventoryService inventoryService)
    {
        _inventoryService = inventoryService;
    }

    /// <summary>
    /// Lấy danh mục các kho bãi trong hệ thống (Kho Cát Lái, Kho Bình Dương...)
    /// </summary>
    [AllowAnonymous]
    [HttpGet("warehouses")]
    [ProducesResponseType(typeof(ApiResponse<List<WarehouseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetWarehouses()
    {
        var warehouses = await _inventoryService.GetWarehousesAsync();
        return Ok(ApiResponse<List<WarehouseDto>>.Ok(warehouses, "Lấy danh sách kho bãi thành công."));
    }

    /// <summary>
    /// Tra cứu tồn kho thực tế và khả dụng của sản phẩm trên toàn bộ hệ thống kho bãi (Ledger Engine)
    /// </summary>
    /// <param name="productId">ID sản phẩm</param>
    [AllowAnonymous]
    [HttpGet("stock/{productId:long}")]
    [ProducesResponseType(typeof(ApiResponse<StockSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStockSummary(long productId)
    {
        var result = await _inventoryService.GetStockSummaryAsync(productId);
        return Ok(ApiResponse<StockSummaryDto>.Ok(result, "Tra cứu tồn kho thành công."));
    }

    /// <summary>
    /// Ghi nhận bút toán nhập/xuất kho vào sổ cái bất biến (Inventory Ledger) - Yêu cầu Admin / Sales / Kho
    /// </summary>
    [Authorize(Roles = "Admin_Super,Sales_Executive,Warehouse_Manager")]
    [HttpPost("transactions")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordTransaction([FromBody] RecordStockTransactionRequestDto request)
    {
        var userId = GetCurrentUserId();
        var success = await _inventoryService.RecordTransactionAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(success, "Ghi nhận bút toán sổ cái kho thành công."));
    }

    /// <summary>
    /// Giữ hàng tạm thời trong 30 phút phục vụ thanh toán B2C / B2B (Stock Reservation - EXP-79)
    /// </summary>
    [HttpPost("reserve")]
    [ProducesResponseType(typeof(ApiResponse<StockReservationDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ReserveStock([FromBody] ReserveStockRequestDto request)
    {
        var result = await _inventoryService.ReserveStockAsync(request);
        return Ok(ApiResponse<StockReservationDto>.Ok(result, "Giữ hàng tạm thời thành công (Thời hạn 30 phút)."));
    }

    /// <summary>
    /// Hủy bỏ phiếu giữ chỗ hàng, giải phóng tồn kho về khả dụng ngay lập tức
    /// </summary>
    /// <param name="reservationId">ID phiếu giữ chỗ</param>
    [HttpPost("reservations/{reservationId:long}/release")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReleaseReservation(long reservationId)
    {
        var success = await _inventoryService.ReleaseReservationAsync(reservationId);
        return Ok(ApiResponse<bool>.Ok(success, "Giải phóng giữ chỗ hàng thành công."));
    }

    /// <summary>
    /// Xác nhận hoàn tất đơn hàng: Kết chuyển từ giữ chỗ (Reservation) sang bút toán xuất kho trên Ledger
    /// </summary>
    [Authorize(Roles = "Admin_Super,Sales_Executive,Warehouse_Manager")]
    [HttpPost("reservations/confirm")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ConfirmReservation([FromBody] ConfirmReservationRequestDto request)
    {
        var userId = GetCurrentUserId();
        var success = await _inventoryService.ConfirmReservationAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(success, "Kết chuyển xuất kho từ giữ chỗ thành công."));
    }

    /// <summary>
    /// Bút toán luân chuyển hàng giữa 2 kho (Ví dụ: Từ Kho Nhà máy Bình Dương sang Kho Cảng Cát Lái)
    /// </summary>
    [Authorize(Roles = "Admin_Super,Sales_Executive,Warehouse_Manager")]
    [HttpPost("transfer")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> TransferStock([FromBody] TransferStockRequestDto request)
    {
        var userId = GetCurrentUserId();
        var success = await _inventoryService.TransferStockAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(success, "Thực hiện chuyển kho thành công."));
    }

    private long GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var uid) ? uid : 1;
    }
}
