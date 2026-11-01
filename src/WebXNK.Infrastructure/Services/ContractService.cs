using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using QuestPDF.Fluent;
using QuestPDF.Infrastructure;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;
using WebXNK.Infrastructure.Services.Documents.Templates;

namespace WebXNK.Infrastructure.Services;

public class ContractService : IContractService
{
    private readonly IApplicationDbContext _context;
    private readonly ILogger<ContractService> _logger;

    public ContractService(
        IApplicationDbContext context,
        ILogger<ContractService> logger)
    {
        _context = context;
        _logger = logger;
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public async Task<SalesContractDto> GenerateContractFromRfqAsync(long rfqId, CancellationToken cancellationToken = default)
    {
        var existing = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.RfqRequestId == rfqId, cancellationToken);

        if (existing != null)
        {
            return MapToDto(existing);
        }

        var rfq = await _context.RfqRequests
            .Include(r => r.Company)
                .ThenInclude(co => co.User)
            .Include(r => r.Incoterm)
            .Include(r => r.RfqItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(r => r.Id == rfqId, cancellationToken);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy yêu cầu báo giá RFQ ID #{rfqId}.");
        }

        var cleanRef = rfq.RfqNumber.Contains("-") ? rfq.RfqNumber.Split('-').Last() : rfq.Id.ToString();
        var contractNumber = $"SC-{DateTime.UtcNow:yyyy}-QTH-{cleanRef}";

        var totalAmount = rfq.TotalQuotedAmountUsd > 0
            ? rfq.TotalQuotedAmountUsd
            : rfq.RfqItems.Sum(i => i.Quantity * (i.QuotedUnitPriceUsd ?? i.TargetPriceUsd ?? 0));

        var buyerAddress = !string.IsNullOrEmpty(rfq.PortOfDischarge) 
            ? $"Consignee Trade Terminal, Near {rfq.PortOfDischarge}, {rfq.Company?.CountryCode ?? "USA"}"
            : $"International Business Center, {rfq.Company?.CountryCode ?? "USA"}";

        var contract = new SalesContract
        {
            ContractNumber = contractNumber,
            RfqRequestId = rfq.Id,
            SellerCompanyName = "CÔNG TY TNHH XUẤT NHẬP KHẨU QUANG TẤN HOÀNG",
            SellerTaxCode = "0318992145",
            SellerAddress = "Số 88, Đường Số 7, KCN Sóng Thần 1, Dĩ An, Bình Dương, Việt Nam",
            SellerRepresentative = "Nguyễn Văn A",
            SellerTitle = "Giám Đốc Điều Hành (Managing Director)",

            BuyerCompanyName = rfq.Company?.CompanyName ?? "GLOBAL TRADING CORP",
            BuyerTaxCode = rfq.Company?.TaxId ?? "US-TAX-89218",
            BuyerAddress = buyerAddress,
            BuyerRepresentative = rfq.Company?.User?.FullName ?? "Kenji Sato",
            BuyerTitle = "Procurement Director",

            IncotermCode = rfq.IncotermCode,
            PortOfLoading = !string.IsNullOrEmpty(rfq.PortOfLoading) ? rfq.PortOfLoading : "Tân Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
            PortOfDischarge = !string.IsNullOrEmpty(rfq.PortOfDischarge) ? rfq.PortOfDischarge : "Tokyo Port, Japan",
            PaymentTerms = "30% T/T Deposit upon Contract Signing, 70% T/T against Presentation of Ocean B/L Copy",
            TargetDeliveryDate = rfq.TargetDeliveryDate,
            Currency = "USD",
            TotalAmountUsd = totalAmount,
            Status = "DRAFT",
            CreatedAt = DateTime.UtcNow
        };

        _context.SalesContracts.Add(contract);
        rfq.Status = "CONTRACT_DRAFTED";
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Khởi tạo thành công Hợp đồng Ngoại thương #{ContractNo} cho RFQ #{RfqNo}", contract.ContractNumber, rfq.RfqNumber);

        contract.RfqRequest = rfq;
        return MapToDto(contract);
    }

    public async Task<SalesContractDto?> GetContractByRfqIdAsync(long rfqId, CancellationToken cancellationToken = default)
    {
        var contract = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.RfqRequestId == rfqId, cancellationToken);

        return contract != null ? MapToDto(contract) : null;
    }

    public async Task<SalesContractDto?> GetContractByIdAsync(long contractId, CancellationToken cancellationToken = default)
    {
        var contract = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.Id == contractId, cancellationToken);

        return contract != null ? MapToDto(contract) : null;
    }

    public async Task<SalesContractDto> SignContractSellerAsync(long contractId, SignContractRequestDto dto, CancellationToken cancellationToken = default)
    {
        var contract = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.Id == contractId, cancellationToken);

        if (contract == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID #{contractId}.");
        }

        contract.SellerSignatureData = dto.SignatureData;
        contract.SellerSignedBy = !string.IsNullOrEmpty(dto.SignerName) ? dto.SignerName : contract.SellerRepresentative;
        if (!string.IsNullOrEmpty(dto.SignerTitle)) contract.SellerTitle = dto.SignerTitle;
        contract.SellerSignedAt = DateTime.UtcNow;

        if (dto.IncludeCompanyStamp)
        {
            contract.SellerStampData = "STAMP_VERIFIED_QUANG_TAN_HOANG";
        }

        if (contract.BuyerSignedAt.HasValue)
        {
            contract.Status = "LEGALLY_BINDING";
            contract.DigitalSignatureHash = ComputeSha256Hash(
                $"{contract.ContractNumber}|{contract.TotalAmountUsd}|{contract.SellerSignedAt}|{contract.BuyerSignedAt}|QTH_EXPORT_SALT_2026");

            if (contract.RfqRequest != null)
            {
                contract.RfqRequest.Status = "CONTRACT_SIGNED";
            }
        }
        else
        {
            contract.Status = "SELLER_SIGNED";
        }

        contract.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Người bán (Seller) đã ký số thành công Hợp đồng #{ContractNo}", contract.ContractNumber);
        return MapToDto(contract);
    }

    public async Task<SalesContractDto> SignContractBuyerAsync(long contractId, SignContractRequestDto dto, CancellationToken cancellationToken = default)
    {
        var contract = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.Id == contractId, cancellationToken);

        if (contract == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID #{contractId}.");
        }

        contract.BuyerSignatureData = dto.SignatureData;
        contract.BuyerSignedBy = !string.IsNullOrEmpty(dto.SignerName) ? dto.SignerName : contract.BuyerRepresentative;
        if (!string.IsNullOrEmpty(dto.SignerTitle)) contract.BuyerTitle = dto.SignerTitle;
        contract.BuyerSignedAt = DateTime.UtcNow;

        if (contract.SellerSignedAt.HasValue)
        {
            contract.Status = "LEGALLY_BINDING";
            contract.DigitalSignatureHash = ComputeSha256Hash(
                $"{contract.ContractNumber}|{contract.TotalAmountUsd}|{contract.SellerSignedAt}|{contract.BuyerSignedAt}|QTH_EXPORT_SALT_2026");

            if (contract.RfqRequest != null)
            {
                contract.RfqRequest.Status = "CONTRACT_SIGNED";
            }
        }
        else
        {
            contract.Status = "BUYER_SIGNED";
        }

        contract.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Người mua (Buyer) đã ký số thành công Hợp đồng #{ContractNo}", contract.ContractNumber);
        return MapToDto(contract);
    }

    public async Task<RfqCounterOfferDto> SubmitCounterOfferAsync(
        long rfqId, 
        long currentUserId, 
        string userRole, 
        SubmitCounterOfferRequestDto dto, 
        CancellationToken cancellationToken = default)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.RfqItems)
            .Include(r => r.CounterOffers)
            .FirstOrDefaultAsync(r => r.Id == rfqId, cancellationToken);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy đơn chào giá RFQ ID #{rfqId}.");
        }

        var maxRev = rfq.CounterOffers.Any() ? rfq.CounterOffers.Max(c => c.RevisionNumber) : 1;
        var nextRev = maxRev + 1;

        decimal? proposedTotal = null;
        if (dto.ProposedUnitPriceUsd.HasValue && rfq.RfqItems.Any())
        {
            var totalQty = rfq.RfqItems.Sum(i => i.Quantity);
            proposedTotal = totalQty * dto.ProposedUnitPriceUsd.Value;
        }

        var offer = new RfqCounterOffer
        {
            RfqRequestId = rfqId,
            RevisionNumber = nextRev,
            SenderRole = userRole.ToUpperInvariant(),
            SenderUserId = currentUserId,
            SenderName = userRole.Equals("BUYER", StringComparison.OrdinalIgnoreCase) ? "Buyer Representative" : "Quang Tan Hoang Sales Director",
            ProposedUnitPriceUsd = dto.ProposedUnitPriceUsd,
            ProposedTotalAmountUsd = proposedTotal,
            ProposedIncotermCode = dto.ProposedIncotermCode,
            ProposedPaymentTerms = dto.ProposedPaymentTerms,
            Note = dto.Note,
            ExpiresAt = DateTime.UtcNow.AddDays(dto.ValidityDays > 0 ? dto.ValidityDays : 3),
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow
        };

        _context.RfqCounterOffers.Add(offer);
        rfq.Status = "NEGOTIATING";
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã gửi đề xuất trả giá mới (Revision #{Rev}) cho RFQ #{RfqNo}", nextRev, rfq.RfqNumber);

        return new RfqCounterOfferDto
        {
            Id = offer.Id,
            RfqRequestId = offer.RfqRequestId,
            RevisionNumber = offer.RevisionNumber,
            SenderRole = offer.SenderRole,
            SenderUserId = offer.SenderUserId,
            SenderName = offer.SenderName,
            ProposedUnitPriceUsd = offer.ProposedUnitPriceUsd,
            ProposedTotalAmountUsd = offer.ProposedTotalAmountUsd,
            ProposedIncotermCode = offer.ProposedIncotermCode,
            ProposedPaymentTerms = offer.ProposedPaymentTerms,
            Note = offer.Note,
            ExpiresAt = offer.ExpiresAt,
            Status = offer.Status,
            CreatedAt = offer.CreatedAt
        };
    }

    public async Task<List<RfqCounterOfferDto>> GetCounterOffersByRfqIdAsync(long rfqId, CancellationToken cancellationToken = default)
    {
        var list = await _context.RfqCounterOffers
            .Where(c => c.RfqRequestId == rfqId)
            .OrderByDescending(c => c.RevisionNumber)
            .ToListAsync(cancellationToken);

        return list.Select(offer => new RfqCounterOfferDto
        {
            Id = offer.Id,
            RfqRequestId = offer.RfqRequestId,
            RevisionNumber = offer.RevisionNumber,
            SenderRole = offer.SenderRole,
            SenderUserId = offer.SenderUserId,
            SenderName = offer.SenderName,
            ProposedUnitPriceUsd = offer.ProposedUnitPriceUsd,
            ProposedTotalAmountUsd = offer.ProposedTotalAmountUsd,
            ProposedIncotermCode = offer.ProposedIncotermCode,
            ProposedPaymentTerms = offer.ProposedPaymentTerms,
            Note = offer.Note,
            ExpiresAt = offer.ExpiresAt,
            Status = offer.Status,
            CreatedAt = offer.CreatedAt
        }).ToList();
    }

    public async Task<bool> AcceptCounterOfferAsync(long rfqId, long counterOfferId, CancellationToken cancellationToken = default)
    {
        var offer = await _context.RfqCounterOffers.FirstOrDefaultAsync(c => c.Id == counterOfferId && c.RfqRequestId == rfqId, cancellationToken);
        if (offer == null) return false;

        var rfq = await _context.RfqRequests
            .Include(r => r.RfqItems)
            .Include(r => r.CounterOffers)
            .FirstOrDefaultAsync(r => r.Id == rfqId, cancellationToken);

        if (rfq == null) return false;

        // Mark target offer accepted, others superseded
        offer.Status = "ACCEPTED";
        foreach (var other in rfq.CounterOffers.Where(c => c.Id != counterOfferId && c.Status == "PENDING"))
        {
            other.Status = "SUPERSEDED";
        }

        // Apply new terms to RFQ
        if (offer.ProposedUnitPriceUsd.HasValue)
        {
            foreach (var item in rfq.RfqItems)
            {
                item.QuotedUnitPriceUsd = offer.ProposedUnitPriceUsd.Value;
            }
            rfq.TotalQuotedAmountUsd = rfq.RfqItems.Sum(i => i.Quantity * (i.QuotedUnitPriceUsd ?? 0));
        }

        if (!string.IsNullOrEmpty(offer.ProposedIncotermCode))
        {
            rfq.IncotermCode = offer.ProposedIncotermCode;
        }

        rfq.Status = "AGREED_PENDING_CONTRACT";
        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("Đã chấp thuận đề xuất trả giá Revision #{Rev} cho RFQ #{RfqNo}", offer.RevisionNumber, rfq.RfqNumber);
        return true;
    }

    public async Task<(byte[] PdfBytes, string FileName)> GenerateContractPdfAsync(long contractId, CancellationToken cancellationToken = default)
    {
        var contract = await _context.SalesContracts
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.RfqItems)
                    .ThenInclude(i => i.Product)
                        .ThenInclude(p => p.Translations)
            .Include(c => c.RfqRequest)
                .ThenInclude(r => r.Company)
                    .ThenInclude(co => co.User)
            .FirstOrDefaultAsync(c => c.Id == contractId, cancellationToken);

        if (contract == null || contract.RfqRequest == null)
        {
            throw new KeyNotFoundException($"Không tìm thấy hợp đồng ID #{contractId}.");
        }

        var model = new SalesContractModel
        {
            Contract = contract,
            Rfq = contract.RfqRequest,
            BuyerCompany = contract.RfqRequest.Company,
            Items = contract.RfqRequest.RfqItems.ToList()
        };

        var doc = new SalesContractDocument(model);
        var pdfBytes = doc.GeneratePdf();

        return (pdfBytes, $"{contract.ContractNumber}.pdf");
    }

    private static SalesContractDto MapToDto(SalesContract contract)
    {
        var items = new List<ContractItemDto>();
        if (contract.RfqRequest?.RfqItems != null)
        {
            items = contract.RfqRequest.RfqItems.Select(i => new ContractItemDto
            {
                ProductId = i.ProductId,
                ProductName = i.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                           ?? i.Product?.Translations.FirstOrDefault()?.Name 
                           ?? i.Product?.BaseSku 
                           ?? $"Item #{i.ProductId}",
                Sku = i.Product?.BaseSku ?? "QTH-EXP",
                Quantity = i.Quantity,
                UnitPriceUsd = i.QuotedUnitPriceUsd ?? i.TargetPriceUsd ?? 0,
                TotalAmountUsd = i.Quantity * (i.QuotedUnitPriceUsd ?? i.TargetPriceUsd ?? 0),
                CalculatedCbm = i.CalculatedCbm,
                PackagingSpec = i.CustomRequirements ?? "Standard 5-ply export carton"
            }).ToList();
        }

        return new SalesContractDto
        {
            Id = contract.Id,
            ContractNumber = contract.ContractNumber,
            RfqRequestId = contract.RfqRequestId,
            RfqNumber = contract.RfqRequest?.RfqNumber ?? string.Empty,
            SellerCompanyName = contract.SellerCompanyName,
            SellerTaxCode = contract.SellerTaxCode,
            SellerAddress = contract.SellerAddress,
            SellerRepresentative = contract.SellerRepresentative,
            SellerTitle = contract.SellerTitle,

            BuyerCompanyName = contract.BuyerCompanyName,
            BuyerTaxCode = contract.BuyerTaxCode,
            BuyerAddress = contract.BuyerAddress,
            BuyerRepresentative = contract.BuyerRepresentative,
            BuyerTitle = contract.BuyerTitle,

            IncotermCode = contract.IncotermCode,
            PortOfLoading = contract.PortOfLoading,
            PortOfDischarge = contract.PortOfDischarge,
            PaymentTerms = contract.PaymentTerms,
            TargetDeliveryDate = contract.TargetDeliveryDate?.ToString("yyyy-MM-dd"),
            Currency = contract.Currency,
            TotalAmountUsd = contract.TotalAmountUsd,

            Status = contract.Status,
            SellerSignatureData = contract.SellerSignatureData,
            SellerSignedAt = contract.SellerSignedAt,
            SellerSignedBy = contract.SellerSignedBy,
            SellerStampData = contract.SellerStampData,

            BuyerSignatureData = contract.BuyerSignatureData,
            BuyerSignedAt = contract.BuyerSignedAt,
            BuyerSignedBy = contract.BuyerSignedBy,

            DigitalSignatureHash = contract.DigitalSignatureHash,
            ContractPdfUrl = contract.ContractPdfUrl,
            CreatedAt = contract.CreatedAt,
            Items = items
        };
    }

    private static string ComputeSha256Hash(string rawData)
    {
        using var sha256 = SHA256.Create();
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(rawData));
        var builder = new StringBuilder();
        foreach (var b in bytes)
        {
            builder.Append(b.ToString("x2"));
        }
        return builder.ToString();
    }
}
