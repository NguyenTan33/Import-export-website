using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Persistence.Context;

public class WebXnkDbContext : DbContext, IApplicationDbContext
{
    public WebXnkDbContext(DbContextOptions<WebXnkDbContext> options) : base(options)
    {
    }

    // Identity & B2B
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<Company> Companies => Set<Company>();

    // Catalog & Packaging
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<CategoryTranslation> CategoryTranslations => Set<CategoryTranslation>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductTranslation> ProductTranslations => Set<ProductTranslation>();
    public DbSet<ExportPackaging> ExportPackaging => Set<ExportPackaging>();

    // Pricing & FX
    public DbSet<ProductPriceTier> ProductPriceTiers => Set<ProductPriceTier>();
    public DbSet<Currency> Currencies => Set<Currency>();
    public DbSet<ExchangeRate> ExchangeRates => Set<ExchangeRate>();

    // Sales, Incoterms, RFQ, Payments
    public DbSet<Incoterm> Incoterms => Set<Incoterm>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<RfqRequest> RfqRequests => Set<RfqRequest>();
    public DbSet<RfqItem> RfqItems => Set<RfqItem>();
    public DbSet<RfqNegotiationHistory> RfqNegotiationHistories => Set<RfqNegotiationHistory>();
    public DbSet<B2BPayment> B2BPayments => Set<B2BPayment>();

    // Logistics & Warehouses
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<InventoryLedger> InventoryLedger => Set<InventoryLedger>();
    public DbSet<StockReservation> StockReservations => Set<StockReservation>();
    public DbSet<ShipmentMilestone> ShipmentMilestones => Set<ShipmentMilestone>();

    // Compliance & Documents
    public DbSet<ExportDocument> ExportDocuments => Set<ExportDocument>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ProcessedWebhookEvent> ProcessedWebhookEvents => Set<ProcessedWebhookEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(WebXnkDbContext).Assembly);
    }
}
