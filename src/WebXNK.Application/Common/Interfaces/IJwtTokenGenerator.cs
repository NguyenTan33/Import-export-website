using WebXNK.Domain.Entities;

namespace WebXNK.Application.Common.Interfaces;

public interface IJwtTokenGenerator
{
    (string Token, DateTime ExpiresAt) GenerateToken(User user, IEnumerable<string> roles, long? companyId = null);
    string GenerateRefreshToken();
}
