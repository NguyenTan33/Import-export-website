using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Infrastructure.Persistence.Context;

namespace WebXNK.Api.Controllers.V1;

public class ProductsController : BaseApiController
{
    private readonly IProductService _productService;
    private readonly IWebHostEnvironment _env;
    private readonly WebXnkDbContext _dbContext;

    public ProductsController(IProductService productService, IWebHostEnvironment env, WebXnkDbContext dbContext)
    {
        _productService = productService;
        _env = env;
        _dbContext = dbContext;
    }

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
    /// Tạo mới sản phẩm đơn thuần (chỉ truyền JSON)
    /// </summary>
    [Authorize(Roles = "Admin_Super")]
    [HttpPost]
    [Consumes("application/json")]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProduct([FromBody] CreateProductRequestDto request)
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = long.TryParse(userIdClaim, out var uid) ? uid : 1;
        try
        {
            var result = await _productService.CreateProductAsync(request, userId);
            return CreatedAtAction(nameof(GetProductById), new { id = result.Id }, ApiResponse<ProductDetailDto>.Ok(result, "Tạo sản phẩm xuất khẩu thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (InvalidOperationException)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Mã SKU này đã tồn tại, vui lòng nhập SKU khác"));
        }
        catch (DbUpdateException ex) when (IsDuplicateSkuError(ex))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Mã SKU này đã tồn tại, vui lòng nhập SKU khác"));
        }
    }

    /// <summary>
    /// Tạo sản phẩm kèm upload ảnh trực tiếp - Bọc Transaction an toàn & Tự động Rollback nếu lỗi
    /// </summary>
    [Authorize(Roles = "Admin_Super")]
    [HttpPost("with-images")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(30 * 1024 * 1024)]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiResponse<ProductDetailDto>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateProductWithImages([FromForm] string productJson, [FromForm(Name = "files")] List<IFormFile>? files)
    {
        CreateProductRequestDto? request;
        try
        {
            request = JsonSerializer.Deserialize<CreateProductRequestDto>(productJson, new JsonSerializerOptions(JsonSerializerDefaults.Web));
        }
        catch (JsonException)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Dữ liệu sản phẩm không hợp lệ."));
        }

        if (request == null)
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Thiếu dữ liệu sản phẩm."));

        var imageFiles = files ?? new List<IFormFile>();
        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };

        if (imageFiles.Any(file => file.Length == 0 || file.Length > 5 * 1024 * 1024 || !allowedExtensions.Contains(Path.GetExtension(file.FileName))))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Lỗi tải ảnh: chỉ nhận JPG, JPEG, PNG, WEBP và mỗi ảnh tối đa 5MB."));
        }

        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var userId = long.TryParse(userIdClaim, out var uid) ? uid : 1;

        var executionStrategy = _dbContext.Database.CreateExecutionStrategy();
        try
        {
            var created = await executionStrategy.ExecuteAsync(async () =>
            {
                var writtenFiles = new List<string>();
                await using var transaction = await _dbContext.Database.BeginTransactionAsync();
                try
                {
                    // 1. Lưu thông tin cơ bản sản phẩm
                    var product = await _productService.CreateProductAsync(request, userId);

                    // 2. Lưu file ảnh nếu có
                    if (imageFiles.Count > 0)
                    {
                        var webRoot = string.IsNullOrWhiteSpace(_env.WebRootPath)
                            ? Path.Combine(_env.ContentRootPath, "wwwroot")
                            : _env.WebRootPath;
                        var uploadsDir = Path.Combine(webRoot, "uploads", "products");
                        Directory.CreateDirectory(uploadsDir);

                        var imageUrls = new List<string>();
                        foreach (var imageFile in imageFiles)
                        {
                            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
                            var fileName = $"product-{product.Id}-{Guid.NewGuid():N}{extension}";
                            var filePath = Path.Combine(uploadsDir, fileName);

                            writtenFiles.Add(filePath);

                            await using var stream = new FileStream(filePath, FileMode.CreateNew, FileAccess.Write, FileShare.None);
                            await imageFile.CopyToAsync(stream);

                            imageUrls.Add($"{Request.Scheme}://{Request.Host}/uploads/products/{fileName}");
                        }

                        var updated = await _productService.UpdateProductImagesAsync(product.Id, imageUrls);
                        if (updated == null) throw new InvalidOperationException("Không thể liên kết ảnh với sản phẩm vừa tạo.");
                        product = updated;
                    }

                    // 3. Commit thành công
                    await transaction.CommitAsync();
                    return product;
                }
                catch
                {
                    // Tự động Rollback Database & Xóa File rác đã lưu
                    try { await transaction.RollbackAsync(); } catch { }
                    _dbContext.ChangeTracker.Clear();
                    foreach (var filePath in writtenFiles)
                    {
                        try { if (System.IO.File.Exists(filePath)) System.IO.File.Delete(filePath); } catch { }
                    }
                    throw;
                }
            });

            return CreatedAtAction(nameof(GetProductById), new { id = created.Id }, ApiResponse<ProductDetailDto>.Ok(created, "Tạo sản phẩm xuất khẩu thành công."));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, ex.Message));
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("đã tồn tại", StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Mã SKU này đã tồn tại, vui lòng nhập SKU khác"));
        }
        catch (DbUpdateException ex) when (IsDuplicateSkuError(ex))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Mã SKU này đã tồn tại, vui lòng nhập SKU khác"));
        }
        catch (Exception)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status500InternalServerError, "Không thể tạo sản phẩm. Hệ thống đã rollback dữ liệu an toàn, vui lòng thử lại."));
        }
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
        catch (DbUpdateException ex) when (IsDuplicateSkuError(ex))
        {
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Mã SKU này đã tồn tại, vui lòng nhập SKU khác"));
        }
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteProduct(long id)
    {
        try
        {
            var deleted = await _productService.DeleteProductAsync(id);
            return deleted ? NoContent() : NotFound(ApiResponse<object>.Fail(StatusCodes.Status404NotFound, "Sản phẩm không tồn tại hoặc đã bị xóa."));
        }
        catch (Exception ex)
        {
            return BadRequest(ApiResponse<object>.Fail(StatusCodes.Status400BadRequest, $"Không thể xóa sản phẩm do đang có ràng buộc dữ liệu: {ex.Message}"));
        }
    }

    [Authorize(Roles = "Admin_Super")]
    [HttpPost("{id:long}/images")]
    public async Task<IActionResult> UploadProductImages(long id, [FromForm(Name = "files")] List<IFormFile> files)
    {
        if (files == null || files.Count == 0 || files.Any(file => file.Length == 0))
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Vui lòng chọn ít nhất một ảnh hợp lệ."));

        if (files.Any(file => file.Length > 5 * 1024 * 1024))
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Lỗi tải ảnh: mỗi ảnh tối đa 5MB."));

        var allowedExtensions = new HashSet<string>(StringComparer.OrdinalIgnoreCase) { ".jpg", ".jpeg", ".png", ".webp" };
        if (files.Any(file => !allowedExtensions.Contains(Path.GetExtension(file.FileName))))
            return BadRequest(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status400BadRequest, "Chỉ hỗ trợ ảnh JPG, PNG, WEBP."));

        var product = await _productService.GetProductByIdAsync(id);
        if (product == null) return NotFound(ApiResponse<ProductDetailDto>.Fail(StatusCodes.Status404NotFound, "Không tìm thấy sản phẩm."));

        var webRoot = string.IsNullOrWhiteSpace(_env.WebRootPath) ? Path.Combine(_env.ContentRootPath, "wwwroot") : _env.WebRootPath;
        var uploadsDir = Path.Combine(webRoot, "uploads", "products");
        Directory.CreateDirectory(uploadsDir);

        var urls = product.ImageUrls ?? new List<string>();
        foreach (var file in files)
        {
            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var fileName = $"product-{id}-{Guid.NewGuid():N}{extension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            await using var stream = new FileStream(filePath, FileMode.Create);
            await file.CopyToAsync(stream);
            urls.Add($"{Request.Scheme}://{Request.Host}/uploads/products/{fileName}");
        }

        var updated = await _productService.UpdateProductImagesAsync(id, urls);
        return Ok(ApiResponse<ProductDetailDto>.Ok(updated!, "Đã tải ảnh sản phẩm lên máy chủ thành công."));
    }

    private static bool IsDuplicateSkuError(Exception exception)
    {
        var message = exception.ToString();
        return message.Contains("BaseSku", StringComparison.OrdinalIgnoreCase)
            || message.Contains("duplicate", StringComparison.OrdinalIgnoreCase)
            || message.Contains("2601", StringComparison.OrdinalIgnoreCase)
            || message.Contains("2627", StringComparison.OrdinalIgnoreCase);
    }
}