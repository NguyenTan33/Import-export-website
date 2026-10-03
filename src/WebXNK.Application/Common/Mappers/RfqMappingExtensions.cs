using WebXNK.Application.DTOs;
using WebXNK.Domain.Entities;

namespace WebXNK.Application.Common.Mappers;

public static class RfqMappingExtensions
{
    public static RfqDetailDto ToDetailDto(this RfqRequest rfq)
    {
        return new RfqDetailDto
        {
            Id = rfq.Id,
            RfqNumber = rfq.RfqNumber,
            CompanyId = rfq.CompanyId,
            CompanyName = rfq.Company?.CompanyName ?? string.Empty,
            IncotermCode = rfq.IncotermCode,
            PortOfLoading = rfq.PortOfLoading,
            PortOfDischarge = rfq.PortOfDischarge,
            TargetDeliveryDate = rfq.TargetDeliveryDate,
            PriceValidityUntil = rfq.PriceValidityUntil,
            Status = rfq.Status,
            TotalCbm = rfq.TotalCbm,
            TotalGrossWeightKg = rfq.TotalGrossWeightKg,
            SuggestedContainerType = rfq.SuggestedContainerType,
            OceanFreightCostUsd = rfq.OceanFreightCostUsd,
            MarineInsuranceCostUsd = rfq.MarineInsuranceCostUsd,
            TotalQuotedAmountUsd = rfq.TotalQuotedAmountUsd,
            CreatedAt = rfq.CreatedAt,
            UpdatedAt = rfq.UpdatedAt,
            Items = rfq.RfqItems.Select(ri => new RfqItemDetailDto
            {
                Id = ri.Id,
                ProductId = ri.ProductId,
                ProductName = ri.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                    ?? ri.Product?.Translations.FirstOrDefault()?.Name ?? "Product",
                ProductSku = ri.Product?.BaseSku ?? string.Empty,
                Quantity = ri.Quantity,
                TargetPriceUsd = ri.TargetPriceUsd,
                QuotedUnitPriceUsd = ri.QuotedUnitPriceUsd,
                CalculatedCbm = ri.CalculatedCbm,
                CustomRequirements = ri.CustomRequirements
            }).ToList(),
            NegotiationHistories = rfq.NegotiationHistories.Select(nh => new RfqNegotiationHistoryDto
            {
                Id = nh.Id,
                SenderUserId = nh.SenderUserId,
                SenderName = nh.SenderUser?.FullName ?? "User",
                Message = nh.Message,
                ProposedTotalUsd = nh.ProposedTotalUsd,
                CreatedAt = nh.CreatedAt
            }).OrderBy(nh => nh.CreatedAt).ToList()
        };
    }

    public static RfqSummaryDto ToSummaryDto(this RfqRequest rfq)
    {
        return new RfqSummaryDto
        {
            Id = rfq.Id,
            RfqNumber = rfq.RfqNumber,
            CompanyId = rfq.CompanyId,
            CompanyName = rfq.Company?.CompanyName ?? string.Empty,
            IncotermCode = rfq.IncotermCode,
            PortOfDischarge = rfq.PortOfDischarge,
            Status = rfq.Status,
            TotalCbm = rfq.TotalCbm,
            TotalQuotedAmountUsd = rfq.TotalQuotedAmountUsd,
            CreatedAt = rfq.CreatedAt
        };
    }
}
