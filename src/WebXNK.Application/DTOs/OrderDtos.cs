using System.ComponentModel.DataAnnotations;

namespace WebXNK.Application.DTOs;

public class CreateOrderRequestDto
{
    [Required]
    public string RecipientName { get; set; } = string.Empty;

    [Required]
    public string RecipientPhone { get; set; } = string.Empty;

    [Required]
    public string DestinationCountryCode { get; set; } = "USA";

    [Required]
    public string ShippingAddressLine { get; set; } = string.Empty;

    [Required]
    public string PostalCode { get; set; } = string.Empty;

    public string CurrencyCode { get; set; } = "USD";

    [Required]
    [MinLength(1, ErrorMessage = "Đơn hàng phải chứa ít nhất 1 sản phẩm.")]
    public List<OrderItemRequestDto> Items { get; set; } = new();
}

public class OrderItemRequestDto
{
    [Required]
    public long ProductId { get; set; }

    [Range(1, 100000, ErrorMessage = "Số lượng mua phải lớn hơn 0.")]
    public int Quantity { get; set; }
}

public class OrderResponseDto
{
    public long Id { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string OrderType { get; set; } = "B2C";
    public string CurrencyCode { get; set; } = "USD";
    public decimal ExchangeRateToUsd { get; set; }
    public decimal SubtotalUsd { get; set; }
    public decimal ShippingFeeUsd { get; set; }
    public decimal TaxAmountUsd { get; set; }
    public decimal TotalAmountUsd { get; set; }
    public string OrderStatus { get; set; } = string.Empty;
    public string PaymentStatus { get; set; } = string.Empty;
    public string? StripePaymentIntentId { get; set; }
    public string? StripeClientSecret { get; set; }
    public string RecipientName { get; set; } = string.Empty;
    public string RecipientPhone { get; set; } = string.Empty;
    public string DestinationCountryCode { get; set; } = string.Empty;
    public string ShippingAddressLine { get; set; } = string.Empty;
    public string PostalCode { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public List<OrderItemDetailDto> Items { get; set; } = new();
}

public class OrderItemDetailDto
{
    public long Id { get; set; }
    public long ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPriceUsd { get; set; }
    public decimal TotalPriceUsd { get; set; }
}
