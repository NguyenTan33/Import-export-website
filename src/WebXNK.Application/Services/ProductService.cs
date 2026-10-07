using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

public class ProductService : IProductService
{
    private readonly IApplicationDbContext _context;
    private readonly IMemoryCache? _cache;

    public ProductService(IApplicationDbContext context, IMemoryCache? cache = null)
    {
        _context = context;
        _cache = cache;
    }

    public async Task<PaginatedResult<ProductSummaryDto>> GetProductsAsync(ProductFilterRequestDto filter)
    {
        var lang = string.IsNullOrWhiteSpace(filter.LanguageCode) ? "vi" : filter.LanguageCode.ToLowerInvariant();

        bool isDefaultCatalog = !filter.CategoryId.HasValue 
            && string.IsNullOrWhiteSpace(filter.HsCode) 
            && !filter.MinPrice.HasValue 
            && !filter.MaxPrice.HasValue 
            && string.IsNullOrWhiteSpace(filter.SearchKeyword) 
            && filter.PageIndex == 1;

        var cacheKey = $"Products_Catalog_{lang}_{filter.PageSize}";
        if (isDefaultCatalog && _cache != null && _cache.TryGetValue(cacheKey, out PaginatedResult<ProductSummaryDto>? cachedCatalog) && cachedCatalog != null)
        {
            return cachedCatalog;
        }

        var baseQuery = _context.Products
            .AsNoTracking()
            .Where(p => p.IsActive);

        // 1. Lọc theo Danh mục
        if (filter.CategoryId.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.CategoryId == filter.CategoryId.Value);
        }

        // 2. Lọc theo mã HS Code
        if (!string.IsNullOrWhiteSpace(filter.HsCode))
        {
            baseQuery = baseQuery.Where(p => p.HsCode.Contains(filter.HsCode.Trim()));
        }

        // 3. Lọc theo khoảng giá
        if (filter.MinPrice.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.DefaultRetailPriceUsd >= filter.MinPrice.Value);
        }
        if (filter.MaxPrice.HasValue)
        {
            baseQuery = baseQuery.Where(p => p.DefaultRetailPriceUsd <= filter.MaxPrice.Value);
        }

        // 4. Tìm kiếm từ khóa (SKU hoặc Tên sản phẩm)
        if (!string.IsNullOrWhiteSpace(filter.SearchKeyword))
        {
            var keyword = filter.SearchKeyword.Trim();
            baseQuery = baseQuery.Where(p => p.BaseSku.Contains(keyword) || 
                                             p.Translations.Any(t => t.Name.Contains(keyword)));
        }

        // Tối ưu: Đếm trên baseQuery đơn giản (không JOIN 4 bảng không cần thiết)
        var totalCount = await baseQuery.CountAsync();

        var items = await baseQuery
            .Include(p => p.Category)
                .ThenInclude(c => c.Translations)
            .Include(p => p.Translations)
            .Include(p => p.ExportPackaging)
            .Include(p => p.PriceTiers)
            .OrderBy(p => p.Id)
            .Skip((filter.PageIndex - 1) * filter.PageSize)
            .Take(filter.PageSize)
            .ToListAsync();

        var dtos = items.Select(p =>
        {
            var pTranslation = p.Translations.FirstOrDefault(t => t.LanguageCode == lang)
                            ?? p.Translations.FirstOrDefault(t => t.LanguageCode == "en")
                            ?? p.Translations.FirstOrDefault();

            var cTranslation = p.Category.Translations.FirstOrDefault(t => t.LanguageCode == lang)
                            ?? p.Category.Translations.FirstOrDefault(t => t.LanguageCode == "en")
                            ?? p.Category.Translations.FirstOrDefault();

            var minMoq = p.PriceTiers.Any() ? p.PriceTiers.Min(t => t.MinQuantity) : 1;

            return new ProductSummaryDto
            {
                Id = p.Id,
                BaseSku = p.BaseSku,
                HsCode = p.HsCode,
                CountryOfOrigin = p.CountryOfOrigin,
                CategoryId = p.CategoryId,
                CategoryName = cTranslation?.Name ?? p.Category.Slug,
                Name = pTranslation?.Name ?? p.BaseSku,
                ShortDescription = pTranslation?.ShortDescription,
                DefaultRetailPriceUsd = p.DefaultRetailPriceUsd,
                CbmPerCarton = p.ExportPackaging?.CbmPerCarton ?? 0,
                GrossWeightKg = p.ExportPackaging?.GrossWeightKg ?? 0,
                PcsPerCarton = p.ExportPackaging?.PcsPerCarton ?? 1,
                MinimumMoq = minMoq
            };
        }).ToList();

        var paginatedResult = PaginatedResult<ProductSummaryDto>.Create(dtos, totalCount, filter.PageIndex, filter.PageSize);
        if (isDefaultCatalog && _cache != null)
        {
            _cache.Set(cacheKey, paginatedResult, TimeSpan.FromMinutes(5));
        }

        return paginatedResult;
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(long id, string languageCode = "vi")
    {
        var lang = string.IsNullOrWhiteSpace(languageCode) ? "vi" : languageCode.ToLowerInvariant();

        var cacheKey = $"Product_Detail_{id}_{lang}";
        if (_cache != null && _cache.TryGetValue(cacheKey, out ProductDetailDto? cachedDetail) && cachedDetail != null)
        {
            return cachedDetail;
        }

        var p = await _context.Products
            .AsNoTracking()
            .Include(p => p.Category)
                .ThenInclude(c => c.Translations)
            .Include(p => p.Translations)
            .Include(p => p.ExportPackaging)
            .Include(p => p.PriceTiers)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (p == null) return null;

        var pTranslation = p.Translations.FirstOrDefault(t => t.LanguageCode == lang)
                        ?? p.Translations.FirstOrDefault(t => t.LanguageCode == "en")
                        ?? p.Translations.FirstOrDefault();

        var cTranslation = p.Category.Translations.FirstOrDefault(t => t.LanguageCode == lang)
                        ?? p.Category.Translations.FirstOrDefault(t => t.LanguageCode == "en")
                        ?? p.Category.Translations.FirstOrDefault();

        var result = new ProductDetailDto
        {
            Id = p.Id,
            BaseSku = p.BaseSku,
            HsCode = p.HsCode,
            CountryOfOrigin = p.CountryOfOrigin,
            CategoryId = p.CategoryId,
            CategoryName = cTranslation?.Name ?? p.Category.Slug,
            Name = pTranslation?.Name ?? p.BaseSku,
            ShortDescription = pTranslation?.ShortDescription,
            FullDescription = pTranslation?.FullDescription,
            DefaultRetailPriceUsd = p.DefaultRetailPriceUsd,
            SpecificationsJson = p.SpecificationsJson,
            ExportPackaging = p.ExportPackaging == null ? null : new ExportPackagingDto
            {
                CartonLengthCm = p.ExportPackaging.CartonLengthCm,
                CartonWidthCm = p.ExportPackaging.CartonWidthCm,
                CartonHeightCm = p.ExportPackaging.CartonHeightCm,
                NetWeightKg = p.ExportPackaging.NetWeightKg,
                GrossWeightKg = p.ExportPackaging.GrossWeightKg,
                PcsPerCarton = p.ExportPackaging.PcsPerCarton,
                CbmPerCarton = p.ExportPackaging.CbmPerCarton,
                PalletLengthCm = p.ExportPackaging.PalletLengthCm,
                PalletWidthCm = p.ExportPackaging.PalletWidthCm,
                CartonsPerPallet = p.ExportPackaging.CartonsPerPallet
            },
            PriceTiers = p.PriceTiers.OrderBy(t => t.MinQuantity).Select(t => new PriceTierDto
            {
                Id = t.Id,
                MinQuantity = t.MinQuantity,
                MaxQuantity = t.MaxQuantity,
                UnitPriceUsd = t.UnitPriceUsd,
                DiscountPercentage = t.DiscountPercentage
            }).ToList()
        };

        _cache?.Set(cacheKey, result, TimeSpan.FromMinutes(10));
        return result;
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductRequestDto request, long createdByUserId)
    {
        var normalizedSku = request.BaseSku.Trim().ToUpperInvariant();

        if (await _context.Products.AnyAsync(p => p.BaseSku == normalizedSku))
        {
            throw new InvalidOperationException($"Mã SKU '{request.BaseSku}' đã tồn tại trong hệ thống.");
        }

        var product = new Product
        {
            CategoryId = request.CategoryId,
            BaseSku = normalizedSku,
            HsCode = request.HsCode.Trim(),
            CountryOfOrigin = request.CountryOfOrigin.Trim().ToUpperInvariant(),
            DefaultRetailPriceUsd = request.DefaultRetailPriceUsd,
            SpecificationsJson = request.SpecificationsJson,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        // Bản dịch Tiếng Việt
        product.Translations.Add(new ProductTranslation
        {
            LanguageCode = "vi",
            Name = request.NameVi.Trim(),
            ShortDescription = request.ShortDescriptionVi?.Trim(),
            FullDescription = request.FullDescriptionVi?.Trim()
        });

        // Bản dịch Tiếng Anh (nếu có)
        if (!string.IsNullOrWhiteSpace(request.NameEn))
        {
            product.Translations.Add(new ProductTranslation
            {
                LanguageCode = "en",
                Name = request.NameEn.Trim(),
                ShortDescription = request.ShortDescriptionEn?.Trim(),
                FullDescription = request.FullDescriptionEn?.Trim()
            });
        }

        // Quy cách đóng gói xuất khẩu
        product.ExportPackaging = new ExportPackaging
        {
            CartonLengthCm = request.CartonLengthCm,
            CartonWidthCm = request.CartonWidthCm,
            CartonHeightCm = request.CartonHeightCm,
            NetWeightKg = request.NetWeightKg,
            GrossWeightKg = request.GrossWeightKg,
            PcsPerCarton = request.PcsPerCarton
        };

        // Bảng giá bậc thang
        foreach (var tier in request.PriceTiers)
        {
            product.PriceTiers.Add(new ProductPriceTier
            {
                MinQuantity = tier.MinQuantity,
                MaxQuantity = tier.MaxQuantity,
                UnitPriceUsd = tier.UnitPriceUsd,
                DiscountPercentage = tier.DiscountPercentage
            });
        }

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return (await GetProductByIdAsync(product.Id, "vi"))!;
    }
}
