using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllCategoriesAsync(string languageCode = "vi");
    Task<CategoryDto?> GetCategoryByIdAsync(int id, string languageCode = "vi");
}
