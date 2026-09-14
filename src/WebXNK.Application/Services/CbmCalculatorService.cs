using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class CbmCalculatorService : ICbmCalculatorService
{
    // Thông số tiêu chuẩn container quốc tế (Roadmap EXP-64, EXP-65)
    private const decimal Container20FtMaxCbm = 28.0m;
    private const decimal Container20FtMaxWeightKg = 21600.0m;

    private const decimal Container40FtHcMaxCbm = 68.0m;
    private const decimal Container40FtHcMaxWeightKg = 26500.0m;

    public CalculateCbmResponseDto Calculate(CalculateCbmRequestDto request)
    {
        // 1. Tính thể tích CBM trên từng thùng carton: (L x W x H) / 1,000,000
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
            recommendedContainer = "LCL Consolidation (Ghép cont hàng lẻ)";
            spaceUtilization = Math.Round((totalCbm / Container20FtMaxCbm) * 100, 1);
            weightUtilization = Math.Round((totalGrossWeight / Container20FtMaxWeightKg) * 100, 1);
            advice = $"Lô hàng nhỏ ({totalCbm} CBM, {totalGrossWeight} kg). Đi hàng lẻ ghép cont LCL là tối ưu chi phí nhất.";
        }
        else if (totalCbm <= Container20FtMaxCbm && totalGrossWeight <= Container20FtMaxWeightKg)
        {
            suggestedMode = "FCL (Full Container Load)";
            recommendedContainer = "1x20ft General Purpose (GP)";
            spaceUtilization = Math.Round((totalCbm / Container20FtMaxCbm) * 100, 1);
            weightUtilization = Math.Round((totalGrossWeight / Container20FtMaxWeightKg) * 100, 1);
            advice = $"Vừa vặn 1 Container 20ft (Hiệu suất thể tích: {spaceUtilization}%, trọng lượng: {weightUtilization}%).";
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
            advice = $"Lô hàng quy mô lớn ({totalCbm} CBM). Khuyến nghị chia thành nhiều container chuyên dụng.";
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
}
