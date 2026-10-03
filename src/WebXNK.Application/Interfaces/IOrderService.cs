using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IOrderService
{
    Task<OrderResponseDto> CreateB2cOrderAsync(long userId, CreateOrderRequestDto request);
    Task<OrderResponseDto> GetOrderByIdAsync(long orderId, long? requestingUserId = null);
    Task<List<OrderResponseDto>> GetUserOrdersAsync(long userId);
    Task<OrderResponseDto> UpdateOrderStatusAsync(long orderId, string orderStatus, string? paymentStatus = null);
}
