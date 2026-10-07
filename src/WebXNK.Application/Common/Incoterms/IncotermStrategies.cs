namespace WebXNK.Application.Common.Incoterms;

/// <summary>
/// FOB: Free On Board - Người bán giao hàng lên tàu tại cảng bốc (POL). Cước biển & bảo hiểm do người mua chịu.
/// </summary>
public class FobIncotermStrategy : IIncotermPriceStrategy
{
    public string IncotermCode => "FOB";

    public IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance)
    {
        return new IncotermCostBreakdown(
            IncotermCode: IncotermCode,
            GoodsSubtotal: goodsSubtotal,
            OceanFreight: 0,
            MarineInsurance: 0,
            CustomsTax: 0,
            TotalAmount: goodsSubtotal,
            RequiresFreight: false,
            RequiresInsurance: false,
            Description: $"FOB: Giao hàng lên tàu tại cảng đi. Tổng tiền hàng: ${goodsSubtotal:N2}"
        );
    }
}

/// <summary>
/// CIF: Cost, Insurance and Freight - Người bán thanh toán tiền hàng, cước biển tới cảng dỡ (POD) và bảo hiểm hàng hải.
/// </summary>
public class CifIncotermStrategy : IIncotermPriceStrategy
{
    public string IncotermCode => "CIF";

    public IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance)
    {
        var total = Math.Round(goodsSubtotal + oceanFreight + marineInsurance, 2);
        return new IncotermCostBreakdown(
            IncotermCode: IncotermCode,
            GoodsSubtotal: goodsSubtotal,
            OceanFreight: oceanFreight,
            MarineInsurance: marineInsurance,
            CustomsTax: 0,
            TotalAmount: total,
            RequiresFreight: true,
            RequiresInsurance: true,
            Description: $"CIF: Tiền hàng ${goodsSubtotal:N2} + Cước biển ${oceanFreight:N2} + Bảo hiểm ${marineInsurance:N2} = ${total:N2}"
        );
    }
}

/// <summary>
/// CFR: Cost and Freight - Tiền hàng và cước biển.
/// </summary>
public class CfrIncotermStrategy : IIncotermPriceStrategy
{
    public string IncotermCode => "CFR";

    public IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance)
    {
        var total = Math.Round(goodsSubtotal + oceanFreight, 2);
        return new IncotermCostBreakdown(
            IncotermCode: IncotermCode,
            GoodsSubtotal: goodsSubtotal,
            OceanFreight: oceanFreight,
            MarineInsurance: 0,
            CustomsTax: 0,
            TotalAmount: total,
            RequiresFreight: true,
            RequiresInsurance: false,
            Description: $"CFR: Tiền hàng ${goodsSubtotal:N2} + Cước biển ${oceanFreight:N2} = ${total:N2}"
        );
    }
}

/// <summary>
/// EXW: Ex Works - Giao tại xưởng. Người mua tự lo toàn bộ chi phí vận chuyển.
/// </summary>
public class ExwIncotermStrategy : IIncotermPriceStrategy
{
    public string IncotermCode => "EXW";

    public IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance)
    {
        return new IncotermCostBreakdown(
            IncotermCode: IncotermCode,
            GoodsSubtotal: goodsSubtotal,
            OceanFreight: 0,
            MarineInsurance: 0,
            CustomsTax: 0,
            TotalAmount: goodsSubtotal,
            RequiresFreight: false,
            RequiresInsurance: false,
            Description: $"EXW: Giao tại xưởng Việt Nam. Tổng tiền hàng: ${goodsSubtotal:N2}"
        );
    }
}

/// <summary>
/// DDP: Delivered Duty Paid - Giao hàng đã thông quan và nộp thuế tại nước nhập khẩu.
/// </summary>
public class DdpIncotermStrategy : IIncotermPriceStrategy
{
    public string IncotermCode => "DDP";

    public IncotermCostBreakdown Calculate(decimal goodsSubtotal, decimal oceanFreight, decimal marineInsurance)
    {
        var customsTax = Math.Round((goodsSubtotal + oceanFreight + marineInsurance) * 0.08m, 2);
        var total = Math.Round(goodsSubtotal + oceanFreight + marineInsurance + customsTax, 2);
        return new IncotermCostBreakdown(
            IncotermCode: IncotermCode,
            GoodsSubtotal: goodsSubtotal,
            OceanFreight: oceanFreight,
            MarineInsurance: marineInsurance,
            CustomsTax: customsTax,
            TotalAmount: total,
            RequiresFreight: true,
            RequiresInsurance: true,
            Description: $"DDP: Hàng ${goodsSubtotal:N2} + Cước ${oceanFreight:N2} + Bảo hiểm ${marineInsurance:N2} + Thuế NK ước tính ${customsTax:N2} = ${total:N2}"
        );
    }
}
