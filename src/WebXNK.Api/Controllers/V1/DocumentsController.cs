using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.Common.Models;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Api.Controllers.V1;

[Authorize]
public class DocumentsController : BaseApiController
{
    private readonly IExportDocumentService _documentService;
    private readonly IStorageService _storageService;

    public DocumentsController(
        IExportDocumentService documentService, 
        IStorageService storageService)
    {
        _documentService = documentService;
        _storageService = storageService;
    }

    /// <summary>
    /// Tự động sinh Hóa đơn chiếu lệ (Proforma Invoice) chuẩn ICC bằng QuestPDF và lưu AWS S3 (EXP-56, EXP-59)
    /// </summary>
    /// <param name="rfqId">ID đơn chào giá xuất khẩu (RFQ)</param>
    [Authorize(Roles = "Admin_Super,Sales_Executive")]
    [HttpPost("proforma-invoice/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<DocumentGenerationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateProformaInvoice(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.GenerateProformaInvoiceAsync(rfqId, userId, cancellationToken);
        return Ok(ApiResponse<DocumentGenerationResultDto>.Ok(result, "Phát hành Proforma Invoice thành công."));
    }

    /// <summary>
    /// Tự động sinh Hóa đơn thương mại chính thức (Commercial Invoice) chuẩn ICC xuất khẩu (EXP-69)
    /// </summary>
    /// <param name="rfqId">ID đơn chào giá xuất khẩu (RFQ)</param>
    [Authorize(Roles = "Admin_Super,Sales_Executive")]
    [HttpPost("commercial-invoice/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<DocumentGenerationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GenerateCommercialInvoice(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.GenerateCommercialInvoiceAsync(rfqId, userId, cancellationToken);
        return Ok(ApiResponse<DocumentGenerationResultDto>.Ok(result, "Phát hành Commercial Invoice thành công."));
    }

    /// <summary>
    /// Tự động sinh Phiếu đóng gói hàng xuất khẩu (Packing List) chuẩn ICC kèm CBM & Net/Gross Weight (EXP-69)
    /// </summary>
    /// <param name="rfqId">ID đơn chào giá xuất khẩu (RFQ)</param>
    [Authorize(Roles = "Admin_Super,Sales_Executive,Warehouse_Manager")]
    [HttpPost("packing-list/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<DocumentGenerationResultDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GeneratePackingList(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var result = await _documentService.GeneratePackingListAsync(rfqId, userId, cancellationToken);
        return Ok(ApiResponse<DocumentGenerationResultDto>.Ok(result, "Phát hành Packing List thành công."));
    }

    /// <summary>
    /// Tải trực tiếp file PDF Hóa đơn chiếu lệ (Proforma Invoice) theo RFQ ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("proforma-invoice/{rfqId:long}")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadProformaInvoiceByRfq(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var gen = await _documentService.GenerateProformaInvoiceAsync(rfqId, userId, cancellationToken);
        var (stream, contentType, fileName) = await _documentService.GetDocumentFileAsync(gen.DocumentId, cancellationToken);
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// Tải trực tiếp file PDF Hóa đơn thương mại (Commercial Invoice) theo RFQ/Order ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("commercial-invoice/{rfqId:long}")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadCommercialInvoiceByRfq(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var gen = await _documentService.GenerateCommercialInvoiceAsync(rfqId, userId, cancellationToken);
        var (stream, contentType, fileName) = await _documentService.GetDocumentFileAsync(gen.DocumentId, cancellationToken);
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// Tải trực tiếp file PDF Phiếu đóng gói (Packing List) theo RFQ/Order ID
    /// </summary>
    [AllowAnonymous]
    [HttpGet("packing-list/{rfqId:long}")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    public async Task<IActionResult> DownloadPackingListByRfq(long rfqId, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var gen = await _documentService.GeneratePackingListAsync(rfqId, userId, cancellationToken);
        var (stream, contentType, fileName) = await _documentService.GetDocumentFileAsync(gen.DocumentId, cancellationToken);
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// Lấy danh sách toàn bộ hồ sơ chứng từ xuất nhập khẩu gắn liền với RFQ
    /// </summary>
    /// <param name="rfqId">ID đơn chào giá xuất khẩu (RFQ)</param>
    [AllowAnonymous]
    [HttpGet("rfq/{rfqId:long}")]
    [ProducesResponseType(typeof(ApiResponse<List<ExportDocumentDto>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDocumentsByRfq(long rfqId, CancellationToken cancellationToken)
    {
        var result = await _documentService.GetDocumentsByRfqAsync(rfqId, cancellationToken);
        return Ok(ApiResponse<List<ExportDocumentDto>>.Ok(result, "Lấy danh sách chứng từ thành công."));
    }

    /// <summary>
    /// Tải trực tiếp file PDF chứng từ xuất nhập khẩu
    /// </summary>
    /// <param name="documentId">ID bản ghi chứng từ</param>
    [AllowAnonymous]
    [HttpGet("{documentId:long}/download")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DownloadDocument(long documentId, CancellationToken cancellationToken)
    {
        var (stream, contentType, fileName) = await _documentService.GetDocumentFileAsync(documentId, cancellationToken);
        return File(stream, contentType, fileName);
    }

    /// <summary>
    /// Endpoint tải file cục bộ khi chạy chế độ Local Fallback Storage
    /// </summary>
    [AllowAnonymous]
    [HttpGet("files/{folder}/{fileName}")]
    [ProducesResponseType(typeof(FileStreamResult), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetLocalFile(string folder, string fileName, CancellationToken cancellationToken)
    {
        var fileKey = $"{folder}/{fileName}";
        var (stream, contentType, downloadName) = await _storageService.GetFileStreamAsync(fileKey, cancellationToken);
        return File(stream, contentType, downloadName);
    }

    private long GetCurrentUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return long.TryParse(userIdClaim, out var uid) ? uid : 1;
    }
}
