namespace WebXNK.Application.DTOs;

public class RegisterB2cRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}

public class RegisterB2bRequestDto
{
    // Thông tin tài khoản đại diện
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }

    // Thông tin pháp nhân Doanh nghiệp B2B (EXP-14)
    public string CompanyName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty; // Mã số thuế quốc tế
    public string CountryCode { get; set; } = string.Empty; // ISO 3166-1 alpha-3: USA, DEU, VNM, JPN
    public string? BusinessLicenseUrl { get; set; }
    public string? Website { get; set; }
    public string DefaultPaymentTerms { get; set; } = "T/T 30/70";
}

public class LoginRequestDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
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
