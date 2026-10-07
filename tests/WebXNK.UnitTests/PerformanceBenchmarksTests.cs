using System.Diagnostics;
using System.IO.Compression;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Caching.Memory;
using WebXNK.Application.Common.Incoterms;
using WebXNK.Application.Common.Logistics;
using WebXNK.Application.DTOs;
using WebXNK.Application.Services;
using Xunit;
using Xunit.Abstractions;

namespace WebXNK.UnitTests;

public class PerformanceBenchmarksTests
{
    private readonly ITestOutputHelper _output;
    private readonly IncotermsCalculationService _incotermsService;
    private readonly IncotermStrategyFactory _strategyFactory;
    private readonly CbmCalculatorService _cbmService;
    private readonly IMemoryCache _memoryCache;

    public PerformanceBenchmarksTests(ITestOutputHelper output)
    {
        _output = output;

        var strategies = new IIncotermPriceStrategy[]
        {
            new FobIncotermStrategy(),
            new CifIncotermStrategy(),
            new CfrIncotermStrategy(),
            new ExwIncotermStrategy(),
            new DdpIncotermStrategy()
        };

        _strategyFactory = new IncotermStrategyFactory(strategies);
        var freight = new OceanFreightEstimator();
        var insurance = new MarineInsuranceCalculator();
        _incotermsService = new IncotermsCalculationService(_strategyFactory, freight, insurance);

        // Service không phụ thuộc context khi tính toán CBM thuần túy
        _cbmService = new CbmCalculatorService(null!);
        _memoryCache = new MemoryCache(new MemoryCacheOptions());
    }

    [Fact]
    public async Task Benchmark_IncotermsQuoteEngine_HighThroughput()
    {
        const int iterations = 50_000;
        var request = new CalculateIncotermsQuoteRequestDto
        {
            IncotermCode = "CIF",
            PortOfLoading = "Cát Lái, Việt Nam",
            PortOfDischarge = "Hamburg, Germany",
            GoodsSubtotalUsd = 25000m,
            TotalCbm = 18.5m,
            TotalGrossWeightKg = 8200m
        };

        // Warmup
        for (int i = 0; i < 1_000; i++)
        {
            await _incotermsService.CalculateIncotermsQuoteAsync(request);
        }

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var res = await _incotermsService.CalculateIncotermsQuoteAsync(request);
            if (res.TotalQuotedAmountUsd <= 0) throw new InvalidOperationException();
        }
        sw.Stop();

        var elapsedMs = sw.Elapsed.TotalMilliseconds;
        var opsPerSec = Math.Round(iterations / (elapsedMs / 1000.0), 0);
        var avgMicroseconds = Math.Round((elapsedMs * 1000.0) / iterations, 2);

        _output.WriteLine("================================================================================");
        _output.WriteLine($"[BENCHMARK] Incoterms 2020 Strategy Engine: {iterations:N0} iterations");
        _output.WriteLine($"  - Tổng thời gian: {elapsedMs:F2} ms");
        _output.WriteLine($"  - Độ trễ trung bình: {avgMicroseconds} µs / phép tính");
        _output.WriteLine($"  - Throughput: {opsPerSec:N0} ops/sec");
        _output.WriteLine("================================================================================");

        Assert.True(opsPerSec > 10_000, $"Throughput {opsPerSec} ops/sec phải vượt mốc 10,000 ops/sec.");
    }

    [Fact]
    public void Benchmark_CbmContainerOptimizationEngine_HighThroughput()
    {
        const int iterations = 30_000;
        var request = new CalculateMultiItemCbmRequestDto
        {
            Items = new List<MultiItemCargoItemDto>
            {
                new() { ProductId = 1, ItemName = "Hạt điều rang muối XK", CartonLengthCm = 40, CartonWidthCm = 30, CartonHeightCm = 25, GrossWeightPerCartonKg = 12, TotalCartons = 400 },
                new() { ProductId = 2, ItemName = "Cà phê Robusta Đắk Lắk", CartonLengthCm = 50, CartonWidthCm = 40, CartonHeightCm = 30, GrossWeightPerCartonKg = 20, TotalCartons = 250 },
                new() { ProductId = 3, ItemName = "Hồ tiêu đen Chư Sê", CartonLengthCm = 35, CartonWidthCm = 25, CartonHeightCm = 20, GrossWeightPerCartonKg = 10, TotalCartons = 150 }
            },
            RequirePalletization = true,
            PalletType = "EURO_1200X800"
        };

        // Warmup
        for (int i = 0; i < 500; i++)
        {
            _cbmService.CalculateMultiItem(request);
        }

        var sw = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            var res = _cbmService.CalculateMultiItem(request);
            if (res.TotalCartons <= 0) throw new InvalidOperationException();
        }
        sw.Stop();

        var elapsedMs = sw.Elapsed.TotalMilliseconds;
        var opsPerSec = Math.Round(iterations / (elapsedMs / 1000.0), 0);
        var avgMicroseconds = Math.Round((elapsedMs * 1000.0) / iterations, 2);

        _output.WriteLine("================================================================================");
        _output.WriteLine($"[BENCHMARK] CBM Container & Pallet Packing Engine: {iterations:N0} iterations");
        _output.WriteLine($"  - Tổng thời gian: {elapsedMs:F2} ms");
        _output.WriteLine($"  - Độ trễ trung bình: {avgMicroseconds} µs / bài toán xếp cont");
        _output.WriteLine($"  - Throughput: {opsPerSec:N0} ops/sec");
        _output.WriteLine("================================================================================");

        Assert.True(opsPerSec > 5_000, $"Throughput {opsPerSec} ops/sec phải vượt mốc 5,000 ops/sec.");
    }

    [Fact]
    public void Benchmark_MemoryCache_Vs_SimulatedDb_Speedup()
    {
        const int iterations = 10_000;
        const string cacheKey = "ExchangeRate_USD_EUR";
        const decimal testRate = 0.92m;

        _memoryCache.Set(cacheKey, testRate, TimeSpan.FromMinutes(10));

        // 1. Đo MemoryCache hit (O(1) in-memory)
        var swCache = Stopwatch.StartNew();
        for (int i = 0; i < iterations; i++)
        {
            if (_memoryCache.TryGetValue(cacheKey, out decimal rate))
            {
                var converted = Math.Round(1000m * rate, 2);
                if (converted <= 0) throw new InvalidOperationException();
            }
        }
        swCache.Stop();
        var cacheMs = swCache.Elapsed.TotalMilliseconds;

        // 2. Đo mô phỏng độ trễ Database roundtrip tối thiểu (giả lập 0.5ms network/query per op)
        var simulatedDbMs = iterations * 0.5; // Giả lập độ trễ DB tối thiểu 0.5ms

        var speedupFactor = Math.Round(simulatedDbMs / Math.Max(cacheMs, 0.001), 1);
        var cacheLatencyMicrosec = Math.Round((cacheMs * 1000.0) / iterations, 3);

        _output.WriteLine("================================================================================");
        _output.WriteLine($"[BENCHMARK] In-Memory Caching vs Database Latency: {iterations:N0} lookups");
        _output.WriteLine($"  - In-Memory Cache total: {cacheMs:F2} ms ({cacheLatencyMicrosec} µs/lookup)");
        _output.WriteLine($"  - Ước tính Database trực tiếp: {simulatedDbMs:F2} ms");
        _output.WriteLine($"  - Tốc độ tăng tốc (Speedup Factor): {speedupFactor}x lần nhanh hơn!");
        _output.WriteLine("================================================================================");

        Assert.True(cacheMs < 100, $"In-memory caching {cacheMs} ms phải hoàn tất trong dưới 100ms cho 10,000 lượt.");
    }

    [Fact]
    public void Benchmark_PayloadCompression_Gzip_Brotli_Ratio()
    {
        // Tạo payload mẫu đại diện cho API Catalog / RFQ Response gồm 50 mặt hàng
        var sampleItems = new List<object>();
        for (int i = 1; i <= 50; i++)
        {
            sampleItems.Add(new
            {
                Id = i,
                BaseSku = $"VN-EXPORT-SKU-{i:D4}",
                NameVi = $"Sản phẩm Nông sản Việt Nam Chất Lượng Cao Hạng {i}",
                NameEn = $"Premium Vietnamese High Quality Agricultural Product Grade {i}",
                Description = "Sản phẩm đạt tiêu chuẩn xuất khẩu FDA Hoa Kỳ, GlobalGAP và ISO 22000:2018. Đóng gói thùng carton 5 lớp chuyên dụng xuất khẩu đường biển.",
                DefaultRetailPriceUsd = 15.5m + (i * 0.25m),
                HsCode = "08013200",
                OriginCountry = "Vietnam",
                IncotermsSupported = new[] { "FOB", "CIF", "CFR", "EXW" },
                Packaging = new
                {
                    CartonLengthCm = 45.0,
                    CartonWidthCm = 35.0,
                    CartonHeightCm = 28.0,
                    GrossWeightKg = 15.2,
                    PcsPerCarton = 24
                }
            });
        }

        var rawJson = JsonSerializer.Serialize(sampleItems);
        var rawBytes = Encoding.UTF8.GetBytes(rawJson);
        var rawSizeKb = Math.Round(rawBytes.Length / 1024.0, 2);

        // Gzip Compression
        var swGzip = Stopwatch.StartNew();
        byte[] gzipBytes;
        using (var msGzip = new MemoryStream())
        {
            using (var gzipStream = new GZipStream(msGzip, CompressionLevel.Fastest))
            {
                gzipStream.Write(rawBytes, 0, rawBytes.Length);
            }
            gzipBytes = msGzip.ToArray();
        }
        swGzip.Stop();
        var gzipSizeKb = Math.Round(gzipBytes.Length / 1024.0, 2);
        var gzipReduction = Math.Round((1.0 - ((double)gzipBytes.Length / rawBytes.Length)) * 100.0, 1);

        // Brotli Compression
        var swBrotli = Stopwatch.StartNew();
        byte[] brotliBytes;
        using (var msBrotli = new MemoryStream())
        {
            using (var brotliStream = new BrotliStream(msBrotli, CompressionLevel.Fastest))
            {
                brotliStream.Write(rawBytes, 0, rawBytes.Length);
            }
            brotliBytes = msBrotli.ToArray();
        }
        swBrotli.Stop();
        var brotliSizeKb = Math.Round(brotliBytes.Length / 1024.0, 2);
        var brotliReduction = Math.Round((1.0 - ((double)brotliBytes.Length / rawBytes.Length)) * 100.0, 1);

        _output.WriteLine("================================================================================");
        _output.WriteLine("[BENCHMARK] Response Compression (Gzip / Brotli) Payload Reduction");
        _output.WriteLine($"  - Raw JSON size: {rawBytes.Length:N0} bytes ({rawSizeKb} KB)");
        _output.WriteLine($"  - Gzip Compressed: {gzipBytes.Length:N0} bytes ({gzipSizeKb} KB) -> Giảm {gzipReduction}% payload ({swGzip.Elapsed.TotalMilliseconds:F3} ms)");
        _output.WriteLine($"  - Brotli Compressed: {brotliBytes.Length:N0} bytes ({brotliSizeKb} KB) -> Giảm {brotliReduction}% payload ({swBrotli.Elapsed.TotalMilliseconds:F3} ms)");
        _output.WriteLine("================================================================================");

        Assert.True(gzipReduction > 60.0, "Gzip phải giảm ít nhất 60% kích thước dữ liệu.");
        Assert.True(brotliReduction > 60.0, "Brotli phải giảm ít nhất 60% kích thước dữ liệu.");
    }
}
