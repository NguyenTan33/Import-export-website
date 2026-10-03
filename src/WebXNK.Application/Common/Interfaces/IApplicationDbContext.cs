using Microsoft.EntityFrameworkCore;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Common.Interfaces;

public interface IApplicationDbContext
{
    DbSet<User> Users { get; }
    DbSet<Role> Roles { get; }
    DbSet<UserRole> UserRoles { get; }
    DbSet<Company> Companies { get; }

    DbSet<Category> Categories { get; }
    DbSet<CategoryTranslation> CategoryTranslations { get; }
    DbSet<Product> Products { get; }
    DbSet<ProductTranslation> ProductTranslations { get; }
    DbSet<ExportPackaging> ExportPackaging { get; }

    DbSet<ProductPriceTier> ProductPriceTiers { get; }
    DbSet<Currency> Currencies { get; }
    DbSet<ExchangeRate> ExchangeRates { get; }

    DbSet<Incoterm> Incoterms { get; }
    DbSet<Order> Orders { get; }
    DbSet<OrderItem> OrderItems { get; }
    DbSet<RfqRequest> RfqRequests { get; }
    DbSet<RfqItem> RfqItems { get; }
    DbSet<RfqNegotiationHistory> RfqNegotiationHistories { get; }
    DbSet<B2BPayment> B2BPayments { get; }

    DbSet<Warehouse> Warehouses { get; }
    DbSet<InventoryLedger> InventoryLedger { get; }
    DbSet<StockReservation> StockReservations { get; }
    DbSet<ShipmentMilestone> ShipmentMilestones { get; }

    DbSet<ExportDocument> ExportDocuments { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ProcessedWebhookEvent> ProcessedWebhookEvents { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
