namespace WebXNK.Application.Common.Logistics;

public interface IOceanFreightEstimator
{
    decimal EstimateFreight(string portOfLoading, string portOfDischarge, decimal totalCbm, decimal grossWeightKg);
}

public class OceanFreightEstimator : IOceanFreightEstimator
{
    public decimal EstimateFreight(string portOfLoading, string portOfDischarge, decimal totalCbm, decimal grossWeightKg)
    {
        var podLower = (portOfDischarge ?? string.Empty).ToLowerInvariant();
        decimal baseRatePerCbm = podLower switch
        {
            var p when p.Contains("los angeles") || p.Contains("long beach") || p.Contains("seattle") || p.Contains("usa") || p.Contains("california") => 85.00m,
            var p when p.Contains("new york") || p.Contains("savannah") || p.Contains("norfolk") => 115.00m,
            var p when p.Contains("rotterdam") || p.Contains("hamburg") || p.Contains("antwerp") || p.Contains("europe") || p.Contains("germany") => 95.00m,
            var p when p.Contains("tokyo") || p.Contains("yokohama") || p.Contains("japan") => 42.00m,
            var p when p.Contains("busan") || p.Contains("incheon") || p.Contains("korea") => 40.00m,
            var p when p.Contains("singapore") || p.Contains("bangkok") || p.Contains("port klang") => 30.00m,
            _ => 75.00m
        };

        // Revenue Ton (RT): Max(CBM, Weight / 1000)
        decimal revenueTon = Math.Max(totalCbm, grossWeightKg / 1000m);
        if (revenueTon < 1.0m) revenueTon = 1.0m;

        decimal documentationFee = 60.00m;
        return Math.Round((revenueTon * baseRatePerCbm) + documentationFee, 2);
    }
}

public interface IMarineInsuranceCalculator
{
    decimal CalculatePremium(decimal cfrAmountUsd, decimal insuranceRatePercent = 0.35m);
}

public class MarineInsuranceCalculator : IMarineInsuranceCalculator
{
    public decimal CalculatePremium(decimal cfrAmountUsd, decimal insuranceRatePercent = 0.35m)
    {
        if (cfrAmountUsd <= 0) return 0;

        // Chuẩn ICC (A/C): Insured Value = 110% CFR
        decimal insuredValue = cfrAmountUsd * 1.10m;
        decimal premium = insuredValue * (insuranceRatePercent / 100m);

        // Mức phí tối thiểu $25
        return Math.Round(Math.Max(premium, 25.00m), 2);
    }
}
