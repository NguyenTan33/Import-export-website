using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Persistence.Configurations;

public class IdentityConfigurations : 
    IEntityTypeConfiguration<User>, 
    IEntityTypeConfiguration<Role>, 
    IEntityTypeConfiguration<UserRole>, 
    IEntityTypeConfiguration<Company>
{
    public void Configure(EntityTypeBuilder<User> builder)
    {
        builder.ToTable("Users");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Email).HasMaxLength(255).IsRequired();
        builder.HasIndex(x => x.Email).IsUnique();
        builder.Property(x => x.FullName).HasMaxLength(150).IsRequired();
        builder.Property(x => x.RowVersion).IsRowVersion();
    }

    public void Configure(EntityTypeBuilder<Role> builder)
    {
        builder.ToTable("Roles");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.Name).IsUnique();
    }

    public void Configure(EntityTypeBuilder<UserRole> builder)
    {
        builder.ToTable("UserRoles");
        builder.HasKey(x => new { x.UserId, x.RoleId });

        builder.HasOne(x => x.User)
            .WithMany(u => u.UserRoles)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Role)
            .WithMany(r => r.UserRoles)
            .HasForeignKey(x => x.RoleId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<Company> builder)
    {
        builder.ToTable("Companies");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.UserId).IsUnique();
        builder.Property(x => x.CompanyName).HasMaxLength(255).IsRequired();
        builder.Property(x => x.TaxId).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.TaxId).IsUnique();
        builder.Property(x => x.CountryCode).HasMaxLength(3).IsRequired();
        builder.Property(x => x.CreditLimit).HasPrecision(18, 2);

        builder.HasOne(x => x.User)
            .WithOne(u => u.Company)
            .HasForeignKey<Company>(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class CatalogConfigurations :
    IEntityTypeConfiguration<Category>,
    IEntityTypeConfiguration<CategoryTranslation>,
    IEntityTypeConfiguration<Product>,
    IEntityTypeConfiguration<ProductTranslation>,
    IEntityTypeConfiguration<ExportPackaging>
{
    public void Configure(EntityTypeBuilder<Category> builder)
    {
        builder.ToTable("Categories");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Slug).HasMaxLength(150).IsRequired();
        builder.HasIndex(x => x.Slug).IsUnique();

        builder.HasOne(x => x.Parent)
            .WithMany(c => c.SubCategories)
            .HasForeignKey(x => x.ParentId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<CategoryTranslation> builder)
    {
        builder.ToTable("CategoryTranslations");
        builder.HasKey(x => new { x.CategoryId, x.LanguageCode });
        builder.Property(x => x.LanguageCode).HasMaxLength(5).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
        builder.Property(x => x.Description).HasMaxLength(500);

        builder.HasOne(x => x.Category)
            .WithMany(c => c.Translations)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.ToTable("Products");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.BaseSku).HasMaxLength(60).IsRequired();
        builder.HasIndex(x => x.BaseSku).IsUnique();
        builder.Property(x => x.HsCode).HasMaxLength(20).IsRequired();
        builder.Property(x => x.DefaultRetailPriceUsd).HasPrecision(18, 2);

        builder.HasQueryFilter(p => !p.IsDeleted);

        builder.HasOne(x => x.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(x => x.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<ProductTranslation> builder)
    {
        builder.ToTable("ProductTranslations");
        builder.HasKey(x => new { x.ProductId, x.LanguageCode });
        builder.Property(x => x.LanguageCode).HasMaxLength(5).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(255).IsRequired();

        builder.HasOne(x => x.Product)
            .WithMany(p => p.Translations)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<ExportPackaging> builder)
    {
        builder.ToTable("ExportPackaging");
        builder.HasKey(x => x.ProductId);
        builder.Property(x => x.CartonLengthCm).HasPrecision(8, 2);
        builder.Property(x => x.CartonWidthCm).HasPrecision(8, 2);
        builder.Property(x => x.CartonHeightCm).HasPrecision(8, 2);
        builder.Property(x => x.NetWeightKg).HasPrecision(10, 3);
        builder.Property(x => x.GrossWeightKg).HasPrecision(10, 3);
        builder.Property(x => x.CbmPerCarton).HasPrecision(10, 4);

        builder.HasOne(x => x.Product)
            .WithOne(p => p.ExportPackaging)
            .HasForeignKey<ExportPackaging>(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}

public class PricingAndSalesConfigurations :
    IEntityTypeConfiguration<Currency>,
    IEntityTypeConfiguration<ExchangeRate>,
    IEntityTypeConfiguration<ProductPriceTier>,
    IEntityTypeConfiguration<Incoterm>,
    IEntityTypeConfiguration<Order>,
    IEntityTypeConfiguration<OrderItem>,
    IEntityTypeConfiguration<RfqRequest>,
    IEntityTypeConfiguration<RfqItem>,
    IEntityTypeConfiguration<B2BPayment>
{
    public void Configure(EntityTypeBuilder<Currency> builder)
    {
        builder.ToTable("Currencies");
        builder.HasKey(x => x.Code);
        builder.Property(x => x.Code).HasMaxLength(3).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(50).IsRequired();
        builder.Property(x => x.Symbol).HasMaxLength(10).IsRequired();
    }

    public void Configure(EntityTypeBuilder<ExchangeRate> builder)
    {
        builder.ToTable("ExchangeRates");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Rate).HasPrecision(18, 6);

        builder.HasOne(x => x.FromCurrencyNavigation)
            .WithMany(c => c.FromExchangeRates)
            .HasForeignKey(x => x.FromCurrency)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.ToCurrencyNavigation)
            .WithMany(c => c.ToExchangeRates)
            .HasForeignKey(x => x.ToCurrency)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<ProductPriceTier> builder)
    {
        builder.ToTable("ProductPriceTiers");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UnitPriceUsd).HasPrecision(18, 4);
        builder.Property(x => x.DiscountPercentage).HasPrecision(5, 2);

        builder.HasOne(x => x.Product)
            .WithMany(p => p.PriceTiers)
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<Incoterm> builder)
    {
        builder.ToTable("Incoterms");
        builder.HasKey(x => x.Code);
        builder.Property(x => x.Code).HasMaxLength(10).IsRequired();
        builder.Property(x => x.Name).HasMaxLength(100).IsRequired();
    }

    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.OrderCode).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.OrderCode).IsUnique();
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.Property(x => x.SubtotalUsd).HasPrecision(18, 2);
        builder.Property(x => x.ShippingFeeUsd).HasPrecision(18, 2);
        builder.Property(x => x.TaxAmountUsd).HasPrecision(18, 2);
        builder.Property(x => x.TotalAmountUsd).HasPrecision(18, 2);
        builder.Property(x => x.ExchangeRateToUsd).HasPrecision(18, 6);

        builder.HasOne(x => x.User)
            .WithMany(u => u.Orders)
            .HasForeignKey(x => x.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Currency)
            .WithMany()
            .HasForeignKey(x => x.CurrencyCode)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<OrderItem> builder)
    {
        builder.ToTable("OrderItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.UnitPriceUsd).HasPrecision(18, 4);
        builder.Property(x => x.TotalPriceUsd).HasPrecision(18, 2);

        builder.HasOne(x => x.Order)
            .WithMany(o => o.OrderItems)
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<RfqRequest> builder)
    {
        builder.ToTable("RfqRequests");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.RfqNumber).HasMaxLength(50).IsRequired();
        builder.HasIndex(x => x.RfqNumber).IsUnique();
        builder.Property(x => x.RowVersion).IsRowVersion();

        builder.Property(x => x.TotalCbm).HasPrecision(12, 4);
        builder.Property(x => x.TotalGrossWeightKg).HasPrecision(12, 2);
        builder.Property(x => x.OceanFreightCostUsd).HasPrecision(18, 2);
        builder.Property(x => x.MarineInsuranceCostUsd).HasPrecision(18, 2);
        builder.Property(x => x.TotalQuotedAmountUsd).HasPrecision(18, 2);

        builder.HasOne(x => x.Company)
            .WithMany(c => c.RfqRequests)
            .HasForeignKey(x => x.CompanyId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Incoterm)
            .WithMany()
            .HasForeignKey(x => x.IncotermCode)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<RfqItem> builder)
    {
        builder.ToTable("RfqItems");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TargetPriceUsd).HasPrecision(18, 4);
        builder.Property(x => x.QuotedUnitPriceUsd).HasPrecision(18, 4);
        builder.Property(x => x.CalculatedCbm).HasPrecision(10, 4);

        builder.HasOne(x => x.RfqRequest)
            .WithMany(r => r.RfqItems)
            .HasForeignKey(x => x.RfqId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<B2BPayment> builder)
    {
        builder.ToTable("B2BPayments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.AmountUsd).HasPrecision(18, 2);

        builder.HasOne(x => x.RfqRequest)
            .WithMany(r => r.Payments)
            .HasForeignKey(x => x.RfqId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public class LogisticsAndComplianceConfigurations :
    IEntityTypeConfiguration<Warehouse>,
    IEntityTypeConfiguration<InventoryLedger>,
    IEntityTypeConfiguration<StockReservation>,
    IEntityTypeConfiguration<ShipmentMilestone>,
    IEntityTypeConfiguration<ExportDocument>,
    IEntityTypeConfiguration<AuditLog>,
    IEntityTypeConfiguration<ProcessedWebhookEvent>
{
    public void Configure(EntityTypeBuilder<Warehouse> builder)
    {
        builder.ToTable("Warehouses");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Code).HasMaxLength(30).IsRequired();
        builder.HasIndex(x => x.Code).IsUnique();
        builder.Property(x => x.Name).HasMaxLength(150).IsRequired();
    }

    public void Configure(EntityTypeBuilder<InventoryLedger> builder)
    {
        builder.ToTable("InventoryLedger");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.TransactionType).HasMaxLength(30).IsRequired();

        builder.HasOne(x => x.Warehouse)
            .WithMany(w => w.InventoryLedgers)
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<StockReservation> builder)
    {
        builder.ToTable("StockReservations");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.Warehouse)
            .WithMany(w => w.StockReservations)
            .HasForeignKey(x => x.WarehouseId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Product)
            .WithMany()
            .HasForeignKey(x => x.ProductId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<ShipmentMilestone> builder)
    {
        builder.ToTable("ShipmentMilestones");
        builder.HasKey(x => x.Id);

        builder.HasOne(x => x.RfqRequest)
            .WithMany(r => r.ShipmentMilestones)
            .HasForeignKey(x => x.RfqId)
            .OnDelete(DeleteBehavior.Cascade);
    }

    public void Configure(EntityTypeBuilder<ExportDocument> builder)
    {
        builder.ToTable("ExportDocuments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.DocumentNumber).HasMaxLength(100).IsRequired();
        builder.HasIndex(x => x.DocumentNumber).IsUnique();

        builder.HasOne(x => x.RfqRequest)
            .WithMany()
            .HasForeignKey(x => x.RfqId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasOne(x => x.Order)
            .WithMany()
            .HasForeignKey(x => x.OrderId)
            .OnDelete(DeleteBehavior.Restrict);
    }

    public void Configure(EntityTypeBuilder<AuditLog> builder)
    {
        builder.ToTable("AuditLogs");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Action).HasMaxLength(50).IsRequired();
        builder.Property(x => x.EntityName).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EntityId).HasMaxLength(100).IsRequired();
    }

    public void Configure(EntityTypeBuilder<ProcessedWebhookEvent> builder)
    {
        builder.ToTable("ProcessedWebhookEvents");
        builder.HasKey(x => x.EventId);
        builder.Property(x => x.EventId).HasMaxLength(100).IsRequired();
        builder.Property(x => x.EventType).HasMaxLength(100).IsRequired();
    }
}
