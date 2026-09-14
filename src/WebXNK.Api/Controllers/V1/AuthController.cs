using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

public class AuthController : BaseApiController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Đăng ký tài khoản khách mua lẻ B2C
    /// </summary>
    [HttpPost("register-b2c")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterB2c([FromBody] RegisterB2cRequestDto request)
    {
        var result = await _authService.RegisterB2cAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng ký tài khoản B2C thành công."));
    }

    /// <summary>
    /// Đăng ký tài khoản Doanh nghiệp / Nhà nhập khẩu quốc tế B2B (kèm hồ sơ công ty)
    /// </summary>
    [HttpPost("register-b2b")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> RegisterB2b([FromBody] RegisterB2bRequestDto request)
    {
        var result = await _authService.RegisterB2bAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng ký tài khoản B2B thành công. Hồ sơ doanh nghiệp đang chờ Admin xét duyệt."));
    }

    /// <summary>
    /// Đăng nhập hệ thống (B2C, B2B, Sales, Admin) cấp Access Token JWT và Refresh Token
    /// </summary>
    [HttpPost("login")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request)
    {
        var result = await _authService.LoginAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Đăng nhập thành công."));
    }

    /// <summary>
    /// Cấp mới Access Token khi hết hạn bằng Refresh Token (Token Rotation)
    /// </summary>
    [HttpPost("refresh-token")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponseDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto request)
    {
        var result = await _authService.RefreshTokenAsync(request);
        return Ok(ApiResponse<AuthResponseDto>.Ok(result, "Làm mới phiên đăng nhập thành công."));
    }

    /// <summary>
    /// Lấy thông tin hồ sơ của người dùng hiện tại từ Token JWT
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    [ProducesResponseType(typeof(ApiResponse<UserProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentUserProfile()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                       ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !long.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(ApiResponse<object>.Fail(StatusCodes.Status401Unauthorized, "Token không hợp lệ hoặc thiếu thông tin định danh."));
        }

        var profile = await _authService.GetCurrentUserProfileAsync(userId);
        return Ok(ApiResponse<UserProfileDto>.Ok(profile));
    }
}
