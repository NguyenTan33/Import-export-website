using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Services.Documents.Templates;

public class CommercialInvoiceModel
{
    public string DocumentNumber { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public RfqRequest Rfq { get; set; } = null!;
    public Company BuyerCompany { get; set; } = null!;
}

public class CommercialInvoiceDocument : IDocument
{
    private readonly CommercialInvoiceModel _model;

    public CommercialInvoiceDocument(CommercialInvoiceModel model)
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
            page.Margin(35);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(9).FontColor("#1f2937"));

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
                    seller.Item().Text("WEBXNK GLOBAL EXPORT CO., LTD.").FontSize(14).Bold().FontColor("#1e3a8a");
                    seller.Item().Text("Cat Lai Port Logistics Complex, Nguyen Thi Dinh Str, Ho Chi Minh City, Vietnam");
                    seller.Item().Text("Tax Code: 0317898899 | Tel: (+84) 28 3742 8888 | Email: customsclearance@webxnk.com");
                });

                row.ConstantItem(190).AlignRight().Column(title =>
                {
                    title.Item().Text("COMMERCIAL INVOICE").FontSize(15).Bold().FontColor("#15803d");
                    title.Item().Text($"Invoice No: {_model.DocumentNumber}").Bold();
                    title.Item().Text($"Date: {_model.IssuedDate:dd/MM/yyyy}");
                    title.Item().Text($"Contract/RFQ: {_model.Rfq.RfqNumber}");
                });
            });

            col.Item().PaddingVertical(8).LineHorizontal(1.5f).LineColor("#15803d");
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            // 1. Shipper & Consignee
            col.Item().Row(row =>
            {
                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(8).Column(c =>
                {
                    c.Item().Text("CONSIGNEE / IMPORTER:").Bold().FontColor("#15803d");
                    c.Item().Text($"{_model.BuyerCompany.CompanyName}").Bold();
                    c.Item().Text($"Country: {_model.BuyerCompany.CountryCode} | Tax Code: {_model.BuyerCompany.TaxId}");
                    c.Item().Text($"Payment Term: {_model.BuyerCompany.DefaultPaymentTerms}");
                });

                row.ConstantItem(10);

                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(8).Column(c =>
                {
                    c.Item().Text("SHIPMENT & TRANSPORT DETAILS:").Bold().FontColor("#15803d");
                    c.Item().Text($"Trade Terms: Incoterms 2020 {_model.Rfq.IncotermCode}").Bold();
                    c.Item().Text($"Port of Loading: {_model.Rfq.PortOfLoading} (Cat Lai, Vietnam)");
                    c.Item().Text($"Port of Discharge: {_model.Rfq.PortOfDischarge}");
                    c.Item().Text($"Container: {_model.Rfq.SuggestedContainerType ?? "Full Container Load"}");
                });
            });

            col.Item().Height(10);

            // 2. Chi tiết hàng hóa xuất khẩu
            col.Item().Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(25);  // No
                    columns.ConstantColumn(65);  // HS Code
                    columns.RelativeColumn(3);   // Description
                    columns.ConstantColumn(45);  // Qty
                    columns.ConstantColumn(55);  // Unit Price
                    columns.ConstantColumn(65);  // Total USD
                });

                table.Header(header =>
                {
                    header.Cell().Background("#15803d").Padding(5).Text("No").FontColor(Colors.White).Bold();
                    header.Cell().Background("#15803d").Padding(5).Text("HS Code").FontColor(Colors.White).Bold();
                    header.Cell().Background("#15803d").Padding(5).Text("Description of Goods").FontColor(Colors.White).Bold();
                    header.Cell().Background("#15803d").Padding(5).AlignRight().Text("Qty").FontColor(Colors.White).Bold();
                    header.Cell().Background("#15803d").Padding(5).AlignRight().Text("Unit (USD)").FontColor(Colors.White).Bold();
                    header.Cell().Background("#15803d").Padding(5).AlignRight().Text("Total (USD)").FontColor(Colors.White).Bold();
                });

                int idx = 1;
                decimal subtotal = 0;
                foreach (var item in _model.Rfq.RfqItems)
                {
                    var pName = item.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                             ?? item.Product?.Translations.FirstOrDefault()?.Name 
                             ?? item.Product?.BaseSku ?? $"Item #{item.ProductId}";
                    var hsCode = item.Product?.HsCode ?? "N/A";
                    var unitPrice = item.QuotedUnitPriceUsd ?? item.TargetPriceUsd ?? item.Product?.DefaultRetailPriceUsd ?? 0;
                    var rowTotal = item.Quantity * unitPrice;
                    subtotal += rowTotal;

                    var bgColor = idx % 2 == 0 ? "#f9fafb" : "#ffffff";

                    table.Cell().Background(bgColor).Padding(4).Text(idx.ToString());
                    table.Cell().Background(bgColor).Padding(4).Text(hsCode);
                    table.Cell().Background(bgColor).Padding(4).Text(pName);
                    table.Cell().Background(bgColor).Padding(4).AlignRight().Text(item.Quantity.ToString("N0"));
                    table.Cell().Background(bgColor).Padding(4).AlignRight().Text($"${unitPrice:F2}");
                    table.Cell().Background(bgColor).Padding(4).AlignRight().Text($"${rowTotal:F2}").Bold();
                    idx++;
                }

                table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("FOB Value Subtotal:").Bold();
                table.Cell().Padding(4).AlignRight().Text($"${subtotal:F2}").Bold();

                if (_model.Rfq.OceanFreightCostUsd > 0)
                {
                    table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("Ocean Freight (Sea):");
                    table.Cell().Padding(4).AlignRight().Text($"${_model.Rfq.OceanFreightCostUsd:F2}");
                }

                if (_model.Rfq.MarineInsuranceCostUsd > 0)
                {
                    table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("Marine Insurance:");
                    table.Cell().Padding(4).AlignRight().Text($"${_model.Rfq.MarineInsuranceCostUsd:F2}");
                }

                var grandTotal = _model.Rfq.TotalQuotedAmountUsd > 0 ? _model.Rfq.TotalQuotedAmountUsd : subtotal;
                table.Cell().ColumnSpan(5).Background("#ecfdf5").Padding(5).AlignRight().Text($"TOTAL INVOICE AMOUNT ({_model.Rfq.IncotermCode} USD):").FontSize(10).Bold().FontColor("#15803d");
                table.Cell().Background("#ecfdf5").Padding(5).AlignRight().Text($"${grandTotal:F2}").FontSize(10).Bold().FontColor("#15803d");
            });

            col.Item().Height(8);

            // 3. Tuyên thệ chuẩn xuất xứ ICC
            col.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(6).Column(c =>
            {
                c.Item().Text("ORIGIN DECLARATION (ICC COMPLIANCE):").Bold().FontSize(8);
                c.Item().Text("We hereby certify that this invoice is true and correct, and that the goods mentioned above are manufactured and originated in VIETNAM according to international rules of origin.").FontSize(8).Italic();
            });

            col.Item().Height(10);

            // 4. Ngân hàng thanh toán & Chữ ký
            col.Item().Row(bottom =>
            {
                bottom.RelativeItem(3).Border(1).BorderColor("#e5e7eb").Padding(6).Column(bank =>
                {
                    bank.Item().Text("OFFICIAL BANK FOR TELEGRAPHIC TRANSFER (T/T):").Bold().FontSize(8).FontColor("#15803d");
                    bank.Item().Text("Account Name: WEBXNK GLOBAL EXPORT CO., LTD.").FontSize(8);
                    bank.Item().Text("Bank: VIETCOMBANK - HO CHI MINH CITY BRANCH").FontSize(8);
                    bank.Item().Text("SWIFT Code: BFTVVNVX001 | USD Account: 0071001234567").FontSize(8).Bold();
                });

                bottom.ConstantItem(15);

                bottom.RelativeItem(2).Column(sig =>
                {
                    sig.Item().AlignCenter().Text("AUTHORIZED SIGNATURE & STAMP").Bold().FontSize(8);
                    sig.Item().Height(30);
                    sig.Item().AlignCenter().Text("[SIGNED & STAMPED]").FontSize(8).Italic().FontColor("#9ca3af");
                    sig.Item().AlignCenter().Text("DIRECTOR OF EXPORT OPERATIONS").Bold().FontSize(8);
                });
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("Commercial Invoice issued under Uniform Customs and Practice for Documentary Credits (ICC UCP 600). Page ");
            x.CurrentPageNumber();
            x.Span(" / ");
            x.TotalPages();
        });
    }
}
