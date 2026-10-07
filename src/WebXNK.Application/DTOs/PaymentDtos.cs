using System.ComponentModel.DataAnnotations;

namespace WebXNK.Application.DTOs;

public class CreateStripePaymentIntentRequestDto
{
    [Required]
    public long OrderId { get; set; }
}

public class StripePaymentIntentResponseDto
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = string.Empty;
    public string PaymentIntentId { get; set; } = string.Empty;
    public string ClientSecret { get; set; } = string.Empty;
    public decimal AmountUsd { get; set; }
    public long AmountCents { get; set; }
    public string Currency { get; set; } = "usd";
    public string Status { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
}

public class SubmitB2BPaymentSlipRequestDto
{
    [Required]
    public long RfqId { get; set; }

    [Required]
    [StringLength(20)]
    public string PaymentStage { get; set; } = "DEPOSIT_30"; // 'DEPOSIT_30', 'BALANCE_70'

    [Required]
    [StringLength(20)]
    public string PaymentMethod { get; set; } = "T_T"; // 'T_T', 'L_C'

    [Range(0.01, 100000000, ErrorMessage = "Số tiền thanh toán phải lớn hơn 0.")]
    public decimal AmountUsd { get; set; }

    [Required]
    [StringLength(100)]
    public string SwiftReference { get; set; } = string.Empty; // Mã MT103 / Swift Ref

    [Required]
    [StringLength(500)]
    public string BankSlipFileUrl { get; set; } = string.Empty; // File chứng từ UNC PDF hoặc hình ảnh
}

public class VerifyB2BPaymentRequestDto
{
    [Required]
    public long PaymentId { get; set; }

    public bool IsApproved { get; set; } = true;

    public string? RejectionReason { get; set; }
}

public class B2BPaymentResponseDto
{
    public long Id { get; set; }
    public long RfqId { get; set; }
    public string RfqNumber { get; set; } = string.Empty;
    public string PaymentStage { get; set; } = string.Empty;
    public string PaymentMethod { get; set; } = string.Empty;
    public decimal AmountUsd { get; set; }
    public string SwiftReference { get; set; } = string.Empty;
    public string BankSlipFileUrl { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = string.Empty;
    public long? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
