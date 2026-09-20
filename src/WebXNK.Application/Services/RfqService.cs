using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.Common.Mappers;
using WebXNK.Application.Common.Policies;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Services;

/// <summary>
/// Thin Service điều phối toàn bộ use-case thương lượng báo giá B2B (RFQ Negotiation).
/// Các quy tắc chuyển đổi trạng thái và đóng gói container được ủy quyền cho IRfqStatePolicy (SRP).
/// </summary>
public class RfqService : IRfqService
{
    private readonly IApplicationDbContext _context;
    private readonly IIncotermsCalculationService _incotermsService;
    private readonly IRfqStatePolicy _statePolicy;

    public RfqService(
        IApplicationDbContext context, 
        IIncotermsCalculationService incotermsService,
        IRfqStatePolicy statePolicy)
    {
        _context = context;
        _incotermsService = incotermsService;
        _statePolicy = statePolicy;
    }

    public async Task<RfqDetailDto> CreateRfqAsync(long userId, CreateRfqRequestDto request)
    {
        var company = await _context.Companies.FindAsync(request.CompanyId);
        if (company == null)
        {
            throw new KeyNotFoundException($"Company with ID {request.CompanyId} was not found.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var isStaff = user?.UserRoles.Any(ur => ur.Role.Name is "Admin_Super" or "Sales_Executive") ?? false;
        if (!isStaff && company.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn chỉ được phép tạo yêu cầu báo giá cho chính doanh nghiệp của mình.");
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            throw new ArgumentException("Yêu cầu báo giá phải có ít nhất 1 mặt hàng.");
        }

        var productIds = request.Items.Select(i => i.ProductId).Distinct().ToList();
        var products = await _context.Products
            .Include(p => p.ExportPackaging)
            .Include(p => p.PriceTiers)
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        decimal totalCbm = 0;
        decimal totalGrossWeightKg = 0;
        var rfqItems = new List<RfqItem>();

        foreach (var itemReq in request.Items)
        {
            if (!products.TryGetValue(itemReq.ProductId, out var product))
            {
                throw new KeyNotFoundException($"Product with ID {itemReq.ProductId} was not found.");
            }

            // EXP-49: Không cho phép gửi RFQ nếu số lượng nhỏ hơn MOQ quy định
            var minMoq = product.PriceTiers.Any() ? product.PriceTiers.Min(t => t.MinQuantity) : 100;
            if (itemReq.Quantity < minMoq)
            {
                throw new InvalidOperationException($"Sản phẩm '{product.BaseSku}' yêu cầu số lượng tối thiểu sỉ (MOQ) là {minMoq}. Bạn đã yêu cầu {itemReq.Quantity}.");
            }

            // Tính toán CBM và trọng lượng
            decimal itemCbm = 0;
            decimal itemGrossWeight = 0;

            if (product.ExportPackaging != null)
            {
                int pcsPerCarton = product.ExportPackaging.PcsPerCarton > 0 ? product.ExportPackaging.PcsPerCarton : 1;
                int totalCartons = (int)Math.Ceiling((double)itemReq.Quantity / pcsPerCarton);

                decimal cartonCbm = (product.ExportPackaging.CartonLengthCm * 
                                     product.ExportPackaging.CartonWidthCm * 
                                     product.ExportPackaging.CartonHeightCm) / 1_000_000m;

                itemCbm = Math.Round(cartonCbm * totalCartons, 4);
                itemGrossWeight = Math.Round(product.ExportPackaging.GrossWeightKg * totalCartons, 2);
            }
            else
            {
                itemCbm = Math.Round(itemReq.Quantity * 0.02m, 4);
                itemGrossWeight = Math.Round(itemReq.Quantity * 0.5m, 2);
            }

            totalCbm += itemCbm;
            totalGrossWeightKg += itemGrossWeight;

            rfqItems.Add(new RfqItem
            {
                ProductId = product.Id,
                Quantity = itemReq.Quantity,
                TargetPriceUsd = itemReq.TargetPriceUsd,
                CalculatedCbm = itemCbm,
                CustomRequirements = itemReq.CustomRequirements
            });
        }

        var suggestedContainer = _statePolicy.SuggestContainerType(totalCbm);
        var rfqNumber = $"RFQ-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var rfq = new RfqRequest
        {
            RfqNumber = rfqNumber,
            CompanyId = request.CompanyId,
            IncotermCode = request.IncotermCode.Trim().ToUpperInvariant(),
            PortOfLoading = request.PortOfLoading,
            PortOfDischarge = request.PortOfDischarge,
            TargetDeliveryDate = request.TargetDeliveryDate,
            Status = "SUBMITTED",
            TotalCbm = totalCbm,
            TotalGrossWeightKg = totalGrossWeightKg,
            SuggestedContainerType = suggestedContainer,
            CreatedAt = DateTime.UtcNow,
            RfqItems = rfqItems
        };

        _context.RfqRequests.Add(rfq);
        await _context.SaveChangesAsync();

        return await GetRfqByIdAsync(rfq.Id);
    }

    public async Task<RfqDetailDto> GetRfqByIdAsync(long rfqId, long? requestingUserId = null)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.Company)
            .Include(r => r.RfqItems)
                .ThenInclude(ri => ri.Product)
                    .ThenInclude(p => p.Translations)
            .Include(r => r.NegotiationHistories)
                .ThenInclude(nh => nh.SenderUser)
            .FirstOrDefaultAsync(r => r.Id == rfqId);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"RFQ with ID {rfqId} was not found.");
        }

        if (requestingUserId.HasValue)
        {
            var requestingUser = await _context.Users
                .Include(u => u.UserRoles)
                    .ThenInclude(ur => ur.Role)
                .FirstOrDefaultAsync(u => u.Id == requestingUserId.Value);

            var isStaff = requestingUser?.UserRoles.Any(ur => ur.Role.Name is "Admin_Super" or "Sales_Executive") ?? false;
            if (!isStaff && rfq.Company != null && rfq.Company.UserId != requestingUserId.Value)
            {
                throw new UnauthorizedAccessException("Bạn không có quyền truy cập yêu cầu báo giá của doanh nghiệp khác.");
            }
        }

        return rfq.ToDetailDto();
    }

    public async Task<List<RfqSummaryDto>> GetCompanyRfqsAsync(long companyId)
    {
        var rfqs = await _context.RfqRequests
            .Include(r => r.Company)
            .Where(r => r.CompanyId == companyId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return rfqs.Select(r => r.ToSummaryDto()).ToList();
    }

    public async Task<List<RfqSummaryDto>> GetAllRfqsAsync(string? status = null)
    {
        var query = _context.RfqRequests.Include(r => r.Company).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(r => r.Status == status.Trim().ToUpperInvariant());
        }

        var rfqs = await query.OrderByDescending(r => r.CreatedAt).ToListAsync();
        return rfqs.Select(r => r.ToSummaryDto()).ToList();
    }

    // EXP-50, EXP-51, EXP-52: Sales soạn Báo giá chính thức kèm Incoterms & cước tàu
    public async Task<RfqDetailDto> SubmitOfficialQuotationAsync(long salesUserId, long rfqId, SubmitQuotationDto request)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.RfqItems)
                .ThenInclude(ri => ri.Product)
            .Include(r => r.NegotiationHistories)
            .FirstOrDefaultAsync(r => r.Id == rfqId);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"RFQ with ID {rfqId} was not found.");
        }

        _statePolicy.EnsureCanTransition(rfq.Status, "QUOTED");

        decimal goodsSubtotal = 0;
        foreach (var priceItem in request.ItemPrices)
        {
            var rfqItem = rfq.RfqItems.FirstOrDefault(i => i.Id == priceItem.RfqItemId);
            if (rfqItem != null)
            {
                rfqItem.QuotedUnitPriceUsd = priceItem.QuotedUnitPriceUsd;
                goodsSubtotal += priceItem.QuotedUnitPriceUsd * rfqItem.Quantity;
            }
        }

        // Tính cước vận tải biển & bảo hiểm qua Incoterms Engine
        var incotermsCalc = await _incotermsService.CalculateIncotermsQuoteAsync(new CalculateIncotermsQuoteRequestDto
        {
            IncotermCode = rfq.IncotermCode,
            PortOfLoading = rfq.PortOfLoading,
            PortOfDischarge = rfq.PortOfDischarge,
            GoodsSubtotalUsd = goodsSubtotal,
            TotalCbm = rfq.TotalCbm,
            TotalGrossWeightKg = rfq.TotalGrossWeightKg
        });

        rfq.OceanFreightCostUsd = request.CustomOceanFreightCostUsd ?? incotermsCalc.OceanFreightCostUsd;
        rfq.MarineInsuranceCostUsd = request.CustomMarineInsuranceCostUsd ?? incotermsCalc.MarineInsuranceCostUsd;
        rfq.TotalQuotedAmountUsd = goodsSubtotal + rfq.OceanFreightCostUsd + rfq.MarineInsuranceCostUsd;

        rfq.PriceValidityUntil = request.PriceValidityUntil ?? DateOnly.FromDateTime(DateTime.UtcNow.AddDays(14));
        rfq.Status = "QUOTED";
        rfq.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(request.SalesNote))
        {
            rfq.NegotiationHistories.Add(new RfqNegotiationHistory
            {
                RfqId = rfq.Id,
                SenderUserId = salesUserId,
                Message = $"[Official Quotation]: {request.SalesNote}",
                ProposedTotalUsd = rfq.TotalQuotedAmountUsd,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _context.SaveChangesAsync();
        return await GetRfqByIdAsync(rfq.Id);
    }

    // EXP-54: Khách thương lượng nhiều vòng (Counter-Offer)
    public async Task<RfqDetailDto> AddCounterOfferAsync(long userId, long rfqId, CounterOfferRequestDto request)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.Company)
            .Include(r => r.NegotiationHistories)
            .FirstOrDefaultAsync(r => r.Id == rfqId);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"RFQ with ID {rfqId} was not found.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var isStaff = user?.UserRoles.Any(ur => ur.Role.Name is "Admin_Super" or "Sales_Executive") ?? false;
        if (!isStaff && rfq.Company != null && rfq.Company.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền thương lượng trên yêu cầu báo giá này.");
        }

        _statePolicy.EnsureCanTransition(rfq.Status, "REVISED");

        var history = new RfqNegotiationHistory
        {
            RfqId = rfq.Id,
            SenderUserId = userId,
            Message = request.Message,
            ProposedTotalUsd = request.ProposedTotalUsd,
            CreatedAt = DateTime.UtcNow
        };

        rfq.NegotiationHistories.Add(history);
        rfq.Status = "REVISED";
        rfq.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return await GetRfqByIdAsync(rfq.Id);
    }

    // Khách chấp thuận báo giá chính thức
    public async Task<RfqDetailDto> AcceptQuotationAsync(long userId, long rfqId)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.Company)
            .Include(r => r.NegotiationHistories)
            .FirstOrDefaultAsync(r => r.Id == rfqId);

        if (rfq == null)
        {
            throw new KeyNotFoundException($"RFQ with ID {rfqId} was not found.");
        }

        var user = await _context.Users
            .Include(u => u.UserRoles)
                .ThenInclude(ur => ur.Role)
            .FirstOrDefaultAsync(u => u.Id == userId);

        var isStaff = user?.UserRoles.Any(ur => ur.Role.Name is "Admin_Super" or "Sales_Executive") ?? false;
        if (!isStaff && rfq.Company != null && rfq.Company.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền chấp thuận yêu cầu báo giá này.");
        }

        _statePolicy.EnsureCanTransition(rfq.Status, "ACCEPTED");

        rfq.Status = "ACCEPTED";
        rfq.UpdatedAt = DateTime.UtcNow;

        rfq.NegotiationHistories.Add(new RfqNegotiationHistory
        {
            RfqId = rfq.Id,
            SenderUserId = userId,
            Message = "Khách hàng đã chấp thuận báo giá chính thức. Chuyển sang bước thanh toán đặt cọc T/T.",
            ProposedTotalUsd = rfq.TotalQuotedAmountUsd,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return await GetRfqByIdAsync(rfq.Id);
    }
}
