using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class CategoriesController : BaseApiController
{
    private readonly ICategoryService _categoryService;

    public CategoriesController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các ngành hàng xuất khẩu (hỗ trợ đa ngôn ngữ EN / VI)
    /// </summary>
    /// <param name="lang">Mã ngôn ngữ: 'vi' (mặc định) hoặc 'en'</param>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<List<CategoryDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAllCategories([FromHeader(Name = "X-Language")] string lang = "vi")
    {
        var result = await _categoryService.GetAllCategoriesAsync(lang);
        return Ok(ApiResponse<List<CategoryDto>>.Ok(result, "Lấy danh mục thành công."));
    }

    /// <summary>
    /// Lấy chi tiết ngành hàng xuất khẩu theo ID
    /// </summary>
    [HttpGet("{id:int}")]
    [ProducesResponseType(typeof(ApiResponse<CategoryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCategoryById(int id, [FromHeader(Name = "X-Language")] string lang = "vi")
    {
        var result = await _categoryService.GetCategoryByIdAsync(id, lang);
        if (result == null)
        {
            return NotFound(ApiResponse<CategoryDto>.Fail(StatusCodes.Status404NotFound, $"Không tìm thấy danh mục có ID = {id}"));
        }

        return Ok(ApiResponse<CategoryDto>.Ok(result));
    }
}
