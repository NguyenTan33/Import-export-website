namespace WebXNK.Application.DTOs;

public class ProductSummaryDto
{
    public long Id { get; set; }
    public string BaseSku { get; set; } = string.Empty;
    public string HsCode { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public decimal DefaultRetailPriceUsd { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public decimal CbmPerCarton { get; set; }
    public decimal GrossWeightKg { get; set; }
    public int PcsPerCarton { get; set; }
    public int MinimumMoq { get; set; }
}

public class ProductDetailDto
{
    public long Id { get; set; }
    public string BaseSku { get; set; } = string.Empty;
    public string HsCode { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = string.Empty;
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
    public decimal DefaultRetailPriceUsd { get; set; }
    public bool IsActive { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public string? SpecificationsJson { get; set; }

    public ExportPackagingDto? ExportPackaging { get; set; }
    public List<PriceTierDto> PriceTiers { get; set; } = new();
}

public class ExportPackagingDto
{
    public decimal CartonLengthCm { get; set; }
    public decimal CartonWidthCm { get; set; }
    public decimal CartonHeightCm { get; set; }
    public decimal NetWeightKg { get; set; }
    public decimal GrossWeightKg { get; set; }
    public int PcsPerCarton { get; set; }
    public decimal CbmPerCarton { get; set; }
    public decimal? PalletLengthCm { get; set; }
    public decimal? PalletWidthCm { get; set; }
    public int? CartonsPerPallet { get; set; }
}

public class PriceTierDto
{
    public long Id { get; set; }
    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal DiscountPercentage { get; set; }
}

public class ProductFilterRequestDto
{
    public int PageIndex { get; set; } = 1;
    public int PageSize { get; set; } = 10;
    public string? SearchKeyword { get; set; }
    public int? CategoryId { get; set; }
    public string? HsCode { get; set; }
    public decimal? MinPrice { get; set; }
    public decimal? MaxPrice { get; set; }
    public string LanguageCode { get; set; } = "vi"; // 'vi' hoặc 'en'
    public bool IncludeInactive { get; set; }
}

public class PaginatedResult<T>
{
    public List<T> Items { get; set; } = new();
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => PageIndex > 1;
    public bool HasNextPage => PageIndex < TotalPages;

    public static PaginatedResult<T> Create(List<T> items, int count, int pageIndex, int pageSize)
    {
        return new PaginatedResult<T>
        {
            Items = items,
            TotalCount = count,
            PageIndex = pageIndex,
            PageSize = pageSize
        };
    }
}

public class CreateProductRequestDto
{
    public int CategoryId { get; set; }
    public string BaseSku { get; set; } = string.Empty;
    public string HsCode { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = "VNM";
    public decimal DefaultRetailPriceUsd { get; set; }
    public string? ImageUrl { get; set; }
    public List<string> ImageUrls { get; set; } = new();
    public string? SpecificationsJson { get; set; }

    // Bản dịch Tiếng Việt
    public string NameVi { get; set; } = string.Empty;
    public string? ShortDescriptionVi { get; set; }
    public string? FullDescriptionVi { get; set; }

    // Bản dịch Tiếng Anh
    public string NameEn { get; set; } = string.Empty;
    public string? ShortDescriptionEn { get; set; }
    public string? FullDescriptionEn { get; set; }

    // Quy cách đóng gói xuất khẩu
    public decimal CartonLengthCm { get; set; }
    public decimal CartonWidthCm { get; set; }
    public decimal CartonHeightCm { get; set; }
    public decimal NetWeightKg { get; set; }
    public decimal GrossWeightKg { get; set; }
    public int PcsPerCarton { get; set; }

    // Bảng giá bậc thang
    public List<CreatePriceTierDto> PriceTiers { get; set; } = new();
}

public class UpdateProductRequestDto : CreateProductRequestDto
{
    public bool IsActive { get; set; } = true;
}

public class CreatePriceTierDto
{
    public int MinQuantity { get; set; }
    public int? MaxQuantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal DiscountPercentage { get; set; }
}

public class UpdateProductImageRequestDto
{
    public string ImageUrl { get; set; } = string.Empty;
}
