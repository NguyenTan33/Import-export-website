namespace WebXNK.Application.DTOs;

public class ShipmentMilestoneDetailDto
{
    public string Stage { get; set; } = string.Empty; // FACTORY_READY, CUSTOMS_CLEARED, VESSEL_DEPARTED, ON_SEA, PORT_ARRIVED, DELIVERED
    public string TitleVi { get; set; } = string.Empty;
    public string TitleEn { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string Timestamp { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public bool IsCurrent { get; set; }
    public string? NotesVi { get; set; }
    public string? NotesEn { get; set; }
}

public class ContainerDetailDto
{
    public string ContainerNumber { get; set; } = string.Empty;
    public string SizeType { get; set; } = "40HC"; // 20GP, 40GP, 40HC
    public string SealNumber { get; set; } = string.Empty;
    public string CargoDescription { get; set; } = string.Empty;
    public string? CargoDescriptionVi { get; set; }
    public string? CargoDescriptionEn { get; set; }
    public decimal VgmWeightKg { get; set; }
    public decimal TareWeightKg { get; set; }
    public string Status { get; set; } = "On Sea";
    public string? StatusVi { get; set; }
    public string? StatusEn { get; set; }
}

public class GeoCoordinatesDto
{
    public double Lat { get; set; }
    public double Lng { get; set; }
}

public class ShipmentTrackingDetailDto
{
    public string BlNumber { get; set; } = string.Empty;
    public string BookingNumber { get; set; } = string.Empty;
    public string CarrierName { get; set; } = string.Empty;
    public string VesselName { get; set; } = string.Empty;
    public string VoyageNumber { get; set; } = string.Empty;
    public string ImoNumber { get; set; } = string.Empty;
    public string CallSign { get; set; } = string.Empty;
    public string PortOfLoading { get; set; } = string.Empty;
    public string? PortOfLoadingVi { get; set; }
    public string? PortOfLoadingEn { get; set; }
    public string PortOfDischarge { get; set; } = string.Empty;
    public string? PortOfDischargeVi { get; set; }
    public string? PortOfDischargeEn { get; set; }
    public string Etd { get; set; } = string.Empty;
    public string Eta { get; set; } = string.Empty;
    public GeoCoordinatesDto? CurrentCoordinates { get; set; }
    public double? SpeedKnots { get; set; }
    public int RouteProgressPercent { get; set; }
    public List<ContainerDetailDto> Containers { get; set; } = new();
    public List<ShipmentMilestoneDetailDto> Milestones { get; set; } = new();
}
