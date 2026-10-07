using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IPaymentService
{
    // B2C Stripe Payment
    Task<StripePaymentIntentResponseDto> CreateStripePaymentIntentAsync(long userId, CreateStripePaymentIntentRequestDto request);
    Task<bool> HandleStripeWebhookEventAsync(string jsonPayload, string stripeSignatureHeader);

    // B2B Wire Transfer / Swift MT103
    Task<B2BPaymentResponseDto> SubmitB2BPaymentSlipAsync(long userId, SubmitB2BPaymentSlipRequestDto request);
    Task<B2BPaymentResponseDto> VerifyB2BPaymentAsync(long verifierUserId, VerifyB2BPaymentRequestDto request);
    Task<List<B2BPaymentResponseDto>> GetB2BPaymentsByRfqAsync(long rfqId);
}
