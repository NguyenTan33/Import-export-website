using WebXNK.Domain.Common;

namespace WebXNK.Domain.Entities;

public class User : BaseEntity<long>, IAuditableEntity
{
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsEmailVerified { get; set; }
    public bool IsActive { get; set; } = true;
    public int AccessFailedCount { get; set; }
    public DateTime? LockoutEnd { get; set; }
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiryTime { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
    public byte[]? RowVersion { get; set; }

    public Company? Company { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<CustomerAddress> Addresses { get; set; } = new List<CustomerAddress>();
}

public class CustomerAddress : BaseEntity<long>
{
    public long UserId { get; set; }
    public User User { get; set; } = null!;
    public string RecipientName { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Province { get; set; } = string.Empty;
    public string District { get; set; } = string.Empty;
    public string Ward { get; set; } = string.Empty;
    public string AddressLine { get; set; } = string.Empty;
    public string CountryCode { get; set; } = "VNM";
    public string PostalCode { get; set; } = string.Empty;
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}

public class Role : BaseEntity<int>
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public ICollection<UserRole> UserRoles { get; set; } = new List<UserRole>();
}

public class UserRole
{
    public long UserId { get; set; }
    public User User { get; set; } = null!;

    public int RoleId { get; set; }
    public Role Role { get; set; } = null!;

    public DateTime AssignedAt { get; set; } = DateTime.UtcNow;
}

public class Company : BaseEntity<long>
{
    public long UserId { get; set; }
    public User User { get; set; } = null!;

    public string CompanyName { get; set; } = string.Empty;
    public string TaxId { get; set; } = string.Empty;
    public string? BusinessLicenseUrl { get; set; }
    public string? Website { get; set; }
    public string CountryCode { get; set; } = string.Empty; // ISO-3: VNM, USA, DEU
    public string VerificationStatus { get; set; } = "PENDING"; // PENDING, VERIFIED, REJECTED
    public long? VerifiedBy { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public decimal CreditLimit { get; set; }
    public string DefaultPaymentTerms { get; set; } = "T/T 30/70";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<RfqRequest> RfqRequests { get; set; } = new List<RfqRequest>();
}
