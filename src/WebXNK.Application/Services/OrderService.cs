using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.Common.Mappers;
using WebXNK.Application.Common.Policies;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

/// <summary>
/// Thin Service điều phối nghiệp vụ tạo và truy xuất đơn hàng B2C.
/// Logic tính cước và mapping được ủy quyền cho các component chuyên trách (SRP).
/// </summary>
public class OrderService : IOrderService
{
    private readonly IApplicationDbContext _context;
    private readonly IShippingFeeCalculator _shippingFeeCalculator;

    public OrderService(
        IApplicationDbContext context,
        IShippingFeeCalculator shippingFeeCalculator)
    {
        _context = context;
        _shippingFeeCalculator = shippingFeeCalculator;
    }

    public async Task<OrderResponseDto> CreateB2cOrderAsync(long userId, CreateOrderRequestDto request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null)
        {
            throw new KeyNotFoundException($"User with ID {userId} was not found.");
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            throw new ArgumentException("Order must contain at least one item.");
        }

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Include(p => p.Translations)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        decimal subtotalUsd = 0;
        var orderItems = new List<OrderItem>();
        int totalItemCount = 0;

        foreach (var itemReq in request.Items)
        {
            if (!products.TryGetValue(itemReq.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product with ID {itemReq.ProductId} was not found.");
            }

            // EXP-31: Bảo vệ chống thao túng giá từ client - Lấy giá trực tiếp từ database
            decimal unitPriceUsd = product.DefaultRetailPriceUsd;
            decimal itemTotalUsd = Math.Round(unitPriceUsd * itemReq.Quantity, 2);
            subtotalUsd += itemTotalUsd;
            totalItemCount += itemReq.Quantity;

            orderItems.Add(new OrderItem
            {
                ProductId = product.Id,
                Quantity = itemReq.Quantity,
                UnitPriceUsd = unitPriceUsd,
                TotalPriceUsd = itemTotalUsd
            });
        }

        // EXP-38: Tính cước vận chuyển quốc tế thông qua IShippingFeeCalculator
        decimal shippingFeeUsd = _shippingFeeCalculator.CalculateShippingFee(request.DestinationCountryCode, totalItemCount);

        // Thuế bán lẻ quốc tế ước tính (5%)
        decimal taxAmountUsd = Math.Round(subtotalUsd * 0.05m, 2);
        decimal totalAmountUsd = subtotalUsd + shippingFeeUsd + taxAmountUsd;

        // Tỷ giá quy đổi tiền tệ nếu không phải USD (EXP-18, EXP-20)
        string currencyCode = string.IsNullOrWhiteSpace(request.CurrencyCode) ? "USD" : request.CurrencyCode.Trim().ToUpperInvariant();
        decimal exchangeRateToUsd = 1.0m;

        if (currencyCode != "USD")
        {
            var rate = await _context.ExchangeRates
                .AsNoTracking()
                .Where(r => r.FromCurrency == "USD" && r.ToCurrency == currencyCode)
                .OrderByDescending(r => r.FetchedAt)
                .Select(r => r.Rate)
                .FirstOrDefaultAsync();

            if (rate > 0)
            {
                exchangeRateToUsd = rate;
            }
        }

        var orderCode = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var order = new Order
        {
            OrderCode = orderCode,
            UserId = userId,
            OrderType = "B2C",
            CurrencyCode = currencyCode,
            ExchangeRateToUsd = exchangeRateToUsd,
            SubtotalUsd = subtotalUsd,
            ShippingFeeUsd = shippingFeeUsd,
            TaxAmountUsd = taxAmountUsd,
            TotalAmountUsd = totalAmountUsd,
            OrderStatus = "PENDING",
            PaymentStatus = "UNPAID",
            RecipientName = request.RecipientName,
            RecipientPhone = request.RecipientPhone,
            DestinationCountryCode = request.DestinationCountryCode,
            ShippingAddressLine = request.ShippingAddressLine,
            PostalCode = request.PostalCode,
            CreatedAt = DateTime.UtcNow,
            OrderItems = orderItems
        };

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return order.ToResponseDto(products);
    }

    public async Task<OrderResponseDto> GetOrderByIdAsync(long orderId, long? requestingUserId = null)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} was not found.");
        }

        if (requestingUserId.HasValue && order.UserId != requestingUserId.Value)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền xem đơn hàng của người khác.");
        }

        var products = order.OrderItems
            .Select(oi => oi.Product)
            .Where(p => p != null)
            .ToDictionary(p => p.Id);

        return order.ToResponseDto(products);
    }

    public async Task<List<OrderResponseDto>> GetUserOrdersAsync(long userId)
    {
        var orders = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Translations)
            .Where(o => o.UserId == userId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return orders.Select(order =>
        {
            var products = order.OrderItems
                .Select(oi => oi.Product)
                .Where(p => p != null)
                .ToDictionary(p => p.Id);
            return order.ToResponseDto(products);
        }).ToList();
    }

    public async Task<OrderResponseDto> UpdateOrderStatusAsync(long orderId, string orderStatus, string? paymentStatus = null)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null)
        {
            throw new KeyNotFoundException($"Order with ID {orderId} was not found.");
        }

        order.OrderStatus = orderStatus.ToUpperInvariant();
        if (!string.IsNullOrEmpty(paymentStatus))
        {
            order.PaymentStatus = paymentStatus.ToUpperInvariant();
        }
        order.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var products = order.OrderItems
            .Select(oi => oi.Product)
            .Where(p => p != null)
            .ToDictionary(p => p.Id);

        return order.ToResponseDto(products);
    }
}
