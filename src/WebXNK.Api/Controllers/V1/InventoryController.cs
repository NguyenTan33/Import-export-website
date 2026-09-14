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
    /// Tra cứu tồn kho thực tế và khả dụng của sản phẩm trên toàn bộ hệ thống kho bãi (Ledger Engine)
    /// </summary>
    /// <param name="productId">ID sản phẩm</param>
    [HttpGet("stock/{productId:long}")]
    [ProducesResponseType(typeof(ApiResponse<StockSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetStockSummary(long productId)
    {
        var result = await _inventoryService.GetStockSummaryAsync(productId);
        return Ok(ApiResponse<StockSummaryDto>.Ok(result, "Tra cứu tồn kho thành công."));
    }

    /// <summary>
    /// Ghi nhận bút toán nhập/xuất kho vào sổ cái bất biến (Inventory Ledger) - Yêu cầu Admin / Sales
    /// </summary>
    [Authorize(Roles = "Admin_Super,Sales_Executive")]
    [HttpPost("transactions")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RecordTransaction([FromBody] RecordStockTransactionRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = long.TryParse(userIdClaim, out var uid) ? uid : 1;

        var success = await _inventoryService.RecordTransactionAsync(request, userId);
        return Ok(ApiResponse<bool>.Ok(success, "Ghi nhận bút toán sổ cái kho thành công."));
    }
}
