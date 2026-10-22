using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

[Authorize]
public class OrdersController : BaseApiController
{
    private readonly IOrderService _orderService;

    public OrdersController(IOrderService orderService)
    {
        _orderService = orderService;
    }

    /// <summary>
    /// Tạo đơn hàng B2C mua lẻ quốc tế kèm tính phí ship và thuế tự động (EXP-36 đến EXP-39)
    /// </summary>
    [AllowAnonymous]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<OrderResponseDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateOrder([FromBody] CreateOrderRequestDto request)
    {
        var userId = GetCurrentUserId();
        if (userId <= 0)
        {
            userId = 1; // Fallback cho khách mua lẻ B2C Guest Checkout
        }

        try
        {
            var result = await _orderService.CreateB2cOrderAsync(userId, request);
            return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, ApiResponse<OrderResponseDto>.Ok(result, "Tạo đơn hàng thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<OrderResponseDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<OrderResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
    }

    /// <summary>
    /// Lấy chi tiết đơn hàng theo ID
    /// </summary>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ApiResponse<OrderResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetOrderById(long id)
    {
        var userId = GetCurrentUserId();
        var orderType = GetCurrentOrderType();
        if (orderType == null) return Forbid();
        try
        {
            var result = await _orderService.GetOrderByIdAsync(id, userId, orderType);
            return Ok(ApiResponse<OrderResponseDto>.Ok(result, "Lấy thông tin đơn hàng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<OrderResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (UnauthorizedAccessException)
        {
            return Forbid();
        }
    }

    /// <summary>
    /// Lấy danh sách lịch sử đơn hàng của người dùng hiện tại
    /// </summary>
    [HttpGet("my-orders")]
    [Authorize(Roles = "B2C_Customer,B2B_Buyer")]
    [ProducesResponseType(typeof(ApiResponse<List<OrderResponseDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyOrders()
    {
        var userId = GetCurrentUserId();
        var orderType = GetCurrentOrderType();
        if (userId <= 0 || orderType == null) return Forbid();
        var orders = await _orderService.GetUserOrdersAsync(userId, orderType);
        return Ok(ApiResponse<List<OrderResponseDto>>.Ok(orders, "Lấy danh sách đơn hàng thành công."));
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllOrders()
    {
        var orders = await _orderService.GetAllOrdersAsync();
        return Ok(ApiResponse<List<OrderResponseDto>>.Ok(orders, "Lấy danh sách đơn hàng toàn hệ thống thành công."));
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> UpdateOrderStatus(long id, [FromBody] UpdateOrderStatusRequest request)
    {
        try
        {
            var order = await _orderService.UpdateOrderStatusAsync(id, request.Status, request.PaymentStatus);
            return Ok(ApiResponse<OrderResponseDto>.Ok(order, "Cập nhật trạng thái đơn hàng thành công."));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(ApiResponse<OrderResponseDto>.Fail(StatusCodes.Status404NotFound, ex.Message));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<OrderResponseDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
    }

    private long GetCurrentUserId()
    {
        var subClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? User.FindFirst("sub")?.Value;
        return long.TryParse(subClaim, out var id) ? id : 0;
    }

    private string? GetCurrentOrderType()
    {
        if (User.IsInRole("B2B_Buyer")) return "B2B";
        if (User.IsInRole("B2C_Customer")) return "B2C";
        return null;
    }
}

public sealed class UpdateOrderStatusRequest
{
    public string Status { get; set; } = string.Empty;
    public string? PaymentStatus { get; set; }
}
