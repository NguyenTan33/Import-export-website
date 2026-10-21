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

        var (stowedBoxes, cog) = GenerateSingleItemStowage(
            request.CartonLengthCm,
            request.CartonWidthCm,
            request.CartonHeightCm,
            request.GrossWeightPerCartonKg,
            request.TotalCartons,
            recommendedContainer);

        return new CalculateCbmResponseDto
        {
            CbmPerCarton = Math.Round(cbmPerCarton, 4),
            TotalCbm = totalCbm,
            TotalGrossWeightKg = totalGrossWeight,
            SuggestedShipmentMode = suggestedMode,
            RecommendedContainerType = recommendedContainer,
            ContainerSpaceUtilizationPercentage = spaceUtilization,
            ContainerWeightUtilizationPercentage = weightUtilization,
            LogisticsAdvice = advice,
            StowedBoxes = stowedBoxes,
            CenterOfGravity = cog
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
            if ((item.CartonLengthCm <= 0 || item.CartonWidthCm <= 0 || item.CartonHeightCm <= 0 || item.TotalCartons <= 0) && item.Quantity > 0)
            {
                var (defLen, defWid, defHgt, defGw, defPcs, defName, defSku) = GetDefaultPackagingForProduct(item.ProductId ?? 1);
                if (item.CartonLengthCm <= 0) item.CartonLengthCm = defLen;
                if (item.CartonWidthCm <= 0) item.CartonWidthCm = defWid;
                if (item.CartonHeightCm <= 0) item.CartonHeightCm = defHgt;
                if (item.GrossWeightPerCartonKg <= 0) item.GrossWeightPerCartonKg = defGw;
                var pcs = item.PcsPerCarton > 0 ? item.PcsPerCarton : defPcs;
                if (item.TotalCartons <= 0)
                {
                    item.TotalCartons = (int)Math.Max(1, Math.Ceiling((decimal)item.Quantity / pcs));
                }
                if (string.IsNullOrWhiteSpace(item.ItemName)) item.ItemName = defName;
                if (string.IsNullOrWhiteSpace(item.Sku)) item.Sku = defSku;
            }

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

        var (stowedBoxes, cog) = GenerateMultiItemStowage(request.Items, primaryRec);
        var primaryPlan = containerPlans.FirstOrDefault();
        var capCbm = primaryPlan?.UsableCapacityCbm ?? Container40FtHcMaxCbm;
        var maxWeightKg = primaryPlan?.MaxPayloadKg ?? Container40FtHcMaxWeightKg;
        var volUtil = primaryPlan?.SpaceUtilizationPercentage ?? Math.Round((totalCbm / capCbm) * 100, 1);
        var wgtUtil = primaryPlan?.WeightUtilizationPercentage ?? Math.Round((totalGrossWeight / maxWeightKg) * 100, 1);

        return new CalculateMultiItemCbmResponseDto
        {
            TotalItemsCount = breakdowns.Count,
            TotalCartons = totalCartons,
            TotalCbm = totalCbm,
            TotalGrossWeightKg = totalGrossWeight,
            SuggestedShipmentMode = mode,
            PrimaryRecommendedContainer = primaryRec,
            SuggestedContainerType = primaryRec,
            ContainerCapacityCbm = capCbm,
            VolumeUtilizationPercentage = volUtil,
            WeightLimitKg = maxWeightKg,
            WeightUtilizationPercentage = wgtUtil,
            ContainerPlan = containerPlans,
            PalletSummary = palletSummary,
            ItemBreakdowns = breakdowns,
            LogisticsAdvice = advice,
            StowedBoxes = stowedBoxes,
            CenterOfGravity = cog
        };
    }

    private static (decimal LengthCm, decimal WidthCm, decimal HeightCm, decimal GrossWeightKg, int PcsPerCarton, string Name, string Sku) GetDefaultPackagingForProduct(long productId)
    {
        return productId switch
        {
            1 => (60m, 40m, 35m, 11.2m, 12, "Giày thể thao Sneaker xuất khẩu", "SHOES-SNK-V1"),
            2 => (45m, 35m, 28m, 10.5m, 10, "Than gáo dừa nén lục giác BBQ", "CHAR-COCO-BBQ"),
            3 => (122m, 25m, 25m, 18.0m, 50, "Cán chổi gỗ bạch đàn 120cm", "BROOM-EUC-120"),
            4 => (48m, 36m, 26m, 23.4m, 2, "Hạt điều nhân trắng Grade W320", "AGRI-CASHEW-W320"),
            5 => (42m, 32m, 30m, 13.8m, 72, "Băng keo trong OPP 48mm", "TAPE-OPP-48X100"),
            6 => (52m, 36m, 26m, 15.6m, 6, "Màng PE quấn pallet 50cm", "PE-FILM-50-17"),
            _ => (50m, 40m, 35m, 12.0m, 10, $"Thành phẩm xuất khẩu #{productId}", $"SKU-EXP-{productId}")
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

    private static (List<StowedBoxCoordinateDto> Boxes, CenterOfGravityDto? Cog) GenerateSingleItemStowage(
        decimal lengthCm,
        decimal widthCm,
        decimal heightCm,
        decimal weightPerCartonKg,
        int totalCartons,
        string recommendedContainer)
    {
        var is20Ft = recommendedContainer.Contains("20ft", StringComparison.OrdinalIgnoreCase);
        var containerLengthM = is20Ft ? 5.90m : 12.03m;
        var containerWidthM = 2.35m;
        var containerHeightM = recommendedContainer.Contains("HC", StringComparison.OrdinalIgnoreCase) ? 2.69m : 2.39m;

        var boxLengthM = Math.Max(0.1m, Math.Round(lengthCm / 100.0m, 3));
        var boxWidthM = Math.Max(0.1m, Math.Round(widthCm / 100.0m, 3));
        var boxHeightM = Math.Max(0.1m, Math.Round(heightCm / 100.0m, 3));

        var boxes = new List<StowedBoxCoordinateDto>();
        int count = 0;
        int maxVisualBoxes = Math.Min(totalCartons, 400); // Tối ưu số lượng boxes hiển thị 3D mượt mà

        int layerIndex = 0;
        decimal currentY = 0;

        while (currentY + boxHeightM <= containerHeightM && count < maxVisualBoxes)
        {
            decimal currentX = 0;
            while (currentX + boxLengthM <= containerLengthM && count < maxVisualBoxes)
            {
                decimal currentZ = 0;
                while (currentZ + boxWidthM <= containerWidthM && count < maxVisualBoxes)
                {
                    boxes.Add(new StowedBoxCoordinateDto
                    {
                        ItemName = "Thành phẩm đóng thùng xuất khẩu",
                        Sku = "EXPORT-CARGO",
                        X = Math.Round(currentX, 3),
                        Y = Math.Round(currentY, 3),
                        Z = Math.Round(currentZ, 3),
                        LengthM = boxLengthM,
                        WidthM = boxWidthM,
                        HeightM = boxHeightM,
                        WeightKg = weightPerCartonKg,
                        ColorHex = "#0E4B94",
                        LayerIndex = layerIndex
                    });
                    count++;
                    currentZ += boxWidthM;
                }
                currentX += boxLengthM;
            }
            currentY += boxHeightM;
            layerIndex++;
        }

        var cog = CalculateCenterOfGravity(boxes, containerLengthM, containerWidthM, containerHeightM);
        return (boxes, cog);
    }

    private static (List<StowedBoxCoordinateDto> Boxes, CenterOfGravityDto? Cog) GenerateMultiItemStowage(
        List<MultiItemCargoItemDto> items,
        string recommendedContainer)
    {
        var is20Ft = recommendedContainer.Contains("20ft", StringComparison.OrdinalIgnoreCase);
        var containerLengthM = is20Ft ? 5.90m : 12.03m;
        var containerWidthM = 2.35m;
        var containerHeightM = recommendedContainer.Contains("HC", StringComparison.OrdinalIgnoreCase) ? 2.69m : 2.39m;

        var colorPalette = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["SHOES-SNK-V1"] = "#0E4B94",   // Cobalt Navy
            ["CHAR-COCO-BBQ"] = "#37474F",  // Charcoal Slate
            ["BROOM-EUC-120"] = "#8D6E63",  // Wood Brown
            ["AGRI-CASHEW-W320"] = "#00796B", // Cashew Emerald
            ["TAPE-OPP-48X100"] = "#F57F17", // Amber Gold
            ["PE-FILM-50-17"] = "#0288D1"   // Cyan Stretch
        };

        var boxes = new List<StowedBoxCoordinateDto>();
        int totalStowed = 0;
        const int maxTotalVisualBoxes = 500;

        decimal currentX = 0;
        decimal currentY = 0;
        decimal currentZ = 0;
        int layerIndex = 0;

        // Ưu tiên xếp các mặt hàng nặng ở tầng dưới, hàng nhẹ ở tầng trên
        var sortedItems = items
            .Where(i => i.TotalCartons > 0 && i.CartonLengthCm > 0)
            .OrderByDescending(i => i.GrossWeightPerCartonKg)
            .ToList();

        foreach (var item in sortedItems)
        {
            var boxLengthM = Math.Max(0.1m, Math.Round(item.CartonLengthCm / 100.0m, 3));
            var boxWidthM = Math.Max(0.1m, Math.Round(item.CartonWidthCm / 100.0m, 3));
            var boxHeightM = Math.Max(0.1m, Math.Round(item.CartonHeightCm / 100.0m, 3));

            var sku = $"SKU-ITEM-{item.ProductId ?? 1}";
            string color = "#0E4B94";
            if (item.ProductId == 1) color = "#0E4B94";
            else if (item.ProductId == 2) color = "#37474F";
            else if (item.ProductId == 3) color = "#8D6E63";
            else if (item.ProductId == 4) color = "#00796B";
            else if (item.ProductId == 5) color = "#F57F17";
            else if (item.ProductId == 6) color = "#0288D1";
            else if (!string.IsNullOrWhiteSpace(item.ItemName) && colorPalette.TryGetValue(item.ItemName, out var c)) color = c;

            int itemsToStow = Math.Min(item.TotalCartons, 120);

            for (int i = 0; i < itemsToStow && totalStowed < maxTotalVisualBoxes; i++)
            {
                if (currentZ + boxWidthM > containerWidthM)
                {
                    currentZ = 0;
                    currentX += boxLengthM;
                }

                if (currentX + boxLengthM > containerLengthM)
                {
                    currentX = 0;
                    currentZ = 0;
                    currentY += boxHeightM;
                    layerIndex++;
                }

                if (currentY + boxHeightM > containerHeightM)
                {
                    break; // Cont đã đầy chiều cao
                }

                boxes.Add(new StowedBoxCoordinateDto
                {
                    ProductId = item.ProductId,
                    Sku = sku,
                    ItemName = item.ItemName,
                    X = Math.Round(currentX, 3),
                    Y = Math.Round(currentY, 3),
                    Z = Math.Round(currentZ, 3),
                    LengthM = boxLengthM,
                    WidthM = boxWidthM,
                    HeightM = boxHeightM,
                    WeightKg = item.GrossWeightPerCartonKg,
                    ColorHex = color,
                    LayerIndex = layerIndex
                });

                currentZ += boxWidthM;
                totalStowed++;
            }
        }

        var cog = CalculateCenterOfGravity(boxes, containerLengthM, containerWidthM, containerHeightM);
        return (boxes, cog);
    }

    private static CenterOfGravityDto? CalculateCenterOfGravity(
        List<StowedBoxCoordinateDto> boxes,
        decimal containerLengthM,
        decimal containerWidthM,
        decimal containerHeightM)
    {
        if (boxes.Count == 0) return null;

        decimal totalWeight = 0;
        decimal weightedSumX = 0;
        decimal weightedSumY = 0;
        decimal weightedSumZ = 0;

        foreach (var b in boxes)
        {
            var w = Math.Max(1m, b.WeightKg);
            var centerX = b.X + (b.LengthM / 2.0m);
            var centerY = b.Y + (b.HeightM / 2.0m);
            var centerZ = b.Z + (b.WidthM / 2.0m);

            weightedSumX += centerX * w;
            weightedSumY += centerY * w;
            weightedSumZ += centerZ * w;
            totalWeight += w;
        }

        var cogX = Math.Round(weightedSumX / totalWeight, 3);
        var cogY = Math.Round(weightedSumY / totalWeight, 3);
        var cogZ = Math.Round(weightedSumZ / totalWeight, 3);

        var midLength = containerLengthM / 2.0m;
        var midWidth = containerWidthM / 2.0m;

        var longDev = Math.Round(((cogX - midLength) / midLength) * 100.0m, 1);
        var latDev = Math.Round(((cogZ - midWidth) / midWidth) * 100.0m, 1);

        string status;
        string vi;
        string en;
        string advice;

        if (Math.Abs(latDev) <= 5.0m && Math.Abs(longDev) <= 8.0m)
        {
            status = "BALANCED_SAFE";
            vi = "Cân bằng tải tối ưu đạt chuẩn ISO";
            en = "Optimal Balanced Stowage (ISO Compliant)";
            advice = "Trọng tâm hàng hóa phân bổ đều, an toàn tuyệt đối khi vận chuyển đường biển và bốc dỡ cần cẩu.";
        }
        else if (latDev > 5.0m)
        {
            status = "WARNING_STARBOARD_HEAVY";
            vi = $"Cảnh báo lệch tải mạn phải (+{latDev}%)";
            en = $"Warning: Starboard List (+{latDev}%)";
            advice = "Hàng nặng đang dồn về phía mạn phải container, cần phân bổ đều kiện hàng sang mạn trái.";
        }
        else if (latDev < -5.0m)
        {
            status = "WARNING_PORT_HEAVY";
            vi = $"Cảnh báo lệch tải mạn trái ({latDev}%)";
            en = $"Warning: Port List ({latDev}%)";
            advice = "Hàng nặng đang dồn về phía mạn trái container, cần dàn trải kiện hàng sang phía mạn phải.";
        }
        else if (longDev > 8.0m)
        {
            status = "WARNING_AFT_HEAVY";
            vi = $"Cảnh báo nặng phía đuôi/cửa cont (+{longDev}%)";
            en = $"Warning: Aft/Door End Heavy (+{longDev}%)";
            advice = "Trọng tâm dồn về phía cửa cont, có nguy cơ đổ hàng khi mở cửa kiểm tra hải quan.";
        }
        else
        {
            status = "WARNING_BOW_HEAVY";
            vi = $"Cảnh báo nặng phía vách trước ({longDev}%)";
            en = $"Warning: Front/Bow End Heavy ({longDev}%)";
            advice = "Trọng tâm dồn về phía trước container, cần chuyển bớt kiện hàng nặng về phía giữa.";
        }

        return new CenterOfGravityDto
        {
            CenterXM = cogX,
            CenterYM = cogY,
            CenterZM = cogZ,
            LongitudeDeviationPercent = longDev,
            LateralDeviationPercent = latDev,
            BalanceStatus = status,
            StatusTextVi = vi,
            StatusTextEn = en,
            SafetyAdvice = advice
        };
    }
}
