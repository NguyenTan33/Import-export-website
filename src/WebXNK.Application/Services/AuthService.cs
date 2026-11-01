using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

public class AuthService : IAuthService
{
    private readonly IApplicationDbContext _context;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenGenerator _jwtTokenGenerator;

    public AuthService(
        IApplicationDbContext context,
        IPasswordHasher passwordHasher,
        IJwtTokenGenerator jwtTokenGenerator)
    {
        _context = context;
        _passwordHasher = passwordHasher;
        _jwtTokenGenerator = jwtTokenGenerator;
    }

    public async Task<AuthResponseDto> RegisterB2cAsync(RegisterB2cRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            throw new InvalidOperationException($"Email '{request.Email}' đã được đăng ký trên hệ thống.");
        }

        var b2cRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "B2C_Customer")
            ?? throw new InvalidOperationException("Role B2C_Customer chưa được khởi tạo trong CSDL.");

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            IsEmailVerified = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.UserRoles.Add(new UserRole { User = user, Role = b2cRole, AssignedAt = DateTime.UtcNow });

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var (accessToken, expiresAt) = _jwtTokenGenerator.GenerateToken(user, new[] { b2cRole.Name });
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Roles = new List<string> { b2cRole.Name }
            }
        };
    }

    public async Task<AuthResponseDto> RegisterB2bAsync(RegisterB2bRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var normalizedTaxId = request.TaxId.Trim().ToUpperInvariant();

        if (await _context.Users.AnyAsync(u => u.Email == normalizedEmail))
        {
            throw new InvalidOperationException($"Email '{request.Email}' đã được đăng ký.");
        }

        if (await _context.Companies.AnyAsync(c => c.TaxId == normalizedTaxId))
        {
            throw new InvalidOperationException($"Mã số thuế / Tax ID '{request.TaxId}' đã tồn tại trong hệ thống.");
        }

        var b2bRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "B2B_Buyer")
            ?? throw new InvalidOperationException("Role B2B_Buyer chưa được khởi tạo.");

        var user = new User
        {
            Email = normalizedEmail,
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            FullName = request.FullName.Trim(),
            PhoneNumber = request.PhoneNumber?.Trim(),
            IsEmailVerified = false,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        user.UserRoles.Add(new UserRole { User = user, Role = b2bRole, AssignedAt = DateTime.UtcNow });

        var company = new Company
        {
            User = user,
            CompanyName = request.CompanyName.Trim(),
            TaxId = normalizedTaxId,
            CountryCode = request.CountryCode.Trim().ToUpperInvariant(),
            BusinessLicenseUrl = request.BusinessLicenseUrl?.Trim(),
            Website = request.Website?.Trim(),
            VerificationStatus = "PENDING",
            CreditLimit = 0,
            DefaultPaymentTerms = request.DefaultPaymentTerms,
            CreatedAt = DateTime.UtcNow
        };

        user.Company = company;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var (accessToken, expiresAt) = _jwtTokenGenerator.GenerateToken(user, new[] { b2bRole.Name }, company.Id);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Roles = new List<string> { b2bRole.Name },
                Company = new CompanyProfileDto
                {
                    Id = company.Id,
                    CompanyName = company.CompanyName,
                    TaxId = company.TaxId,
                    CountryCode = company.CountryCode,
                    VerificationStatus = company.VerificationStatus,
                    Website = company.Website,
                    BusinessLicenseUrl = company.BusinessLicenseUrl,
                    CreditLimit = company.CreditLimit,
                    DefaultPaymentTerms = company.DefaultPaymentTerms
                }
            }
        };
    }

    public async Task<AuthResponseDto> LoginAsync(LoginRequestDto request)
    {
        var normalizedEmail = request.Email.Trim().ToLowerInvariant();

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Email == normalizedEmail);

        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
        }

        if (user.LockoutEnd.HasValue && user.LockoutEnd.Value > DateTime.UtcNow)
        {
            var remainingMinutes = Math.Ceiling((user.LockoutEnd.Value - DateTime.UtcNow).TotalMinutes);
            throw new UnauthorizedAccessException($"Tài khoản bị tạm khóa do nhập sai mật khẩu quá 5 lần. Vui lòng thử lại sau {remainingMinutes} phút.");
        }

        if (!_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            user.AccessFailedCount++;
            if (user.AccessFailedCount >= 5)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
            }
            await _context.SaveChangesAsync();

            throw new UnauthorizedAccessException("Email hoặc mật khẩu không chính xác.");
        }

        // Đăng nhập thành công -> reset lockout
        user.AccessFailedCount = 0;
        user.LockoutEnd = null;

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var companyId = user.Company?.Id;

        var (accessToken, expiresAt) = _jwtTokenGenerator.GenerateToken(user, roles, companyId);
        var refreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Roles = roles,
                Company = user.Company == null ? null : new CompanyProfileDto
                {
                    Id = user.Company.Id,
                    CompanyName = user.Company.CompanyName,
                    TaxId = user.Company.TaxId,
                    CountryCode = user.Company.CountryCode,
                    VerificationStatus = user.Company.VerificationStatus,
                    Website = user.Company.Website,
                    BusinessLicenseUrl = user.Company.BusinessLicenseUrl,
                    CreditLimit = user.Company.CreditLimit,
                    DefaultPaymentTerms = user.Company.DefaultPaymentTerms
                }
            }
        };
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request)
    {
        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.RefreshToken == request.RefreshToken);

        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Refresh token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.");
        }

        var roles = user.UserRoles.Select(ur => ur.Role.Name).ToList();
        var (newAccessToken, expiresAt) = _jwtTokenGenerator.GenerateToken(user, roles, user.Company?.Id);
        var newRefreshToken = _jwtTokenGenerator.GenerateRefreshToken();

        user.RefreshToken = newRefreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await _context.SaveChangesAsync();

        return new AuthResponseDto
        {
            AccessToken = newAccessToken,
            RefreshToken = newRefreshToken,
            ExpiresAt = expiresAt,
            User = new UserProfileDto
            {
                Id = user.Id,
                Email = user.Email,
                FullName = user.FullName,
                PhoneNumber = user.PhoneNumber,
                Roles = roles
            }
        };
    }

    public async Task<UserProfileDto> GetCurrentUserProfileAsync(long userId)
    {
        var user = await _context.Users
            .AsNoTracking()
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"Không tìm thấy người dùng có ID = {userId}");

        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            FullName = user.FullName,
            PhoneNumber = user.PhoneNumber,
            Roles = user.UserRoles.Select(ur => ur.Role.Name).ToList(),
            Company = user.Company == null ? null : new CompanyProfileDto
            {
                Id = user.Company.Id,
                CompanyName = user.Company.CompanyName,
                TaxId = user.Company.TaxId,
                CountryCode = user.Company.CountryCode,
                VerificationStatus = user.Company.VerificationStatus,
                Website = user.Company.Website,
                BusinessLicenseUrl = user.Company.BusinessLicenseUrl,
                CreditLimit = user.Company.CreditLimit,
                DefaultPaymentTerms = user.Company.DefaultPaymentTerms
            }
        };
    }

    public async Task<UserProfileDto> UpdateCurrentUserProfileAsync(
        long userId,
        UpdateUserProfileRequestDto request)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId)
            ?? throw new KeyNotFoundException($"Không tìm thấy người dùng có ID = {userId}");

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _context.Users.AnyAsync(u => u.Id != userId && u.Email == normalizedEmail))
        {
            throw new InvalidOperationException("Email này đã được sử dụng bởi tài khoản khác.");
        }

        user.FullName = request.FullName.Trim();
        user.Email = normalizedEmail;
        user.PhoneNumber = request.PhoneNumber.Trim();
        await _context.SaveChangesAsync();

        return await GetCurrentUserProfileAsync(userId);
    }
}
