using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using System.Text.Json;
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

        bool isDefaultCatalog = !filter.IncludeInactive
            && !filter.CategoryId.HasValue 
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
            .Where(p => filter.IncludeInactive || p.IsActive);

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
                IsActive = p.IsActive,
                ImageUrl = p.ImageUrl,
                ImageUrls = DeserializeImageUrls(p.ImageUrlsJson, p.ImageUrl),
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
            IsActive = p.IsActive,
            ImageUrl = p.ImageUrl,
            ImageUrls = DeserializeImageUrls(p.ImageUrlsJson, p.ImageUrl),
            Translations = p.Translations.Select(t => new ProductTranslationDto
            {
                LanguageCode = t.LanguageCode,
                Name = t.Name,
                ShortDescription = t.ShortDescription,
                FullDescription = t.FullDescription
            }).ToList(),
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
        var normalizedSku = request.BaseSku?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedSku)) throw new ArgumentException("SKU không được để trống.");
        if (!await _context.Categories.AnyAsync(c => c.Id == request.CategoryId))
            throw new ArgumentException("Danh mục sản phẩm không tồn tại.");

        if (await _context.Products.AnyAsync(p => p.BaseSku == normalizedSku))
        {
            throw new InvalidOperationException($"Mã SKU '{request.BaseSku}' đã tồn tại trong hệ thống.");
        }

        var product = new Product
        {
            CategoryId = request.CategoryId,
            BaseSku = normalizedSku,
            HsCode = request.HsCode?.Trim() ?? string.Empty,
            CountryOfOrigin = request.CountryOfOrigin?.Trim().ToUpperInvariant() ?? "VNM",
            DefaultRetailPriceUsd = request.DefaultRetailPriceUsd,
            ImageUrl = request.ImageUrls?.FirstOrDefault() ?? request.ImageUrl,
            ImageUrlsJson = SerializeImageUrls(request.ImageUrls, request.ImageUrl),
            SpecificationsJson = request.SpecificationsJson,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        foreach (var language in new[] { "vi", "en" })
        {
            var translation = request.Translations?.FirstOrDefault(t => string.Equals(t.LanguageCode, language, StringComparison.OrdinalIgnoreCase));
            var name = translation?.Name ?? (language == "vi" ? request.NameVi : request.NameEn) ?? string.Empty;
            if (language == "vi" && string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Tên sản phẩm tiếng Việt không được để trống.");
            if (language == "vi" || !string.IsNullOrWhiteSpace(name))
            {
            product.Translations.Add(new ProductTranslation
            {
                LanguageCode = language,
                Name = name.Trim(),
                ShortDescription = (translation?.ShortDescription ?? translation?.Description ?? (language == "vi" ? request.ShortDescriptionVi : request.ShortDescriptionEn))?.Trim(),
                FullDescription = (translation?.FullDescription ?? translation?.Description ?? (language == "vi" ? request.FullDescriptionVi : request.FullDescriptionEn))?.Trim()
            });
            }
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
        foreach (var tier in request.PriceTiers ?? new List<CreatePriceTierDto>())
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

        InvalidateProductCache(product.Id);
        return (await GetProductByIdAsync(product.Id, "vi"))!;
    }

    public async Task<ProductDetailDto?> UpdateProductAsync(long id, UpdateProductRequestDto request)
    {
        var product = await _context.Products
            .Include(p => p.Translations)
            .Include(p => p.ExportPackaging)
            .Include(p => p.PriceTiers)
            .FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        var normalizedSku = request.BaseSku?.Trim().ToUpperInvariant() ?? string.Empty;
        if (string.IsNullOrWhiteSpace(normalizedSku)) throw new ArgumentException("SKU không được để trống.");
        if (await _context.Products.AnyAsync(p => p.Id != id && p.BaseSku == normalizedSku))
            throw new InvalidOperationException($"Mã SKU '{request.BaseSku}' đã tồn tại trong hệ thống.");
        if (!await _context.Categories.AnyAsync(c => c.Id == request.CategoryId))
            throw new ArgumentException("Danh mục sản phẩm không tồn tại.");

        product.CategoryId = request.CategoryId;
        product.BaseSku = normalizedSku;
        product.HsCode = request.HsCode?.Trim() ?? string.Empty;
        product.CountryOfOrigin = request.CountryOfOrigin?.Trim().ToUpperInvariant() ?? "VNM";
        product.DefaultRetailPriceUsd = request.DefaultRetailPriceUsd;
        product.ImageUrlsJson = SerializeImageUrls(request.ImageUrls, request.ImageUrl);
        product.ImageUrl = DeserializeImageUrls(product.ImageUrlsJson, request.ImageUrl).FirstOrDefault();
        product.SpecificationsJson = request.SpecificationsJson;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTime.UtcNow;

        foreach (var language in new[] { "vi", "en" })
        {
            var translation = request.Translations?.FirstOrDefault(t => string.Equals(t.LanguageCode, language, StringComparison.OrdinalIgnoreCase));
            var name = translation?.Name ?? (language == "vi" ? request.NameVi : request.NameEn) ?? string.Empty;
            if (language == "vi" && string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Tên sản phẩm tiếng Việt không được để trống.");
            if (language == "vi" || !string.IsNullOrWhiteSpace(name))
            {
                SetTranslation(product, language, name, translation?.ShortDescription ?? translation?.Description ?? (language == "vi" ? request.ShortDescriptionVi : request.ShortDescriptionEn), translation?.FullDescription ?? translation?.Description ?? (language == "vi" ? request.FullDescriptionVi : request.FullDescriptionEn));
            }
            else
            {
                var oldTranslation = product.Translations.FirstOrDefault(t => t.LanguageCode == language);
                if (oldTranslation != null) product.Translations.Remove(oldTranslation);
            }
        }

        product.ExportPackaging ??= new ExportPackaging { ProductId = product.Id };
        product.ExportPackaging.CartonLengthCm = request.CartonLengthCm;
        product.ExportPackaging.CartonWidthCm = request.CartonWidthCm;
        product.ExportPackaging.CartonHeightCm = request.CartonHeightCm;
        product.ExportPackaging.NetWeightKg = request.NetWeightKg;
        product.ExportPackaging.GrossWeightKg = request.GrossWeightKg;
        product.ExportPackaging.PcsPerCarton = request.PcsPerCarton;

        foreach (var tier in product.PriceTiers.ToList()) product.PriceTiers.Remove(tier);
        foreach (var tier in request.PriceTiers ?? new List<CreatePriceTierDto>())
            product.PriceTiers.Add(new ProductPriceTier
            {
                ProductId = product.Id,
                MinQuantity = tier.MinQuantity,
                MaxQuantity = tier.MaxQuantity,
                UnitPriceUsd = tier.UnitPriceUsd,
                DiscountPercentage = tier.DiscountPercentage
            });

        await _context.SaveChangesAsync();
        InvalidateProductCache(id);
        return await GetProductByIdAsync(id, "vi");
    }

    public async Task<bool> DeleteProductAsync(long id)
    {
        // Product has a global soft-delete filter. Ignore it here so a retry
        // after a successful delete remains idempotent instead of returning 404.
        var product = await _context.Products.IgnoreQueryFilters().FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return false;
        if (product.IsDeleted) return true;
        product.IsDeleted = true;
        product.IsActive = false;
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        InvalidateProductCache(id);
        return true;
    }

    private static void SetTranslation(Product product, string language, string name, string? shortDescription, string? fullDescription)
    {
        var translation = product.Translations.FirstOrDefault(t => t.LanguageCode == language);
        if (translation == null)
        {
            translation = new ProductTranslation { ProductId = product.Id, LanguageCode = language };
            product.Translations.Add(translation);
        }
        translation.Name = name.Trim();
        translation.ShortDescription = shortDescription?.Trim();
        translation.FullDescription = fullDescription?.Trim();
    }

    private static string SerializeImageUrls(IEnumerable<string>? imageUrls, string? primaryImageUrl)
    {
        var urls = (imageUrls ?? Array.Empty<string>()).Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct().ToList();
        if (urls.Count == 0 && !string.IsNullOrWhiteSpace(primaryImageUrl)) urls.Add(primaryImageUrl.Trim());
        return JsonSerializer.Serialize(urls);
    }

    private static List<string> DeserializeImageUrls(string? imageUrlsJson, string? primaryImageUrl)
    {
        try
        {
            var urls = string.IsNullOrWhiteSpace(imageUrlsJson) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(imageUrlsJson) ?? new List<string>();
            if (urls.Count == 0 && !string.IsNullOrWhiteSpace(primaryImageUrl)) urls.Add(primaryImageUrl);
            return urls;
        }
        catch (JsonException)
        {
            return string.IsNullOrWhiteSpace(primaryImageUrl) ? new List<string>() : new List<string> { primaryImageUrl };
        }
    }

    public async Task<ProductDetailDto?> UpdateProductImageAsync(long id, string imageUrl)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;

        product.ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl.Trim();
        product.ImageUrlsJson = SerializeImageUrls(null, product.ImageUrl);
        product.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        InvalidateProductCache(id);

        return await GetProductByIdAsync(id, "vi");
    }

    public async Task<ProductDetailDto?> UpdateProductImagesAsync(long id, IReadOnlyCollection<string> imageUrls)
    {
        var product = await _context.Products.FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return null;
        var urls = imageUrls.Where(x => !string.IsNullOrWhiteSpace(x)).Select(x => x.Trim()).Distinct().ToList();
        product.ImageUrlsJson = JsonSerializer.Serialize(urls);
        product.ImageUrl = urls.FirstOrDefault();
        product.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        InvalidateProductCache(id);
        return await GetProductByIdAsync(id, "vi");
    }

    private void InvalidateProductCache(long productId)
    {
        if (_cache == null) return;

        foreach (var lang in new[] { "vi", "en" })
        {
            _cache.Remove($"Product_Detail_{productId}_{lang}");
            foreach (var pageSize in new[] { 6, 8, 10, 12, 16, 20, 24, 50, 100, 200 })
            {
                _cache.Remove($"Products_Catalog_{lang}_{pageSize}");
            }
        }
    }
}
