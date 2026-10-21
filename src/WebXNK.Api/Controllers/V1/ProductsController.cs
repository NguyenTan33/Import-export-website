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
    private readonly IWebHostEnvironment _env;

    public ProductsController(IProductService productService, IWebHostEnvironment env)
    {
        _productService = productService;
        _env = env;
    }

    /// <summary>
    /// Lấy danh sách sản phẩm xuất khẩu có phân trang, tìm kiếm và lọc đa tiêu chí
    /// </summary>
    /// <param name="filter">Tham số lọc (CategoryId, HsCode, MinPrice, MaxPrice, PageIndex, PageSize)</param>
    /// <param name="lang">Mã ngôn ngữ (Header 'X-Language': 'vi' hoặc 'en')</param>
    [HttpGet]
    [ResponseCache(Duration = 120, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(ApiResponse<PaginatedResult<ProductSummaryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetProducts(
        [FromQuery] ProductFilterRequestDto filter,
        [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        filter.LanguageCode = lang;
        var result = await _productService.GetProductsAsync(filter);
        return Ok(ApiResponse<PaginatedResult<ProductSummaryDto>>.Ok(result, "Lấy danh sách sản phẩm thành công."));
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpGet("admin/all")]
    public async Task<IActionResult> GetAllProductsForAdmin([FromQuery] ProductFilterRequestDto filter, [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        filter.LanguageCode = lang;
        filter.IncludeInactive = true;
        var result = await _productService.GetProductsAsync(filter);
        return Ok(ApiResponse<PaginatedResult<ProductSummaryDto>>.Ok(result));
    }

    /// <summary>
    /// Lấy thông tin chi tiết sản phẩm (kèm quy cách đóng gói container CBM và bảng giá sỉ MOQ)
    /// </summary>
    /// <param name="id">ID sản phẩm</param>
    /// <param name="lang">Mã ngôn ngữ (Header 'X-Language': 'vi' hoặc 'en')</param>
    [HttpGet("{id:long}")]
    [ResponseCache(Duration = 300, Location = ResponseCacheLocation.Any)]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProductById(long id, [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        var result = await _productService.GetProductByIdAsync(id, lang);
        if (result == null || !result.IsActive)
        {
            return NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy sản phẩm có ID = {id}"));
        }

        return Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpGet("{id:long}/admin")]
    public async Task<IActionResult> GetProductByIdForAdmin(long id, [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        var result = await _productService.GetProductByIdAsync(id, lang);
        return result == null ? NotFound() : Ok(ApiResponse<ProductDetailDto>.Ok(result));
    }

    /// <summary>
    /// Tạo mới sản phẩm xuất khẩu kèm quy cách đóng gói và bảng giá bậc thang (Yêu cầu quyền Admin / Sales)
    /// </summary>
    [Authorize(Roles = "Admin_Super")]
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

    [Authorize(Roles = "Admin_Super")]
    [HttpPut("{id:long}")]
    public async Task<IActionResult> UpdateProduct(long id, [FromBody] UpdateProductRequestDto request)
    {
        try
        {
            var result = await _productService.UpdateProductAsync(id, request);
            return result == null
                ? NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy sản phẩm."))
                : Ok(ApiResponse<ProductDetailDto>.Ok(result, "Cập nhật sản phẩm thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status409Conflict, ex.Message));
        }
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteProduct(long id)
    {
        var deleted = await _productService.DeleteProductAsync(id);
        return deleted ? NoContent() : NotFound();
    }

    /// <summary>
    /// Cập nhật đường dẫn ảnh minh họa cho sản phẩm (Admin)
    /// </summary>
    [Authorize(Roles = "Admin_Super")]
    [HttpPut("{id:long}/image")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateProductImage(long id, [FromBody] UpdateProductImageRequestDto request)
    {
        var updated = await _productService.UpdateProductImageAsync(id, request.ImageUrl);
        if (updated == null)
        {
            return NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy sản phẩm có ID = {id}"));
        }

        return Ok(ApiResponse<ProductDetailDto>.Ok(updated, "Cập nhật ảnh sản phẩm thành công."));
    }

    /// <summary>
    /// Tải file ảnh sản phẩm trực tiếp từ thiết bị (Laptop, PC,...) của Admin lên Server
    /// </summary>
    [Authorize(Roles = "Admin_Super")]
    [HttpPost("{id:long}/upload-image")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UploadProductImage(long id, IFormFile? file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Vui lòng chọn file ảnh hợp lệ từ thiết bị."));
        }

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !allowedExtensions.Contains(ext))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Chỉ hỗ trợ định dạng ảnh .jpg, .jpeg, .png, .webp, .gif."));
        }

        var webRoot = _env.WebRootPath;
        if (string.IsNullOrWhiteSpace(webRoot))
        {
            webRoot = Path.Combine(_env.ContentRootPath, "wwwroot");
        }

        var uploadsDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var fileName = $"product-{id}-{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}{ext.ToLowerInvariant()}";
        var filePath = Path.Combine(uploadsDir, fileName);

        await using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        var baseUrl = $"{Request.Scheme}://{Request.Host}";
        var publicImageUrl = $"{baseUrl}/uploads/products/{fileName}";

        var updated = await _productService.UpdateProductImageAsync(id, publicImageUrl);
        if (updated == null)
        {
            return NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy sản phẩm có ID = {id}"));
        }

        return Ok(ApiResponse<ProductDetailDto>.Ok(updated, "Đã tải ảnh từ thiết bị lên Server và cập nhật sản phẩm thành công."));
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpPost("{id:long}/images")]
    public async Task<IActionResult> UploadProductImages(long id, [FromForm] List<IFormFile> files)
    {
        if (files.Count == 0 || files.Any(file => file.Length == 0))
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Vui lòng chọn ít nhất một ảnh hợp lệ."));

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp", ".gif" };
        if (files.Any(file => !allowedExtensions.Contains(Path.GetExtension(file.FileName))))
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Chỉ hỗ trợ ảnh JPG, PNG, WEBP hoặc GIF."));

        if (await _productService.GetProductByIdAsync(id) == null) return NotFound();
        var webRoot = string.IsNullOrWhiteSpace(_env.WebRootPath) ? Path.Combine(_env.ContentRootPath, "wwwroot") : _env.WebRootPath;
        var uploadsDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsDir);
        var urls = (await _productService.GetProductByIdAsync(id))?.ImageUrls ?? new List<string>();
        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"product-{id}-{Guid.NewGuid():N}{extension}";
            await using var stream = new FileStream(Path.Combine(uploadsDir, fileName), FileMode.Create);
            await file.CopyToAsync(stream);
            urls.Add($"{Request.Scheme}://{Request.Host}/uploads/products/{fileName}");
        }

        var updated = await _productService.UpdateProductImagesAsync(id, urls);
        return Ok(ApiResponse<ProductDetailDto>.Ok(updated!, "Đã tải ảnh sản phẩm lên máy chủ."));
    }
}
