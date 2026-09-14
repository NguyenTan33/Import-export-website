using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class TierPricingService : ITierPricingService
{
    private readonly IApplicationDbContext _context;

    public TierPricingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<CalculateTierPriceResponseDto> CalculatePriceAsync(CalculateTierPriceRequestDto request)
    {
        var product = await _context.Products
            .AsNoTracking()
            .Include(p => p.PriceTiers)
            .FirstOrDefaultAsync(p => p.Id == request.ProductId);

        if (product == null)
        {
            throw new KeyNotFoundException($"Product with ID {request.ProductId} was not found.");
        }

        var tiers = product.PriceTiers.OrderBy(t => t.MinQuantity).ToList();
        var minMoq = tiers.Count > 0 ? tiers.First().MinQuantity : 1;

        // B2C hoặc chưa có tier sỉ: giá bán lẻ mặc định
        decimal unitPriceUsd = product.DefaultRetailPriceUsd;
        decimal discountPercentage = 0;

        // Tìm tier phù hợp với số lượng yêu cầu
        var matchingTier = tiers
            .Where(t => request.Quantity >= t.MinQuantity && (!t.MaxQuantity.HasValue || request.Quantity <= t.MaxQuantity.Value))
            .OrderByDescending(t => t.MinQuantity)
            .FirstOrDefault();

        if (matchingTier != null)
        {
            unitPriceUsd = matchingTier.UnitPriceUsd;
            discountPercentage = matchingTier.DiscountPercentage;
        }

        var totalUsd = Math.Round(unitPriceUsd * request.Quantity, 2);

        // Quy đổi tiền tệ nếu không phải USD (EXP-18, EXP-30)
        decimal exchangeRate = 1;
        var targetCurrency = request.TargetCurrency.ToUpperInvariant();

        if (targetCurrency != "USD")
        {
            var latestRate = await _context.ExchangeRates
                .AsNoTracking()
                .Where(r => r.FromCurrency == "USD" && r.ToCurrency == targetCurrency)
                .OrderByDescending(r => r.FetchedAt)
                .Select(r => r.Rate)
                .FirstOrDefaultAsync();

            if (latestRate > 0)
            {
                exchangeRate = latestRate;
            }
        }

        return new CalculateTierPriceResponseDto
        {
            ProductId = product.Id,
            RequestedQuantity = request.Quantity,
            MinimumOrderQuantity = minMoq,
            BasePriceUsd = product.DefaultRetailPriceUsd,
            AppliedUnitPriceUsd = unitPriceUsd,
            DiscountPercentage = discountPercentage,
            TotalAmountUsd = totalUsd,
            Currency = targetCurrency,
            ConvertedUnitPrice = Math.Round(unitPriceUsd * exchangeRate, 2),
            ConvertedTotalAmount = Math.Round(totalUsd * exchangeRate, 2),
            IsMoqSatisfied = request.Quantity >= minMoq
        };
    }
}
