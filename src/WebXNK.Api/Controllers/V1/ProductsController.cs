using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;

    public ProductsController(IProductService productService)
    {
        _productService = productService;
    }

    /// <summary>
    /// Lấy danh sách sản phẩm xuất khẩu có phân trang, tìm kiếm và lọc đa tiêu chí
    /// </summary>
    /// <param name="filter">Tham số lọc (CategoryId, HsCode, MinPrice, MaxPrice, PageIndex, PageSize)</param>
    /// <param name="lang">Mã ngôn ngữ (Header 'X-Language': 'vi' hoặc 'en')</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResult<ProductSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] ProductFilterRequestDto filter,
        [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        filter.LanguageCode = lang;
        var result = await _productService.GetProductsAsync(filter);
        return Ok(ApiResponse<PaginatedResult<ProductSummaryDto>>.Ok(result, "Lấy danh sách sản phẩm thành công."));
    }

    /// <summary>
    /// Lấy thông tin chi tiết sản phẩm (kèm quy cách đóng gói container CBM và bảng giá sỉ MOQ)
    /// </summary>
    /// <param name="id">ID sản phẩm</param>
    /// <param name="lang">Mã ngôn ngữ (Header 'X-Language': 'vi' hoặc 'en')</param>
    [HttpGet("{id:long}")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(long id, [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        var result = await _productService.GetProductByIdAsync(id, lang);
        if (result == null)
        {
            return NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy sản phẩm có ID = {id}"));
        }

        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    /// <summary>
    /// Tạo mới sản phẩm xuất khẩu kèm quy cách đóng gói và bảng giá bậc thang (Yêu cầu quyền Admin / Sales)
    /// </summary>
    [Authorize(Roles = "Admin_Super,Sales_Executive")]
    [HttpPost]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = long.TryParse(userIdClaim, out var uid) ? uid : 1;

        var result = await _productService.CreateProductAsync(request, userId);
        return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, ApiResponse<ProductDetailDto>.Ok(result, "Tạo sản phẩm xuất khẩu thành công."));
    }
}
