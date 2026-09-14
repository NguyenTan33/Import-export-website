using Microsoft.Extensions.DependencyInjection;
using WebXNK.Application.Interfaces;
using WebXNK.Application.Services;

namespace WebXNK.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<ICbmCalculatorService, CbmCalculatorService>();
        services.AddScoped<ITierPricingService, TierPricingService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICompanyManagementService, CompanyManagementService>();
        services.AddScoped<IProductService, ProductService>();
        services.AddScoped<IInventoryService, InventoryService>();

        return services;
    }
}
