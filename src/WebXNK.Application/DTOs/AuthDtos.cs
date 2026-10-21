using System.ComponentModel.DataAnnotations;
using WebXNK.Application.Validators;

namespace WebXNK.Application.DTOs;

public class RegisterB2cRequestDto
{
    [Required, RegularExpression(ValidationPatterns.Email)]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(ValidationPatterns.StrongPassword)]
    public string Password { get; set; } = string.Empty;

    [Required, Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, RegularExpression(ValidationPatterns.VietnamPhone)]
    public string PhoneNumber { get; set; } = string.Empty;
}

public class RegisterB2bRequestDto
{
    // Thông tin tài khoản đại diện
    [Required, RegularExpression(ValidationPatterns.Email)]
    public string Email { get; set; } = string.Empty;
    [Required, RegularExpression(ValidationPatterns.StrongPassword)]
    public string Password { get; set; } = string.Empty;
    [Required, Compare(nameof(Password))]
    public string ConfirmPassword { get; set; } = string.Empty;
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;
    [Required, RegularExpression(ValidationPatterns.VietnamPhone)]
    public string PhoneNumber { get; set; } = string.Empty;

    // Thông tin pháp nhân Doanh nghiệp B2B (EXP-14)
    [Required, MaxLength(255)]
    public string CompanyName { get; set; } = string.Empty;
    [Required, MinLength(5)]
    public string TaxId { get; set; } = string.Empty; // Mã số thuế quốc tế
    [Required, RegularExpression("^[A-Za-z]{3}$")]
    public string CountryCode { get; set; } = string.Empty; // ISO 3166-1 alpha-3: USA, DEU, VNM, JPN
    public string? BusinessLicenseUrl { get; set; }
    public string? Website { get; set; }
    public string DefaultPaymentTerms { get; set; } = "T/T 30/70";
}

public class LoginRequestDto
{
    [Required, RegularExpression(ValidationPatterns.Email)]
    public string Email { get; set; } = string.Empty;
    [Required]
    public string Password { get; set; } = string.Empty;
}

public class UpdateUserProfileRequestDto
{
    [Required, MaxLength(150)]
    public string FullName { get; set; } = string.Empty;

    [Required, RegularExpression(ValidationPatterns.Email)]
    public string Email { get; set; } = string.Empty;

    [Required, RegularExpression(ValidationPatterns.VietnamPhone)]
    public string PhoneNumber { get; set; } = string.Empty;
}

public class RefreshTokenRequestDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public UserProfileDto User { get; set; } = null!;
}

public class UserProfileDto
{
    public long Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public List<string> Roles { get; set; } = new();
    public CompanyProfileDto? Company { get; set; }
}

public class CompanyProfileDto
{
    public long Id { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string CountryCode { get; set; } = string.Empty;
    public string VerificationStatus { get; set; } = "PENDING"; // PENDING, VERIFIED, REJECTED
    public string? BusinessLicenseUrl { get; set; }
    public string? Website { get; set; }
    public decimal CreditLimit { get; set; }
    public string DefaultPaymentTerms { get; set; } = "T/T 30/70";
}

public class VerifyCompanyRequestDto
{
    public bool IsApproved { get; set; } // true: VERIFIED, false: REJECTED
    public decimal? InitialCreditLimit { get; set; }
    public string? RejectionReason { get; set; }
}
