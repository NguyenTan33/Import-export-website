using WebXNK.Application.DTOs;

namespace WebXNK.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> RegisterB2cAsync(RegisterB2cRequestDto request);
    Task<AuthResponseDto> RegisterB2bAsync(RegisterB2bRequestDto request);
    Task<AuthResponseDto> LoginAsync(LoginRequestDto request);
    Task<AuthResponseDto> RefreshTokenAsync(RefreshTokenRequestDto request);
    Task<UserProfileDto> GetCurrentUserProfileAsync(long userId);
    Task<UserProfileDto> UpdateCurrentUserProfileAsync(long userId, UpdateUserProfileRequestDto request);
}

public interface ICompanyManagementService
{
    Task<List<CompanyProfileDto>> GetPendingCompaniesAsync();
    Task<CompanyProfileDto> VerifyCompanyAsync(long companyId, VerifyCompanyRequestDto request, long verifiedByAdminId);
}
