using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IApplicationDbContext _context;

    public CategoryService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesAsync(string languageCode = "vi")
    {
        var categories = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .ToListAsync();

        return categories.Select(c =>
        {
            var translation = c.Translations.FirstOrDefault(t => t.LanguageCode.Equals(languageCode, StringComparison.OrdinalIgnoreCase))
                           ?? c.Translations.FirstOrDefault(t => t.LanguageCode.Equals("en", StringComparison.OrdinalIgnoreCase))
                           ?? c.Translations.FirstOrDefault();

            return new CategoryDto
            {
                Id = c.Id,
                Slug = c.Slug,
                Name = translation?.Name ?? c.Slug,
                Description = translation?.Description
            };
        }).ToList();
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id, string languageCode = "vi")
    {
        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return null;

        var translation = category.Translations.FirstOrDefault(t => t.LanguageCode.Equals(languageCode, StringComparison.OrdinalIgnoreCase))
                       ?? category.Translations.FirstOrDefault(t => t.LanguageCode.Equals("en", StringComparison.OrdinalIgnoreCase))
                       ?? category.Translations.FirstOrDefault();

        return new CategoryDto
        {
            Id = category.Id,
            Slug = category.Slug,
            Name = translation?.Name ?? category.Slug,
            Description = translation?.Description
        };
    }
}
