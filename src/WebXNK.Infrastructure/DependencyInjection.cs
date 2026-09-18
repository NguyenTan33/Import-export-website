using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using WebXNK.Infrastructure.Persistence.Context;

namespace WebXNK.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructureServices(
        this IServiceCollection services, 
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

        services.AddDbContext<WebXnkDbContext>(options =>
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(30),
                    errorNumbersToAdd: null);
            }));

        services.AddScoped<WebXNK.Application.Common.Interfaces.IApplicationDbContext>(provider => 
            provider.GetRequiredService<WebXnkDbContext>());

        services.AddSingleton<WebXNK.Application.Common.Interfaces.IPasswordHasher, Services.Identity.PasswordHasher>();
        services.AddScoped<WebXNK.Application.Common.Interfaces.IJwtTokenGenerator, Services.Identity.JwtTokenGenerator>();

        // Tích hợp AWS S3 và Storage Service (EXP-59)
        services.AddSingleton<WebXNK.Application.Common.Interfaces.IStorageService, Services.Storage.AwsS3StorageService>();

        // Tích hợp QuestPDF Document Service tự sinh Proforma Invoice, Commercial Invoice, Packing List (EXP-56, EXP-69)
        services.AddScoped<WebXNK.Application.Interfaces.IExportDocumentService, Services.Documents.QuestPdfExportDocumentService>();

        // Background worker tự động giải phóng hàng giữ chỗ quá hạn 30 phút (EXP-79)
        services.AddHostedService<Services.BackgroundJobs.ExpiredReservationCleanupWorker>();

        return services;
    }
}
