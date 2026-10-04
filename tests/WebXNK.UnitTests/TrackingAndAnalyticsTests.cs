using WebXNK.Application.DTOs;
using WebXNK.Application.Services;
using Xunit;

namespace WebXNK.UnitTests;

public class TrackingAndAnalyticsTests
{
    private readonly TrackingService _trackingService;

    public TrackingAndAnalyticsTests()
    {
        // TrackingService fallback test khi context trống
        _trackingService = new TrackingService(null!);
    }

    [Fact]
    public async Task GetShipmentByTrackingNumber_WhenSampleBl_ShouldReturnCompleteVesselTimeline()
    {
        var result = await _trackingService.GetShipmentByTrackingNumberAsync("QTH-BL-2026-JP01");

        Assert.NotNull(result);
        Assert.Equal("QTH-BL-2026-JP01", result.BlNumber);
        Assert.Equal("ONE APUS", result.VesselName);
        Assert.Equal("088E", result.VoyageNumber);
        Assert.NotEmpty(result.Containers);
        Assert.NotEmpty(result.Milestones);
        Assert.Contains(result.Milestones, m => m.Stage == "FACTORY_READY" && m.IsCompleted);
        Assert.Contains(result.Milestones, m => m.Stage == "CUSTOMS_CLEARED" && m.IsCompleted);
        Assert.Contains(result.Milestones, m => m.Stage == "ON_SEA" && m.IsCurrent);
    }

    [Fact]
    public async Task GetActiveShipments_ShouldReturnAtLeastOneActiveVoyage()
    {
        var shipments = await _trackingService.GetActiveShipmentsAsync();

        Assert.NotNull(shipments);
        Assert.NotEmpty(shipments);
        Assert.Equal("ONE APUS", shipments[0].VesselName);
    }

    [Fact]
    public async Task GetExportAnalytics_ShouldReturnCorrectBreakdown()
    {
        var analyticsService = new AnalyticsService(null!);
        var analytics = await analyticsService.GetExportAnalyticsAsync();

        Assert.NotNull(analytics);
        Assert.True(analytics.TotalB2bUsd > 0);
        Assert.True(analytics.TotalB2cUsd > 0);
        Assert.Equal(analytics.TotalB2bUsd + analytics.TotalB2cUsd, analytics.GrandTotalUsd);
        Assert.NotEmpty(analytics.TopMarkets);
        Assert.NotEmpty(analytics.PipelineFunnel);
    }
}
