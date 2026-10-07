using WebXNK.Application.DTOs;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Common.Mappers;

public static class OrderMappingExtensions
{
    public static OrderResponseDto ToResponseDto(this Order order, Dictionary<long, Product>? products = null)
    {
        return new OrderResponseDto
        {
            Id = order.Id,
            OrderCode = order.OrderCode,
            UserId = order.UserId,
            OrderType = order.OrderType,
            CurrencyCode = order.CurrencyCode,
            ExchangeRateToUsd = order.ExchangeRateToUsd,
            SubtotalUsd = order.SubtotalUsd,
            ShippingFeeUsd = order.ShippingFeeUsd,
            TaxAmountUsd = order.TaxAmountUsd,
            TotalAmountUsd = order.TotalAmountUsd,
            OrderStatus = order.OrderStatus,
            PaymentStatus = order.PaymentStatus,
            StripePaymentIntentId = order.StripePaymentIntentId,
            StripeClientSecret = order.StripeClientSecret,
            RecipientName = order.RecipientName,
            RecipientPhone = order.RecipientPhone,
            DestinationCountryCode = order.DestinationCountryCode,
            ShippingAddressLine = order.ShippingAddressLine,
            PostalCode = order.PostalCode,
            CreatedAt = order.CreatedAt,
            Items = order.OrderItems.Select(oi =>
            {
                var productName = oi.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                    ?? oi.Product?.Translations.FirstOrDefault()?.Name 
                    ?? (products != null && products.TryGetValue(oi.ProductId, out var prod) 
                        ? (prod.Translations.FirstOrDefault()?.Name ?? prod.BaseSku) 
                        : "Product");

                var sku = oi.Product?.BaseSku 
                    ?? (products != null && products.TryGetValue(oi.ProductId, out var p) ? p.BaseSku : "SKU");

                return new OrderItemDetailDto
                {
                    Id = oi.Id,
                    ProductId = oi.ProductId,
                    ProductName = productName,
                    ProductSku = sku,
                    Quantity = oi.Quantity,
                    UnitPriceUsd = oi.UnitPriceUsd,
                    TotalPriceUsd = oi.TotalPriceUsd
                };
            }).ToList()
        };
    }
}
