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

        // Incoterms 2020 Engine & Strategy Pattern (EXP-47, EXP-51)
        services.AddSingleton<Common.Incoterms.IIncotermPriceStrategy, Common.Incoterms.FobIncotermStrategy>();
        services.AddSingleton<Common.Incoterms.IIncotermPriceStrategy, Common.Incoterms.CifIncotermStrategy>();
        services.AddSingleton<Common.Incoterms.IIncotermPriceStrategy, Common.Incoterms.CfrIncotermStrategy>();
        services.AddSingleton<Common.Incoterms.IIncotermPriceStrategy, Common.Incoterms.ExwIncotermStrategy>();
        services.AddSingleton<Common.Incoterms.IIncotermPriceStrategy, Common.Incoterms.DdpIncotermStrategy>();
        services.AddSingleton<Common.Incoterms.IIncotermStrategyFactory, Common.Incoterms.IncotermStrategyFactory>();
        services.AddSingleton<Common.Logistics.IOceanFreightEstimator, Common.Logistics.OceanFreightEstimator>();
        services.AddSingleton<Common.Logistics.IMarineInsuranceCalculator, Common.Logistics.MarineInsuranceCalculator>();
        services.AddScoped<IIncotermsCalculationService, IncotermsCalculationService>();

        // Domain Policies (SRP)
        services.AddSingleton<Common.Policies.IShippingFeeCalculator, Common.Policies.ShippingFeeCalculator>();
        services.AddSingleton<Common.Policies.IRfqStatePolicy, Common.Policies.RfqStatePolicy>();

        // Commerce & B2B RFQ (EXP-39, EXP-45, EXP-54)
        services.AddScoped<IOrderService, OrderService>();
        services.AddScoped<IRfqService, RfqService>();

        return services;
    }
}
