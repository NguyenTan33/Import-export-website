using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class CbmCalculatorService : ICbmCalculatorService
{
    private readonly IApplicationDbContext _context;

    // Thông số tiêu chuẩn container quốc tế (Roadmap EXP-64, EXP-65)
    private const decimal Container20FtMaxCbm = 28.0m;
    private const decimal Container20FtMaxWeightKg = 21600.0m;

    private const decimal Container40FtHcMaxCbm = 68.0m;
    private const decimal Container40FtHcMaxWeightKg = 26500.0m;

    public CbmCalculatorService(IApplicationDbContext context)
    {
        _context = context;
    }

    public CalculateCbmResponseDto Calculate(CalculateCbmRequestDto request)
    {
        var cbmPerCarton = (request.CartonLengthCm * request.CartonWidthCm * request.CartonHeightCm) / 1_000_000.0m;
        var totalCbm = Math.Round(cbmPerCarton * request.TotalCartons, 3);
        var totalGrossWeight = Math.Round(request.GrossWeightPerCartonKg * request.TotalCartons, 2);

        string suggestedMode;
        string recommendedContainer;
        decimal spaceUtilization;
        decimal weightUtilization;
        string advice;

        if (totalCbm < 15.0m && totalGrossWeight < 10000.0m)
        {
            suggestedMode = "LCL (Less than Container Load)";
            recommendedContainer = "LCL Consolidation (Ghép cont hàng lẻ Cát Lái)";
            spaceUtilization = Math.Round((totalCbm / Container20FtMaxCbm) * 100, 1);
            weightUtilization = Math.Round((totalGrossWeight / Container20FtMaxWeightKg) * 100, 1);
            advice = $"Lô hàng nhỏ ({totalCbm} CBM, {totalGrossWeight} kg). Đi hàng lẻ ghép cont LCL tại Cảng Cát Lái là tối ưu chi phí nhất.";
        }
        else if (totalCbm <= Container20FtMaxCbm && totalGrossWeight <= Container20FtMaxWeightKg)
        {
            suggestedMode = "FCL (Full Container Load)";
            recommendedContainer = "1x20ft General Purpose (GP)";
            spaceUtilization = Math.Round((totalCbm / Container20FtMaxCbm) * 100, 1);
            weightUtilization = Math.Round((totalGrossWeight / Container20FtMaxWeightKg) * 100, 1);
            advice = $"Vừa vặn 1 Container 20ft GP (Hiệu suất thể tích: {spaceUtilization}%, trọng lượng: {weightUtilization}%).";
        }
        else if (totalCbm <= Container40FtHcMaxCbm && totalGrossWeight <= Container40FtHcMaxWeightKg)
        {
            suggestedMode = "FCL (Full Container Load)";
            recommendedContainer = "1x40ft High Cube (40HC)";
            spaceUtilization = Math.Round((totalCbm / Container40FtHcMaxCbm) * 100, 1);
            weightUtilization = Math.Round((totalGrossWeight / Container40FtHcMaxWeightKg) * 100, 1);
            advice = $"Tối ưu nhất khi đóng 1 Container 40ft High Cube (Hiệu suất thể tích: {spaceUtilization}%, trọng lượng: {weightUtilization}%).";
        }
        else
        {
            suggestedMode = "FCL (Multi-Container Load)";
            var count40Hc = (int)(totalCbm / Container40FtHcMaxCbm);
            var remainderCbm = totalCbm % Container40FtHcMaxCbm;
            recommendedContainer = remainderCbm > 20.0m 
                ? $"{count40Hc + 1}x40ft High Cube" 
                : $"{count40Hc}x40ft HC + 1x20ft GP";
            spaceUtilization = 95.0m;
            weightUtilization = 90.0m;
            advice = $"Lô hàng quy mô lớn ({totalCbm} CBM). Khuyến nghị phân bổ thành nhiều container FCL.";
        }

        return new CalculateCbmResponseDto
        {
            CbmPerCarton = Math.Round(cbmPerCarton, 4),
            TotalCbm = totalCbm,
            TotalGrossWeightKg = totalGrossWeight,
            SuggestedShipmentMode = suggestedMode,
            RecommendedContainerType = recommendedContainer,
            ContainerSpaceUtilizationPercentage = spaceUtilization,
            ContainerWeightUtilizationPercentage = weightUtilization,
            LogisticsAdvice = advice
        };
    }

    public CalculateMultiItemCbmResponseDto CalculateMultiItem(CalculateMultiItemCbmRequestDto request)
    {
        if (request.Items == null || request.Items.Count == 0)
        {
            throw new ArgumentException("Danh sách mặt hàng cần tính CBM không được để trống.");
        }

        var isEuro = request.PalletType.Equals("EURO_1200X800", StringComparison.OrdinalIgnoreCase);
        var palletUsableVolume = isEuro ? 1.44m : 1.80m; // Thể tích ước tính 1 kiện pallet (cao 1.5 - 1.6m)

        var breakdowns = new List<MultiItemCargoBreakdownDto>();
        decimal totalCbm = 0;
        decimal totalGrossWeight = 0;
        int totalCartons = 0;
        int totalPallets = 0;

        foreach (var item in request.Items)
        {
            if (item.CartonLengthCm <= 0 || item.CartonWidthCm <= 0 || item.CartonHeightCm <= 0 || item.TotalCartons <= 0)
            {
                continue;
            }

            var cbmPerCarton = (item.CartonLengthCm * item.CartonWidthCm * item.CartonHeightCm) / 1_000_000.0m;
            var subtotalCbm = Math.Round(cbmPerCarton * item.TotalCartons, 3);
            var subtotalWeight = Math.Round(item.GrossWeightPerCartonKg * item.TotalCartons, 2);

            var estimatedPalletsForItem = request.RequirePalletization 
                ? (int)Math.Max(1, Math.Ceiling(subtotalCbm / palletUsableVolume))
                : 0;

            breakdowns.Add(new MultiItemCargoBreakdownDto
            {
                ProductId = item.ProductId,
                ItemName = item.ItemName,
                TotalCartons = item.TotalCartons,
                CbmPerCarton = Math.Round(cbmPerCarton, 4),
                SubtotalCbm = subtotalCbm,
                SubtotalGrossWeightKg = subtotalWeight,
                EstimatedPallets = estimatedPalletsForItem
            });

            totalCbm += subtotalCbm;
            totalGrossWeight += subtotalWeight;
            totalCartons += item.TotalCartons;
            totalPallets += estimatedPalletsForItem;
        }

        totalCbm = Math.Round(totalCbm, 3);
        totalGrossWeight = Math.Round(totalGrossWeight, 2);

        string mode;
        string primaryRec;
        string advice;
        var containerPlans = new List<ContainerPlanDto>();

        if (totalCbm < 15.0m && totalGrossWeight < 10000.0m)
        {
            mode = "LCL (Less than Container Load)";
            primaryRec = "LCL Consolidation (Ghép cont hàng lẻ tại Cát Lái)";
            advice = $"Lô hàng hỗn hợp gồm {breakdowns.Count} mặt hàng ({totalCbm} CBM, {totalGrossWeight} kg). Khuyến nghị ghép cont LCL xuất từ Cảng Cát Lái.";

            containerPlans.Add(new ContainerPlanDto
            {
                ContainerType = "LCL Consolidation Space",
                Quantity = 1,
                UsableCapacityCbm = 15.0m,
                MaxPayloadKg = 10000.0m,
                SpaceUtilizationPercentage = Math.Round((totalCbm / 15.0m) * 100, 1),
                WeightUtilizationPercentage = Math.Round((totalGrossWeight / 10000.0m) * 100, 1)
            });
        }
        else if (totalCbm <= Container20FtMaxCbm && totalGrossWeight <= Container20FtMaxWeightKg)
        {
            mode = "FCL (Full Container Load)";
            primaryRec = "1x20ft General Purpose (GP)";
            var spaceUtil = Math.Round((totalCbm / Container20FtMaxCbm) * 100, 1);
            var weightUtil = Math.Round((totalGrossWeight / Container20FtMaxWeightKg) * 100, 1);
            advice = $"Đóng vừa vặn 1 container 20ft GP (Đạt {spaceUtil}% thể tích, {weightUtil}% tải trọng cho phép).";

            containerPlans.Add(new ContainerPlanDto
            {
                ContainerType = "20ft GP",
                Quantity = 1,
                UsableCapacityCbm = Container20FtMaxCbm,
                MaxPayloadKg = Container20FtMaxWeightKg,
                SpaceUtilizationPercentage = spaceUtil,
                WeightUtilizationPercentage = weightUtil
            });
        }
        else if (totalCbm <= Container40FtHcMaxCbm && totalGrossWeight <= Container40FtHcMaxWeightKg)
        {
            mode = "FCL (Full Container Load)";
            primaryRec = "1x40ft High Cube (40HC)";
            var spaceUtil = Math.Round((totalCbm / Container40FtHcMaxCbm) * 100, 1);
            var weightUtil = Math.Round((totalGrossWeight / Container40FtHcMaxWeightKg) * 100, 1);
            advice = $"Đóng tối ưu trong 1 container 40ft High Cube (Đạt {spaceUtil}% thể tích, {weightUtil}% tải trọng cho phép).";

            containerPlans.Add(new ContainerPlanDto
            {
                ContainerType = "40ft HC",
                Quantity = 1,
                UsableCapacityCbm = Container40FtHcMaxCbm,
                MaxPayloadKg = Container40FtHcMaxWeightKg,
                SpaceUtilizationPercentage = spaceUtil,
                WeightUtilizationPercentage = weightUtil
            });
        }
        else
        {
            mode = "FCL (Multi-Container Load)";
            var count40Hc = (int)(totalCbm / Container40FtHcMaxCbm);
            var remainderCbm = totalCbm % Container40FtHcMaxCbm;

            if (remainderCbm > 20.0m)
            {
                primaryRec = $"{count40Hc + 1}x40ft High Cube";
                containerPlans.Add(new ContainerPlanDto
                {
                    ContainerType = "40ft HC",
                    Quantity = count40Hc + 1,
                    UsableCapacityCbm = (count40Hc + 1) * Container40FtHcMaxCbm,
                    MaxPayloadKg = (count40Hc + 1) * Container40FtHcMaxWeightKg,
                    SpaceUtilizationPercentage = Math.Round((totalCbm / ((count40Hc + 1) * Container40FtHcMaxCbm)) * 100, 1),
                    WeightUtilizationPercentage = Math.Round((totalGrossWeight / ((count40Hc + 1) * Container40FtHcMaxWeightKg)) * 100, 1)
                });
            }
            else
            {
                primaryRec = $"{count40Hc}x40ft HC + 1x20ft GP";
                containerPlans.Add(new ContainerPlanDto
                {
                    ContainerType = "40ft HC",
                    Quantity = count40Hc,
                    UsableCapacityCbm = count40Hc * Container40FtHcMaxCbm,
                    MaxPayloadKg = count40Hc * Container40FtHcMaxWeightKg,
                    SpaceUtilizationPercentage = 95.0m,
                    WeightUtilizationPercentage = 90.0m
                });
                containerPlans.Add(new ContainerPlanDto
                {
                    ContainerType = "20ft GP",
                    Quantity = 1,
                    UsableCapacityCbm = Container20FtMaxCbm,
                    MaxPayloadKg = Container20FtMaxWeightKg,
                    SpaceUtilizationPercentage = Math.Round((remainderCbm / Container20FtMaxCbm) * 100, 1),
                    WeightUtilizationPercentage = 80.0m
                });
            }

            advice = $"Lô hàng hỗn hợp quy mô lớn ({totalCbm} CBM, {totalGrossWeight} kg). Cần bố trí đóng {primaryRec}.";
        }

        PalletSummaryDto? palletSummary = null;
        if (request.RequirePalletization)
        {
            var max20 = isEuro ? 11 : 10;
            var max40 = isEuro ? 24 : 21;
            palletSummary = new PalletSummaryDto
            {
                IsPalletized = true,
                PalletType = isEuro ? "Euro Pallet (1200 x 800 mm)" : "Standard Pallet (1200 x 1000 mm)",
                TotalEstimatedPallets = totalPallets,
                MaxPalletsFitIn20Ft = max20,
                MaxPalletsFitIn40Ft = max40,
                PalletAdvice = totalPallets <= max20 
                    ? $"Có thể xếp vừa 1 container 20ft ({totalPallets}/{max20} pallets sàn)."
                    : totalPallets <= max40 
                        ? $"Cần 1 container 40ft để chở đủ ({totalPallets}/{max40} pallets sàn)."
                        : $"Vượt quá 1 container 40ft (Tổng {totalPallets} pallets), cần tách thành nhiều container."
            };
        }

        return new CalculateMultiItemCbmResponseDto
        {
            TotalItemsCount = breakdowns.Count,
            TotalCartons = totalCartons,
            TotalCbm = totalCbm,
            TotalGrossWeightKg = totalGrossWeight,
            SuggestedShipmentMode = mode,
            PrimaryRecommendedContainer = primaryRec,
            ContainerPlan = containerPlans,
            PalletSummary = palletSummary,
            ItemBreakdowns = breakdowns,
            LogisticsAdvice = advice
        };
    }

    public async Task<RfqPackingOptimizationResultDto> OptimizePackingForRfqAsync(long rfqId)
    {
        var rfq = await _context.RfqRequests
            .Include(r => r.RfqItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.ExportPackaging)
            .Include(r => r.RfqItems)
                .ThenInclude(i => i.Product)
                    .ThenInclude(p => p.Translations)
            .FirstOrDefaultAsync(r => r.Id == rfqId)
            ?? throw new KeyNotFoundException($"Không tìm thấy đơn báo giá RFQ có ID = {rfqId}");

        if (rfq.RfqItems.Count == 0)
        {
            throw new InvalidOperationException("Đơn RFQ này hiện chưa có sản phẩm nào để tính phương án đóng hàng.");
        }

        var cargoItems = new List<MultiItemCargoItemDto>();

        foreach (var item in rfq.RfqItems)
        {
            var packaging = item.Product?.ExportPackaging;
            var pcsPerCarton = packaging?.PcsPerCarton > 0 ? packaging.PcsPerCarton : 1;
            var cartons = (int)Math.Max(1, Math.Ceiling((decimal)item.Quantity / pcsPerCarton));

            var length = packaging?.CartonLengthCm > 0 ? packaging.CartonLengthCm : 50m;
            var width = packaging?.CartonWidthCm > 0 ? packaging.CartonWidthCm : 40m;
            var height = packaging?.CartonHeightCm > 0 ? packaging.CartonHeightCm : 30m;
            var weight = packaging?.GrossWeightKg > 0 ? packaging.GrossWeightKg : 10m;

            var pName = item.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "vi")?.Name 
                     ?? item.Product?.BaseSku 
                     ?? $"Sản phẩm #{item.ProductId}";

            cargoItems.Add(new MultiItemCargoItemDto
            {
                ProductId = item.ProductId,
                ItemName = pName,
                CartonLengthCm = length,
                CartonWidthCm = width,
                CartonHeightCm = height,
                GrossWeightPerCartonKg = weight,
                TotalCartons = cartons
            });
        }

        var multiCalcResult = CalculateMultiItem(new CalculateMultiItemCbmRequestDto
        {
            Items = cargoItems,
            RequirePalletization = false
        });

        // Tự động cập nhật ngược lại thông số đóng gói và gợi ý container vào hồ sơ RFQ
        rfq.TotalCbm = multiCalcResult.TotalCbm;
        rfq.TotalGrossWeightKg = multiCalcResult.TotalGrossWeightKg;
        rfq.SuggestedContainerType = multiCalcResult.PrimaryRecommendedContainer;
        rfq.UpdatedAt = DateTime.UtcNow;

        // Cập nhật CBM cho từng dòng RfqItem
        foreach (var rfqItem in rfq.RfqItems)
        {
            var matchBreakdown = multiCalcResult.ItemBreakdowns.FirstOrDefault(b => b.ProductId == rfqItem.ProductId);
            if (matchBreakdown != null)
            {
                rfqItem.CalculatedCbm = matchBreakdown.SubtotalCbm;
            }
        }

        await _context.SaveChangesAsync();

        return new RfqPackingOptimizationResultDto
        {
            RfqId = rfq.Id,
            RfqNumber = rfq.RfqNumber,
            ItemsCount = rfq.RfqItems.Count,
            TotalCartons = multiCalcResult.TotalCartons,
            TotalCbm = multiCalcResult.TotalCbm,
            TotalGrossWeightKg = multiCalcResult.TotalGrossWeightKg,
            SuggestedContainerType = multiCalcResult.PrimaryRecommendedContainer,
            Details = multiCalcResult
        };
    }
}
