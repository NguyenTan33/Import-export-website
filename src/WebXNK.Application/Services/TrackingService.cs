using Microsoft.EntityFrameworkCore;
using WebXNK.Application.Common.Interfaces;
using WebXNK.Application.DTOs;
using WebXNK.Application.Interfaces;

namespace WebXNK.Application.Services;

public class TrackingService : ITrackingService
{
    private readonly IApplicationDbContext _context;

    public TrackingService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ShipmentTrackingDetailDto?> GetShipmentByTrackingNumberAsync(string trackingOrBlNumber, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(trackingOrBlNumber))
        {
            return null;
        }

        var normalized = trackingOrBlNumber.Trim().ToUpperInvariant();

        // 1. Tìm các bản ghi Milestone trong CSDL
        if (_context != null)
        {
            var milestones = await _context.ShipmentMilestones
                .AsNoTracking()
                .Include(m => m.RfqRequest)
                    .ThenInclude(r => r.RfqItems)
                        .ThenInclude(i => i.Product)
                            .ThenInclude(p => p.Translations)
                .Where(m => m.TrackingNumber.ToUpper() == normalized)
                .OrderBy(m => m.CreatedAt)
                .ToListAsync(cancellationToken);

            if (milestones.Count > 0)
            {
                var first = milestones.First();
                var rfq = first.RfqRequest;

                var result = new ShipmentTrackingDetailDto
                {
                    BlNumber = first.TrackingNumber,
                    BookingNumber = $"BKG-ONE-{Math.Abs(first.TrackingNumber.GetHashCode()) % 900000 + 100000}",
                    CarrierName = "Ocean Network Express (ONE)",
                    VesselName = !string.IsNullOrWhiteSpace(first.VesselName) ? first.VesselName : "ONE APUS",
                    VoyageNumber = !string.IsNullOrWhiteSpace(first.VoyageNumber) ? first.VoyageNumber : "088E",
                    ImoNumber = "9806079",
                    CallSign = "7KTI",
                    PortOfLoading = rfq?.PortOfLoading ?? "Cat Lai Port, Ho Chi Minh City (VN)",
                    PortOfLoadingVi = "Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
                    PortOfLoadingEn = "Cat Lai Port, Ho Chi Minh City (VN)",
                    PortOfDischarge = rfq?.PortOfDischarge ?? "Tokyo Port (JP)",
                    PortOfDischargeVi = "Cảng Tokyo (Nhật Bản)",
                    PortOfDischargeEn = "Tokyo Port (Japan)",
                    Etd = "2026-09-24 14:00",
                    Eta = first.EstimatedArrivalDate?.ToString("yyyy-MM-dd 08:00") ?? "2026-10-04 08:00",
                    CurrentCoordinates = new GeoCoordinatesDto { Lat = 21.85, Lng = 124.62 },
                    SpeedKnots = 18.4,
                    RouteProgressPercent = 65,
                    Containers = BuildContainersForRfq(rfq),
                    Milestones = milestones.Select(m => new ShipmentMilestoneDetailDto
                    {
                        Stage = m.MilestoneStatus,
                        TitleVi = m.Note ?? m.MilestoneStatus,
                        TitleEn = m.MilestoneStatus,
                        Location = m.CurrentLocation ?? "Cat Lai Port",
                        Timestamp = m.ActualDate?.ToString("yyyy-MM-dd HH:mm") ?? m.UpdatedAt.ToString("yyyy-MM-dd HH:mm"),
                        IsCompleted = m.ActualDate.HasValue,
                        IsCurrent = m.ActualDate == null
                    }).ToList()
                };

                return result;
            }
        }

        // 2. Nếu tìm theo mã mẫu chuẩn quốc tế QTH-BL-2026-JP01 hoặc khớp RFQ-2026-JP001
        if (normalized.Contains("QTH-BL-2026-JP01") || normalized.Contains("JP001") || normalized.Contains("JP01"))
        {
            return GetDefaultJapaneseShipment();
        }

        return null;
    }

    public async Task<List<ShipmentTrackingDetailDto>> GetActiveShipmentsAsync(CancellationToken cancellationToken = default)
    {
        var list = new List<ShipmentTrackingDetailDto>();

        if (_context != null)
        {
            var distinctTrackings = await _context.ShipmentMilestones
                .AsNoTracking()
                .Select(m => m.TrackingNumber)
                .Distinct()
                .ToListAsync(cancellationToken);

            foreach (var track in distinctTrackings)
            {
                var detail = await GetShipmentByTrackingNumberAsync(track, cancellationToken);
                if (detail != null)
                {
                    list.Add(detail);
                }
            }
        }

        if (list.Count == 0)
        {
            list.Add(GetDefaultJapaneseShipment());
        }

        return list;
    }

    private static List<ContainerDetailDto> BuildContainersForRfq(Domain.Entities.RfqRequest? rfq)
    {
        if (rfq == null || rfq.RfqItems.Count == 0)
        {
            return new List<ContainerDetailDto>
            {
                new()
                {
                    ContainerNumber = "ONEU-892145-0",
                    SizeType = "40HC",
                    SealNumber = "VN-CL-99218",
                    CargoDescription = "Hàng xuất khẩu đóng container 40HC",
                    CargoDescriptionVi = "Hàng xuất khẩu đóng container 40HC",
                    CargoDescriptionEn = "Export cargo 40HC container",
                    VgmWeightKg = 11200,
                    TareWeightKg = 3900,
                    Status = "On Sea",
                    StatusVi = "Đang trên biển",
                    StatusEn = "On Sea (Transiting)"
                }
            };
        }

        var containers = new List<ContainerDetailDto>();
        int count = 1;
        foreach (var item in rfq.RfqItems)
        {
            var pName = item.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "vi")?.Name 
                     ?? item.Product?.BaseSku 
                     ?? "Hàng xuất khẩu";

            containers.Add(new ContainerDetailDto
            {
                ContainerNumber = $"ONEU-89214{count}-0",
                SizeType = "40HC",
                SealNumber = $"VN-CL-9921{count}",
                CargoDescription = $"{pName} ({item.Quantity:N0} pcs)",
                CargoDescriptionVi = $"{pName} ({item.Quantity:N0} kiện)",
                CargoDescriptionEn = $"{item.Product?.BaseSku ?? "Export Goods"} ({item.Quantity:N0} pcs)",
                VgmWeightKg = Math.Max(5000, item.Quantity * 10),
                TareWeightKg = 3900,
                Status = "On Sea",
                StatusVi = "Đang trên biển",
                StatusEn = "On Sea (Transiting)"
            });
            count++;
        }

        return containers;
    }

    private static ShipmentTrackingDetailDto GetDefaultJapaneseShipment()
    {
        return new ShipmentTrackingDetailDto
        {
            BlNumber = "QTH-BL-2026-JP01",
            BookingNumber = "BKG-ONE-889102",
            CarrierName = "Ocean Network Express (ONE)",
            VesselName = "ONE APUS",
            VoyageNumber = "088E",
            ImoNumber = "9806079",
            CallSign = "7KTI",
            PortOfLoading = "Cat Lai Port, Ho Chi Minh City (VN)",
            PortOfLoadingVi = "Cảng Cát Lái, TP. Hồ Chí Minh (VN)",
            PortOfLoadingEn = "Cat Lai Port, Ho Chi Minh City (VN)",
            PortOfDischarge = "Tokyo Port (JP)",
            PortOfDischargeVi = "Cảng Tokyo (Nhật Bản)",
            PortOfDischargeEn = "Tokyo Port (Japan)",
            Etd = "2026-09-24 14:00",
            Eta = "2026-10-04 08:00",
            CurrentCoordinates = new GeoCoordinatesDto { Lat = 21.85, Lng = 124.62 },
            SpeedKnots = 18.4,
            RouteProgressPercent = 65,
            Containers = new List<ContainerDetailDto>
            {
                new()
                {
                    ContainerNumber = "ONEU-892145-0",
                    SizeType = "40HC",
                    SealNumber = "VN-CL-99218",
                    CargoDescription = "Giày thể thao Sneaker xuất khẩu đế đúc cao cấp (1,200 đôi / 100 CTNS)",
                    CargoDescriptionVi = "Giày thể thao Sneaker xuất khẩu đế đúc cao cấp (1,200 đôi / 100 thùng)",
                    CargoDescriptionEn = "Premium Molded Sole Sneaker Shoes for Export (1,200 pairs / 100 cartons)",
                    VgmWeightKg = 11200,
                    TareWeightKg = 3900,
                    Status = "Đang trên biển (On Sea)",
                    StatusVi = "Đang trên biển",
                    StatusEn = "On Sea (Transiting)"
                },
                new()
                {
                    ContainerNumber = "ONEU-892146-6",
                    SizeType = "40HC",
                    SealNumber = "VN-CL-99219",
                    CargoDescription = "Than không khói BBQ ép mùn cưa xuất khẩu (5,000 kg / 500 CTNS)",
                    CargoDescriptionVi = "Than không khói BBQ ép mùn cưa xuất khẩu (5,000 kg / 500 thùng)",
                    CargoDescriptionEn = "Sawdust Briquette Smokeless BBQ Charcoal (5,000 kg / 500 cartons)",
                    VgmWeightKg = 15400,
                    TareWeightKg = 3900,
                    Status = "Đang trên biển (On Sea)",
                    StatusVi = "Đang trên biển",
                    StatusEn = "On Sea (Transiting)"
                }
            },
            Milestones = new List<ShipmentMilestoneDetailDto>
            {
                new()
                {
                    Stage = "FACTORY_READY",
                    TitleVi = "Hoàn tất đóng thùng & Kiểm định tại Nhà máy",
                    TitleEn = "Factory Packaging & Quality Inspection",
                    Location = "Xưởng Quang Tấn Hoàng, KCN Sóng Thần, Bình Dương",
                    Timestamp = "2026-09-21 16:30",
                    IsCompleted = true,
                    IsCurrent = false,
                    NotesVi = "Kiểm tra độ ẩm đạt tiêu chuẩn xuất khẩu, đóng gói thùng carton 5 lớp chống sốc.",
                    NotesEn = "Moisture tested compliant with JIS export standards, packed in 5-ply shock-resistant cartons."
                },
                new()
                {
                    Stage = "CUSTOMS_CLEARED",
                    TitleVi = "Thông quan Hải quan Cảng Cát Lái",
                    TitleEn = "Export Customs Clearance at Cat Lai Port",
                    Location = "Hải quan Cửa khẩu Cảng Cát Lái, TP.HCM",
                    Timestamp = "2026-09-23 10:15",
                    IsCompleted = true,
                    IsCurrent = false,
                    NotesVi = "Phê duyệt Tờ khai Hải quan xuất khẩu luồng Xanh điện tử (VNACCS/VCIS).",
                    NotesEn = "Green channel electronic customs declaration approved on VNACCS/VCIS system."
                },
                new()
                {
                    Stage = "VESSEL_DEPARTED",
                    TitleVi = "Tàu bốc hàng & Rời Cảng Cát Lái (POL)",
                    TitleEn = "Vessel Loaded & Departed POL",
                    Location = "Cầu cảng TC01, Tân Cảng Cát Lái",
                    Timestamp = "2026-09-24 14:00",
                    IsCompleted = true,
                    IsCurrent = false,
                    NotesVi = "Hãng tàu ONE hoàn tất xếp container lên boong tàu ONE APUS, hành trình đi Tokyo.",
                    NotesEn = "Carrier ONE completed container stowing on ONE APUS, en route to Tokyo Port."
                },
                new()
                {
                    Stage = "ON_SEA",
                    TitleVi = "Tàu đang hành trình trên biển (Qua eo biển Đài Loan)",
                    TitleEn = "Vessel in Transit on High Seas",
                    Location = "Tọa độ 21.85° N, 124.62° E (Vùng biển quốc tế)",
                    Timestamp = "2026-09-29 08:30",
                    IsCompleted = false,
                    IsCurrent = true,
                    NotesVi = "Tàu di chuyển ổn định với tốc độ 18.4 hải lý/giờ. Dự kiến đến Cảng Tokyo ngày 04/10.",
                    NotesEn = "Cruising steadily at 18.4 knots. Estimated arrival at Tokyo Port on Oct 04, 2026."
                },
                new()
                {
                    Stage = "PORT_ARRIVED",
                    TitleVi = "Dự kiến Cập Cảng Đích Tokyo (POD)",
                    TitleEn = "Estimated Arrival at Destination Port",
                    Location = "Bến Aomi Container Terminal, Cảng Tokyo, Nhật Bản",
                    Timestamp = "2026-10-04 08:00 (Dự kiến)",
                    IsCompleted = false,
                    IsCurrent = false,
                    NotesVi = "Tiến hành thủ tục hoa tiêu và chuẩn bị dỡ hàng tại bến cảng Tokyo.",
                    NotesEn = "Pilotage scheduled, preparing for berth discharge at Aomi Terminal Tokyo."
                },
                new()
                {
                    Stage = "DELIVERED",
                    TitleVi = "Giao hàng cho Bên Nhập Khẩu",
                    TitleEn = "Final Delivery to Consignee",
                    Location = "Tokyo Overseas Logistics Warehouse, Yokohama",
                    Timestamp = "2026-10-06 (Dự kiến)",
                    IsCompleted = false,
                    IsCurrent = false,
                    NotesVi = "Bàn giao theo điều kiện FOB/CIF và đổi D/O lệnh giao hàng.",
                    NotesEn = "Delivery Order (D/O) handover to Tokyo Overseas Logistics."
                }
            }
        };
    }
}
