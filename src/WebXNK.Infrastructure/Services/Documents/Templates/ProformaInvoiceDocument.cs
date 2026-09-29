using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Services.Documents.Templates;

public class ProformaInvoiceModel
{
    public string DocumentNumber { get; set; } = string.Empty;
    public DateOnly IssuedDate { get; set; }
    public RfqRequest Rfq { get; set; } = null!;
    public Company BuyerCompany { get; set; } = null!;
}

public class ProformaInvoiceDocument : IDocument
{
    private readonly ProformaInvoiceModel _model;

    public ProformaInvoiceDocument(ProformaInvoiceModel model)
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
                    seller.Item().Text("Head Office: Cat Lai Port Logistics Zone, Thu Duc City, Ho Chi Minh City, Vietnam");
                    seller.Item().Text("Tax Code: 0317898899 | Tel: (+84) 28 3742 8888 | Email: export@webxnk.com");
                    seller.Item().Text("Website: https://webxnk.vn | Certified: ISO 9001:2015 / HACCP");
                });

                row.ConstantItem(180).AlignRight().Column(title =>
                {
                    title.Item().Text("PROFORMA INVOICE").FontSize(16).Bold().FontColor("#b91c1c");
                    title.Item().Text($"P/I No: {_model.DocumentNumber}").Bold();
                    title.Item().Text($"Date: {_model.IssuedDate:dd/MM/yyyy}");
                    title.Item().Text($"Valid Until: {_model.Rfq.PriceValidityUntil:dd/MM/yyyy}");
                });
            });

            col.Item().PaddingVertical(8).LineHorizontal(1.5f).LineColor("#1e3a8a");
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            // 1. Thông tin Người mua (Buyer / Consignee) & Điều khoản Incoterms
            col.Item().Row(row =>
            {
                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(8).Column(buyer =>
                {
                    buyer.Item().Text("BUYER / APPLICANT:").Bold().FontColor("#1e3a8a");
                    buyer.Item().Text($"Company: {_model.BuyerCompany.CompanyName}").Bold();
                    buyer.Item().Text($"Country: {_model.BuyerCompany.CountryCode} | Tax ID: {_model.BuyerCompany.TaxId}");
                    buyer.Item().Text($"Web: {_model.BuyerCompany.Website ?? "N/A"}");
                    buyer.Item().Text($"Default Terms: {_model.BuyerCompany.DefaultPaymentTerms}");
                });

                row.ConstantItem(10); // Spacing

                row.RelativeItem().Border(1).BorderColor("#e5e7eb").Padding(8).Column(logistics =>
                {
                    logistics.Item().Text("SHIPPING & TRADE TERMS:").Bold().FontColor("#1e3a8a");
                    logistics.Item().Text($"Incoterms 2020: {_model.Rfq.IncotermCode} ({_model.Rfq.Incoterm?.Name ?? "Port of Loading"})").Bold();
                    logistics.Item().Text($"Port of Loading: {_model.Rfq.PortOfLoading} (Cat Lai, Vietnam)");
                    logistics.Item().Text($"Port of Discharge: {_model.Rfq.PortOfDischarge}");
                    logistics.Item().Text($"Suggested Container: {_model.Rfq.SuggestedContainerType ?? "20ft / 40ft HC"}");
                });
            });

            col.Item().Height(10);

            // 2. Bảng kê sản phẩm xuất khẩu
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

                // Header
                table.Header(header =>
                {
                    header.Cell().Background("#1e3a8a").Padding(5).Text("No").FontColor(Colors.White).Bold();
                    header.Cell().Background("#1e3a8a").Padding(5).Text("HS Code").FontColor(Colors.White).Bold();
                    header.Cell().Background("#1e3a8a").Padding(5).Text("Description of Goods").FontColor(Colors.White).Bold();
                    header.Cell().Background("#1e3a8a").Padding(5).AlignRight().Text("Qty").FontColor(Colors.White).Bold();
                    header.Cell().Background("#1e3a8a").Padding(5).AlignRight().Text("Unit Price").FontColor(Colors.White).Bold();
                    header.Cell().Background("#1e3a8a").Padding(5).AlignRight().Text("Total USD").FontColor(Colors.White).Bold();
                });

                // Rows
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

                // Summary rows
                table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("Subtotal:").Bold();
                table.Cell().Padding(4).AlignRight().Text($"${subtotal:F2}").Bold();

                if (_model.Rfq.OceanFreightCostUsd > 0)
                {
                    table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("Ocean Freight (Sea):");
                    table.Cell().Padding(4).AlignRight().Text($"${_model.Rfq.OceanFreightCostUsd:F2}");
                }

                if (_model.Rfq.MarineInsuranceCostUsd > 0)
                {
                    table.Cell().ColumnSpan(5).Padding(4).AlignRight().Text("Marine Cargo Insurance:");
                    table.Cell().Padding(4).AlignRight().Text($"${_model.Rfq.MarineInsuranceCostUsd:F2}");
                }

                var grandTotal = _model.Rfq.TotalQuotedAmountUsd > 0 ? _model.Rfq.TotalQuotedAmountUsd : subtotal;
                table.Cell().ColumnSpan(5).Background("#f1f5f9").Padding(5).AlignRight().Text($"GRAND TOTAL ({_model.Rfq.IncotermCode} USD):").FontSize(10).Bold().FontColor("#1e3a8a");
                table.Cell().Background("#f1f5f9").Padding(5).AlignRight().Text($"${grandTotal:F2}").FontSize(10).Bold().FontColor("#b91c1c");
            });

            col.Item().Height(10);

            // 3. Thông số Logistics CBM & Container
            col.Item().Border(1).BorderColor("#cbd5e1").Background("#f8fafc").Padding(6).Row(cbm =>
            {
                cbm.RelativeItem().Text($"Total CBM: {_model.Rfq.TotalCbm:F3} m³").Bold();
                cbm.RelativeItem().Text($"Gross Weight: {_model.Rfq.TotalGrossWeightKg:N1} KGS").Bold();
                cbm.RelativeItem().Text($"Container: {_model.Rfq.SuggestedContainerType ?? "FCL / LCL"}").Bold().FontColor("#1e3a8a");
            });

            col.Item().Height(10);

            // 4. Ngân hàng thanh toán quốc tế & Chữ ký
            col.Item().Row(bottom =>
            {
                bottom.RelativeItem(3).Border(1).BorderColor("#e5e7eb").Padding(6).Column(bank =>
                {
                    bank.Item().Text("INTERNATIONAL REMITTANCE BANK DETAILS:").Bold().FontSize(8).FontColor("#1e3a8a");
                    bank.Item().Text("Beneficiary: WEBXNK GLOBAL EXPORT CO., LTD.").FontSize(8);
                    bank.Item().Text("Bank Name: JOINT STOCK COMMERCIAL BANK FOR FOREIGN TRADE OF VIETNAM (VIETCOMBANK)").FontSize(8);
                    bank.Item().Text("SWIFT Code: BFTVVNVX001 | Account (USD): 0071001234567").FontSize(8).Bold();
                    bank.Item().Text("Payment Terms: 30% T/T Advance Deposit, 70% against Bill of Lading copy").FontSize(8);
                });

                bottom.ConstantItem(15);

                bottom.RelativeItem(2).Column(sig =>
                {
                    sig.Item().AlignCenter().Text("FOR AND ON BEHALF OF SELLER").Bold().FontSize(8);
                    sig.Item().Height(30); // Dấu mộc / chữ ký
                    sig.Item().AlignCenter().Text("[SIGNED & STAMPED]").FontSize(8).Italic().FontColor("#9ca3af");
                    sig.Item().AlignCenter().Text("WEBXNK GLOBAL EXPORT CO., LTD.").Bold().FontSize(8);
                });
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.AlignCenter().Text(x =>
        {
            x.Span("This document is generated digitally according to ICC International Trade Practice. Page ");
            x.CurrentPageNumber();
            x.Span(" / ");
            x.TotalPages();
        });
    }
}
