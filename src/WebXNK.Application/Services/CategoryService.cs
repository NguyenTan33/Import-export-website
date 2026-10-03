using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class CategoryService : ICategoryService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public CategoryService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<List<CategoryDto>> GetAllCategoriesAsync(string languageCode = "vi")
    {
        var cacheKey = $"Categories_All_{languageCode.ToLowerInvariant()}";
        if (_cache != null && _cache.TryGetValue(cacheKey, out List<CategoryDto>? cachedList) && cachedList != null)
        {
            return cachedList;
        }

        var categories = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .ToListAsync();

        var result = categories.Select(c =>
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

        _cache?.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(int id, string languageCode = "vi")
    {
        var cacheKey = $"Category_ById_{id}_{languageCode.ToLowerInvariant()}";
        if (_cache != null && _cache.TryGetValue(cacheKey, out CategoryDto? cachedItem) && cachedItem != null)
        {
            return cachedItem;
        }

        var category = await _context.Categories
            .AsNoTracking()
            .Include(c => c.Translations)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null) return null;

        var translation = category.Translations.FirstOrDefault(t => t.LanguageCode.Equals(languageCode, StringComparison.OrdinalIgnoreCase))
                       ?? category.Translations.FirstOrDefault(t => t.LanguageCode.Equals("en", StringComparison.OrdinalIgnoreCase))
                       ?? category.Translations.FirstOrDefault();

        var result = new CategoryDto
        {
            Id = category.Id,
            Slug = category.Slug,
            Name = translation?.Name ?? category.Slug,
            Description = translation?.Description
        };

        _cache?.Set(cacheKey, result, TimeSpan.FromMinutes(30));
        return result;
    }
}
