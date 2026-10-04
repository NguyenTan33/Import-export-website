using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1.Admin;

[Authorize(Roles = "Admin_Super,Sales_Executive,Warehouse_Manager")]
[Route("api/v1/admin/analytics")]
public class AnalyticsController : BaseApiController
{
    private readonly IAnalyticsService _analyticsService;

    public AnalyticsController(IAnalyticsService analyticsService)
    {
        _analyticsService = analyticsService;
    }

    /// <summary>
    /// Báo cáo BI tổng hợp doanh thu xuất khẩu B2B vs B2C, top thị trường và phễu chuyển đổi RFQ (EXP-90, EXP-91, EXP-92, EXP-93)
    /// </summary>
    [AllowAnonymous] // Cho phép truy cập xem dashboard ERP
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<ExportAnalyticsResponseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAnalytics(CancellationToken cancellationToken)
    {
        var result = await _analyticsService.GetExportAnalyticsAsync(cancellationToken);
        return Ok(ApiResponse<ExportAnalyticsResponseDto>.Ok(result, "Lấy dữ liệu thống kê xuất khẩu thành công."));
    }
}
