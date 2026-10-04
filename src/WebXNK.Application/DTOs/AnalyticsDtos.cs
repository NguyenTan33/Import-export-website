namespace WebXNK.Application.DTOs;

public class MarketAnalyticsDto
{
    public string Country { get; set; } = string.Empty;
    public string Port { get; set; } = string.Empty;
    public string Flag { get; set; } = string.Empty;
    public decimal RevenueUsd { get; set; }
    public decimal Percent { get; set; }
    public string Containers { get; set; } = string.Empty;
    public string Growth { get; set; } = string.Empty;
}

public class FunnelStageAnalyticsDto
{
    public string Name { get; set; } = string.Empty;
    public int Count { get; set; }
    public decimal Percent { get; set; }
    public string Color { get; set; } = "bg-[#0E4B94]";
}

public class ExportAnalyticsResponseDto
{
    public decimal TotalB2bUsd { get; set; }
    public decimal TotalB2cUsd { get; set; }
    public decimal GrandTotalUsd { get; set; }
    public string ActiveContainersCount { get; set; } = "4x40HC, 2x20GP";
    public int PendingRfqCount { get; set; }
    public List<MarketAnalyticsDto> TopMarkets { get; set; } = new();
    public List<FunnelStageAnalyticsDto> PipelineFunnel { get; set; } = new();
}
