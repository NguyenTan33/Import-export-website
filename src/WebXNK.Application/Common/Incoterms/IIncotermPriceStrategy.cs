namespace WebXNK.Application.Common.Incoterms;

public record IncotermCostBreakdown(
    string IncotermCode,
    decimal GoodsSubtotal,
    decimal OceanFreight,
    decimal MarineInsurance,
    decimal CustomsTax,
    decimal TotalAmount,
    bool RequiresFreight,
    bool RequiresInsurance,
    string Description
);

public interface IIncotermPriceStrategy
{
    string IncotermCode { get; }
    IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance);
}
