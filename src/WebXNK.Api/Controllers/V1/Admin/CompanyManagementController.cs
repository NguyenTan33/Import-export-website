using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1.Admin;

[Authorize(Roles = "Admin_Super")]
[Route("api/v1/admin/companies")]
public class CompanyManagementController : BaseApiController
{
    private readonly ICompanyManagementService _companyService;

    public CompanyManagementController(ICompanyManagementService companyService)
    {
        _companyService = companyService;
    }

    /// <summary>
    /// Lấy danh sách toàn bộ các doanh nghiệp B2B đang chờ phê duyệt hồ sơ (VerificationStatus = PENDING)
    /// </summary>
    [HttpGet("pending")]
    [ProducesResponseType(typeof(ApiResponse<List<CompanyProfileDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPendingCompanies()
    {
        var result = await _companyService.GetPendingCompaniesAsync();
        return Ok(ApiResponse<List<CompanyProfileDto>>.Ok(result, "Lấy danh sách doanh nghiệp chờ duyệt thành công."));
    }

    /// <summary>
    /// Phê duyệt (VERIFIED) hoặc Từ chối (REJECTED) hồ sơ doanh nghiệp B2B (Yêu cầu quyền Admin_Super)
    /// </summary>
    [HttpPut("{id:long}/verify")]
    [HttpPost("{id:long}/verify")]
    [ProducesResponseType(typeof(ApiResponse<CompanyProfileDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> VerifyCompany(long id, [FromBody] VerifyCompanyRequestDto request)
    {
        var adminIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        var adminId = long.TryParse(adminIdClaim, out var aid) ? aid : 1;

        var result = await _companyService.VerifyCompanyAsync(id, request, adminId);
        var action = request.IsApproved ? "Phê duyệt" : "Từ chối";
        return Ok(ApiResponse<CompanyProfileDto>.Ok(result, $"{action} hồ sơ doanh nghiệp thành công."));
    }
}
