using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Services.Documents.Templates;

public class PackingListModel
{
    public string DocumentNumber { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public RfqRequest Rfq { get; set; } = null!;
    public Company BuyerCompany { get; set; } = null!;
}

public class PackingListDocument : IDocument
{
    private readonly PackingListModel _model;

    public PackingListDocument(PackingListModel model)
    {
        _model = model;
    }

    public DocumentMetadata GetMetadata() => DocumentMetadata.Default;
    public DocumentSettings GetSettings() => DocumentSettings.Default;

    public void Compose(IDocumentContainer container)
    {
        container.Page(page =>
        {
            page.Size(PageSizes.A4);
            page.Margin(30);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(8.5f).FontColor("#1f2937"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(seller =>
                {
                    seller.Item().Text("WEBXNK GLOBAL EXPORT CO., LTD.").FontSize(13).Bold().FontColor("#1e3a8a");
                    seller.Item().Text("Cat Lai Port Logistics Center, Thu Duc City, Ho Chi Minh City, Vietnam");
                    seller.Item().Text("Tax Code: 0317898899 | Tel: (+84) 28 3742 8888 | Email: logistics@webxnk.com");
                });

                row.ConstantItem(180).AlignRight().Column(title =>
                {
                    title.Item().Text("PACKING LIST").FontSize(16).Bold().FontColor("#c2410c");
                    title.Item().Text($"P/L No: {_model.DocumentNumber}").Bold();
                    title.Item().Text($"Date: {_model.IssuedDate:dd/MM/yyyy}");
                    title.Item().Text($"Ref RFQ: {_model.Rfq.RfqNumber}");
                });
            });

            col.Item().PaddingVertical(6).LineHorizontal(1.5f).LineColor("#c2410c");
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            // 1. Bên nhận & Cảng biển
            col.Item().Row(row =>
            {
                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(6).Column(c =>
                {
                    c.Item().Text("CONSIGNEE:").Bold().FontColor("#c2410c");
                    c.Item().Text($"{_model.BuyerCompany.CompanyName}").Bold();
                    c.Item().Text($"Country: {_model.BuyerCompany.CountryCode} | Tax Code: {_model.BuyerCompany.TaxId}");
                });

                row.ConstantItem(8);

                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(6).Column(c =>
                {
                    c.Item().Text("SHIPPING & MARKS:").Bold().FontColor("#c2410c");
                    c.Item().Text($"Port of Loading: {_model.Rfq.PortOfLoading} (Cat Lai, VN)");
                    c.Item().Text($"Port of Discharge: {_model.Rfq.PortOfDischarge}");
                    c.Item().Text($"Shipping Marks: WEBXNK / {_model.BuyerCompany.CountryCode} / MADE IN VIETNAM").Bold();
                });
            });

            col.Item().Height(8);

            int totalCartons = 0;

            // 2. Bảng kê quy cách đóng gói (Packing Specifications)
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(22); // No
                    columns.RelativeColumn(3);  // Description
                    columns.ConstantColumn(35); // Pcs/Ctn
                    columns.ConstantColumn(42); // Cartons
                    columns.ConstantColumn(65); // Dimensions
                    columns.ConstantColumn(55); // Net Wt
                    columns.ConstantColumn(55); // Gross Wt
                    columns.ConstantColumn(50); // CBM
                });

                table.Header(header =>
                {
                    header.Cell().Background("#c2410c").Padding(4).Text("No").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).Text("Description of Goods").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignRight().Text("Pcs/Ctn").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignRight().Text("Cartons").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignCenter().Text("L x W x H (cm)").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignRight().Text("N.W (kg)").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignRight().Text("G.W (kg)").FontColor(Colors.White).Bold();
                    header.Cell().Background("#c2410c").Padding(4).AlignRight().Text("CBM (m³)").FontColor(Colors.White).Bold();
                });

                int idx = 1;
                decimal totalNet = 0;
                decimal totalGross = 0;
                decimal totalCbm = 0;

                foreach (var item in _model.Rfq.RfqItems)
                {
                    var packaging = item.Product?.ExportPackaging;
                    var pcsPerCarton = packaging?.PcsPerCarton > 0 ? packaging.PcsPerCarton : 1;
                    var cartons = (int)Math.Max(1, Math.Ceiling((decimal)item.Quantity / pcsPerCarton));

                    var length = packaging?.CartonLengthCm > 0 ? packaging.CartonLengthCm : 50m;
                    var width = packaging?.CartonWidthCm > 0 ? packaging.CartonWidthCm : 40m;
                    var height = packaging?.CartonHeightCm > 0 ? packaging.CartonHeightCm : 30m;
                    var netPerCtn = packaging?.NetWeightKg > 0 ? packaging.NetWeightKg : 9m;
                    var grossPerCtn = packaging?.GrossWeightKg > 0 ? packaging.GrossWeightKg : 10m;

                    var itemNet = Math.Round(netPerCtn * cartons, 2);
                    var itemGross = Math.Round(grossPerCtn * cartons, 2);
                    var cbmPerCtn = (length * width * height) / 1_000_000m;
                    var itemCbm = Math.Round(cbmPerCtn * cartons, 3);

                    totalCartons += cartons;
                    totalNet += itemNet;
                    totalGross += itemGross;
                    totalCbm += itemCbm;

                    var pName = item.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                             ?? item.Product?.BaseSku ?? $"Item #{item.ProductId}";

                    var bgColor = idx % 2 == 0 ? "#f9fafb" : "#ffffff";

                    table.Cell().Background(bgColor).Padding(3).Text(idx.ToString());
                    table.Cell().Background(bgColor).Padding(3).Text(pName);
                    table.Cell().Background(bgColor).Padding(3).AlignRight().Text(pcsPerCarton.ToString());
                    table.Cell().Background(bgColor).Padding(3).AlignRight().Text(cartons.ToString());
                    table.Cell().Background(bgColor).Padding(3).AlignCenter().Text($"{length:F0}x{width:F0}x{height:F0}");
                    table.Cell().Background(bgColor).Padding(3).AlignRight().Text($"{itemNet:N1}");
                    table.Cell().Background(bgColor).Padding(3).AlignRight().Text($"{itemGross:N1}");
                    table.Cell().Background(bgColor).Padding(3).AlignRight().Text($"{itemCbm:F3}");
                    idx++;
                }

                // Tổng kết toàn bộ kiện hàng
                table.Cell().ColumnSpan(3).Background("#ffedd5").Padding(4).AlignRight().Text("TOTALS:").Bold().FontColor("#c2410c");
                table.Cell().Background("#ffedd5").Padding(4).AlignRight().Text(totalCartons.ToString()).Bold();
                table.Cell().Background("#ffedd5").Padding(4).Text("");
                table.Cell().Background("#ffedd5").Padding(4).AlignRight().Text($"{totalNet:N1} kg").Bold();
                table.Cell().Background("#ffedd5").Padding(4).AlignRight().Text($"{totalGross:N1} kg").Bold();
                table.Cell().Background("#ffedd5").Padding(4).AlignRight().Text($"{totalCbm:F3} m³").Bold();
            });

            col.Item().Height(8);

            // 3. Phân bổ Container đóng gói
            col.Item().Border(1).BorderColor("#fed7aa").Background("#fff7ed").Padding(6).Column(c =>
            {
                c.Item().Text("CONTAINER PACKING OPTIMIZATION SUMMARY (EXP-64, EXP-65):").Bold().FontSize(8.5f).FontColor("#c2410c");
                c.Item().Text($"• Total Volume: {_model.Rfq.TotalCbm:F3} CBM | Total Gross Weight: {_model.Rfq.TotalGrossWeightKg:N1} KGS | Total Packages: {totalCartons} Cartons").FontSize(8);
                c.Item().Text($"• Recommended Container Configuration: {_model.Rfq.SuggestedContainerType ?? "1x40ft High Cube Container"}").Bold().FontSize(8.5f).FontColor("#1e3a8a");
                c.Item().Text("• Package Condition: Export-standard seaworthy 5-ply corrugated cartons with moisture-resistant PE liner.").FontSize(8);
            });

            col.Item().Height(10);

            // 4. Xác nhận thủ kho & Kiểm định đóng gói
            col.Item().Row(bottom =>
            {
                bottom.RelativeItem().Column(inspector =>
                {
                    inspector.Item().AlignCenter().Text("PACKING & WAREHOUSE SUPERVISOR").Bold().FontSize(8);
                    inspector.Item().Height(25);
                    inspector.Item().AlignCenter().Text("[CHECKED & APPROVED]").FontSize(8).Italic().FontColor("#9ca3af");
                    inspector.Item().AlignCenter().Text("CAT LAI EXPORT LOGISTICS HUB").FontSize(8);
                });

                bottom.ConstantItem(30);

                bottom.RelativeItem().Column(director =>
                {
                    director.Item().AlignCenter().Text("FOR AND ON BEHALF OF EXPORTER").Bold().FontSize(8);
                    director.Item().Height(25);
                    director.Item().AlignCenter().Text("[SIGNED & STAMPED]").FontSize(8).Italic().FontColor("#9ca3af");
                    director.Item().AlignCenter().Text("WEBXNK GLOBAL EXPORT CO., LTD.").Bold().FontSize(8);
                });
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Standard Packing List conforms to ICC International Maritime Cargo Regulations. Page ");
            x.CurrentPageNumber();
            x.Span(" / ");
            x.TotalPages();
        });
    }
}
