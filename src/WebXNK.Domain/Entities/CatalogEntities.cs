using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class Category : BaseEntity<int>
{
    public int? ParentId { get; set; }
    public Category? Parent { get; set; }
    public string Slug { get; set; } = string.Empty;

    public ICollection<Category> SubCategories { get; set; } = new List<Category>();
    public ICollection<CategoryTranslation> Translations { get; set; } = new List<CategoryTranslation>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class CategoryTranslation
{
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string LanguageCode { get; set; } = string.Empty; // 'en', 'vi'
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class Product : BaseEntity<long>, IAuditableEntity, ISoftDeletable
{
    public int CategoryId { get; set; }
    public Category Category { get; set; } = null!;

    public string BaseSku { get; set; } = string.Empty;
    public string HsCode { get; set; } = string.Empty;
    public string CountryOfOrigin { get; set; } = "VNM";
    public decimal DefaultRetailPriceUsd { get; set; }
    public string? ImageUrl { get; set; }
    public string? ImageUrlsJson { get; set; }
    public string? SpecificationsJson { get; set; }
    public bool IsActive { get; set; } = true;
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }

    public ExportPackaging? ExportPackaging { get; set; }
    public ICollection<ProductTranslation> Translations { get; set; } = new List<ProductTranslation>();
    public ICollection<ProductPriceTier> PriceTiers { get; set; } = new List<ProductPriceTier>();
}

public class ProductTranslation
{
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public string LanguageCode { get; set; } = string.Empty; // 'en', 'vi', 'ja'
    public string Name { get; set; } = string.Empty;
    public string? ShortDescription { get; set; }
    public string? FullDescription { get; set; }
}

public class ExportPackaging
{
    public long ProductId { get; set; }
    public Product Product { get; set; } = null!;

    public decimal CartonLengthCm { get; set; }
    public decimal CartonWidthCm { get; set; }
    public decimal CartonHeightCm { get; set; }
    public decimal NetWeightKg { get; set; }
    public decimal GrossWeightKg { get; set; }
    public int PcsPerCarton { get; set; }
    public decimal CbmPerCarton { get; private set; } // Computed column

    public decimal? PalletLengthCm { get; set; }
    public decimal? PalletWidthCm { get; set; }
    public int? CartonsPerPallet { get; set; }
}
