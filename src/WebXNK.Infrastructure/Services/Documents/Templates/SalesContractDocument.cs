using QuestPDF.Drawing;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using WebXNK.Domain.Entities;

namespace WebXNK.Infrastructure.Services.Documents.Templates;

public class SalesContractModel
{
    public SalesContract Contract { get; set; } = null!;
    public RfqRequest Rfq { get; set; } = null!;
    public Company BuyerCompany { get; set; } = null!;
    public List<RfqItem> Items { get; set; } = new();
}

public class SalesContractDocument : IDocument
{
    private readonly SalesContractModel _model;

    public SalesContractDocument(SalesContractModel model)
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
            page.Margin(32);
            page.PageColor(Colors.White);
            page.DefaultTextStyle(x => x.FontSize(8.5f).FontColor("#111827"));

            page.Header().Element(ComposeHeader);
            page.Content().Element(ComposeContent);
            page.Footer().Element(ComposeFooter);
        });
    }

    private void ComposeHeader(IContainer container)
    {
        container.Column(col =>
        {
            // Corporate Title & Flagship Header
            col.Item().Row(row =>
            {
                row.RelativeItem().Column(seller =>
                {
                    seller.Item().Text("CÔNG TY TNHH XUẤT NHẬP KHẨU QUANG TẤN HOÀNG").FontSize(11).Bold().FontColor("#0e4b94");
                    seller.Item().Text("QUANG TAN HOANG IMPORT-EXPORT CO., LTD.").FontSize(9).Bold().FontColor("#4b5563");
                    seller.Item().Text("Trụ sở: Số 88, Đường Số 7, KCN Sóng Thần 1, Dĩ An, Bình Dương, Việt Nam").FontSize(7.5f).FontColor("#6b7280");
                    seller.Item().Text("Tax Code: 0318992145 | Tel: (+84) 28 3742 8888 | Email: sales@quangtanhoang.vn").FontSize(7.5f).FontColor("#6b7280");
                });

                row.ConstantItem(200).AlignRight().Column(meta =>
                {
                    meta.Item().Text("SALES CONTRACT").FontSize(14).Bold().FontColor("#b91c1c");
                    meta.Item().Text("HỢP ĐỒNG NGOẠI THƯƠNG").FontSize(9).Bold().FontColor("#b91c1c");
                    meta.Item().Text($"No: {_model.Contract.ContractNumber}").FontSize(8.5f).Bold();
                    meta.Item().Text($"Date: {_model.Contract.CreatedAt:dd/MM/yyyy}").FontSize(8f);
                    meta.Item().Text($"Ref RFQ: #{_model.Rfq.RfqNumber}").FontSize(8f).FontColor("#6b7280");
                });
            });

            col.Item().PaddingTop(6).PaddingBottom(8).LineHorizontal(1.5f).LineColor("#0e4b94");
        });
    }

    private void ComposeContent(IContainer container)
    {
        container.Column(col =>
        {
            // Preamble
            col.Item().Text(text =>
            {
                text.Span("Hôm nay, ngày ");
                text.Span($"{_model.Contract.CreatedAt:dd/MM/yyyy}").Bold();
                text.Span(", hai bên đồng ý ký kết Hợp đồng mua bán quốc tế này theo mẫu chuẩn ICC Model International Sale Contract với các điều khoản dưới đây:\n(This International Sales Contract is entered into between the Seller and Buyer as follows):");
            });

            col.Item().Height(6);

            // Party Information: Seller & Buyer
            col.Item().Row(row =>
            {
                // The Seller
                row.RelativeItem().Border(0.8f).BorderColor("#cbd5e1").Padding(6).Column(s =>
                {
                    s.Item().Text("SELLER / BÊN BÁN (PARTY A):").Bold().FontColor("#0e4b94");
                    s.Item().Text(_model.Contract.SellerCompanyName).Bold();
                    s.Item().Text($"Address: {_model.Contract.SellerAddress}");
                    s.Item().Text($"Tax ID: {_model.Contract.SellerTaxCode}");
                    s.Item().Text($"Representative: {_model.Contract.SellerRepresentative} ({_model.Contract.SellerTitle})");
                });

                row.ConstantItem(8);

                // The Buyer
                row.RelativeItem().Border(0.8f).BorderColor("#cbd5e1").Padding(6).Column(b =>
                {
                    b.Item().Text("BUYER / BÊN MUA (PARTY B):").Bold().FontColor("#0e4b94");
                    b.Item().Text(_model.Contract.BuyerCompanyName).Bold();
                    b.Item().Text($"Address: {_model.Contract.BuyerAddress}");
                    b.Item().Text($"Tax ID / Reg No: {_model.Contract.BuyerTaxCode}");
                    b.Item().Text($"Representative: {_model.Contract.BuyerRepresentative} ({_model.Contract.BuyerTitle})");
                });
            });

            col.Item().Height(8);

            // Article 1: Commodity, Price & Quantity
            col.Item().Text("ARTICLE 1: COMMODITY, QUANTITY & TOTAL PRICE (MẶT HÀNG & GIÁ TRỊ)").Bold().FontColor("#0e4b94");
            col.Item().PaddingTop(3).Table(table =>
            {
                table.ColumnsDefinition(columns =>
                {
                    columns.ConstantColumn(24);
                    columns.RelativeColumn(3.5f);
                    columns.ConstantColumn(55);
                    columns.ConstantColumn(65);
                    columns.ConstantColumn(75);
                    columns.ConstantColumn(50);
                });

                // Table Header
                table.Header(header =>
                {
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignCenter().Text("#").Bold();
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).Text("Commodity Description").Bold();
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignRight().Text("Quantity").Bold();
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignRight().Text("Unit Price").Bold();
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignRight().Text("Amount (USD)").Bold();
                    header.Cell().Background("#f1f5f9").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignCenter().Text("CBM").Bold();
                });

                int idx = 1;
                foreach (var item in _model.Items)
                {
                    var price = item.QuotedUnitPriceUsd ?? item.TargetPriceUsd ?? 0;
                    var amount = item.Quantity * price;

                    var pName = item.Product?.Translations.FirstOrDefault(t => t.LanguageCode == "en")?.Name 
                             ?? item.Product?.Translations.FirstOrDefault()?.Name 
                             ?? item.Product?.BaseSku 
                             ?? $"Item #{item.ProductId}";
                    var sku = item.Product?.BaseSku ?? "QTH-EXP";

                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).AlignCenter().Text(idx.ToString());
                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).Column(desc =>
                    {
                        desc.Item().Text(pName).Bold();
                        desc.Item().Text($"SKU: {sku}").FontSize(7.5f).FontColor("#6b7280");
                    });
                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).AlignRight().Text($"{item.Quantity:N0}");
                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).AlignRight().Text($"${price:F2}");
                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).AlignRight().Text($"${amount:N2}").Bold();
                    table.Cell().Border(0.5f).BorderColor("#e2e8f0").Padding(4).AlignCenter().Text($"{item.CalculatedCbm:F2}");
                    idx++;
                }

                // Total Summary Row
                table.Cell().ColumnSpan(4).Background("#f8fafc").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignRight().Text("TOTAL CONTRACT VALUE (Incoterms 2020):").Bold();
                table.Cell().Background("#f8fafc").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignRight().Text($"${_model.Contract.TotalAmountUsd:N2} USD").Bold().FontColor("#b91c1c");
                table.Cell().Background("#f8fafc").Border(0.5f).BorderColor("#cbd5e1").Padding(4).AlignCenter().Text($"{_model.Rfq.TotalCbm:F2}").Bold();
            });

            col.Item().Height(8);

            // Article 2: Delivery & Shipping Terms
            col.Item().Text("ARTICLE 2: TERMS OF DELIVERY & SHIPMENT (ĐIỀU KIỆN GIAO HÀNG)").Bold().FontColor("#0e4b94");
            col.Item().PaddingTop(2).Column(art2 =>
            {
                art2.Item().Text($"• Trade Term: {_model.Contract.IncotermCode} (Incoterms® 2020)");
                art2.Item().Text($"• Port of Loading (POL): {_model.Contract.PortOfLoading}");
                art2.Item().Text($"• Port of Discharge (POD): {_model.Contract.PortOfDischarge}");
                art2.Item().Text($"• Target Delivery / Sailed Date: {_model.Contract.TargetDeliveryDate?.ToString("dd/MM/yyyy") ?? "Within 20 days after Deposit receipt"}");
                art2.Item().Text($"• Suggested Container Stowage: {_model.Rfq.SuggestedContainerType ?? "1x40ft High Cube (40HC)"} ({_model.Rfq.TotalGrossWeightKg:N0} kg GW)");
            });

            col.Item().Height(8);

            // Article 3: Payment Terms
            col.Item().Text("ARTICLE 3: PAYMENT TERMS (ĐIỀU KHOẢN THANH TOÁN QUỐC TẾ)").Bold().FontColor("#0e4b94");
            col.Item().PaddingTop(2).Column(art3 =>
            {
                art3.Item().Text($"• Payment Method: {_model.Contract.PaymentTerms}");
                art3.Item().Text("• Currency: USD (United States Dollars) via Telegraphic Transfer (T/T) or Irrevocable L/C at sight.");
                art3.Item().Text("• Beneficiary Bank: Joint Stock Commercial Bank for Foreign Trade of Vietnam (Vietcombank) - Swift: BFTVVNVX.");
            });

            col.Item().Height(8);

            // Article 4 & 5: Packing, Inspection & Arbitration
            col.Item().Text("ARTICLE 4: PACKING, INSPECTION & DISPUTE RESOLUTION (ĐÓNG GÓI, KIỂM ĐỊNH & TRỌNG TÀI)").Bold().FontColor("#0e4b94");
            col.Item().PaddingTop(2).Column(art4 =>
            {
                art4.Item().Text("• Packing: Standard export seaworthy 5-ply corrugated cartons, strapped and palletized to resist transoceanic sea voyage.");
                art4.Item().Text("• Quality & Weight Inspection: Final quality and phytosanitary certificate issued by SGS Vietnam or Vinacontrol at loading port.");
                art4.Item().Text("• Arbitration: Any dispute arising out of or in connection with this contract shall be settled amicably, failing which it shall be referred to the Vietnam International Arbitration Centre (VIAC) in Ho Chi Minh City or ICC Rules.");
            });

            col.Item().Height(10);

            // Digital Signatures Block
            col.Item().Row(signRow =>
            {
                // Seller Sign Box
                signRow.RelativeItem().Border(1).BorderColor("#cbd5e1").Padding(8).Column(sellerSign =>
                {
                    sellerSign.Item().AlignCenter().Text("FOR AND ON BEHALF OF SELLER").Bold().FontColor("#0e4b94");
                    sellerSign.Item().AlignCenter().Text("ĐẠI DIỆN BÊN BÁN").FontSize(7.5f).FontColor("#6b7280");

                    sellerSign.Item().Height(50).AlignCenter().Element(signBox =>
                    {
                        if (!string.IsNullOrEmpty(_model.Contract.SellerSignatureData))
                        {
                            try
                            {
                                var clean = _model.Contract.SellerSignatureData.Contains(",") 
                                    ? _model.Contract.SellerSignatureData.Split(',')[1] 
                                    : _model.Contract.SellerSignatureData;
                                var bytes = Convert.FromBase64String(clean);
                                signBox.Image(bytes);
                            }
                            catch
                            {
                                signBox.AlignCenter().Text("[SIGNED ELECTRONICALLY]").Bold().FontColor("#059669");
                            }
                        }
                        else
                        {
                            signBox.AlignCenter().Text("(Signature & Stamp / Ký & đóng dấu)").Italic().FontColor("#9ca3af");
                        }
                    });

                    sellerSign.Item().AlignCenter().Text(_model.Contract.SellerRepresentative).Bold();
                    sellerSign.Item().AlignCenter().Text(_model.Contract.SellerTitle).FontSize(7.5f).FontColor("#4b5563");
                    if (_model.Contract.SellerSignedAt.HasValue)
                    {
                        sellerSign.Item().AlignCenter().Text($"Signed: {_model.Contract.SellerSignedAt:dd/MM/yyyy HH:mm} (UTC)").FontSize(7f).FontColor("#059669");
                    }
                });

                signRow.ConstantItem(12);

                // Buyer Sign Box
                signRow.RelativeItem().Border(1).BorderColor("#cbd5e1").Padding(8).Column(buyerSign =>
                {
                    buyerSign.Item().AlignCenter().Text("FOR AND ON BEHALF OF BUYER").Bold().FontColor("#0e4b94");
                    buyerSign.Item().AlignCenter().Text("ĐẠI DIỆN BÊN MUA").FontSize(7.5f).FontColor("#6b7280");

                    buyerSign.Item().Height(50).AlignCenter().Element(signBox =>
                    {
                        if (!string.IsNullOrEmpty(_model.Contract.BuyerSignatureData))
                        {
                            try
                            {
                                var clean = _model.Contract.BuyerSignatureData.Contains(",") 
                                    ? _model.Contract.BuyerSignatureData.Split(',')[1] 
                                    : _model.Contract.BuyerSignatureData;
                                var bytes = Convert.FromBase64String(clean);
                                signBox.Image(bytes);
                            }
                            catch
                            {
                                signBox.AlignCenter().Text("[SIGNED ELECTRONICALLY]").Bold().FontColor("#059669");
                            }
                        }
                        else
                        {
                            signBox.AlignCenter().Text("(Authorized Signature / Đại diện ký tên)").Italic().FontColor("#9ca3af");
                        }
                    });

                    buyerSign.Item().AlignCenter().Text(string.IsNullOrEmpty(_model.Contract.BuyerRepresentative) ? _model.BuyerCompany.CompanyName : _model.Contract.BuyerRepresentative).Bold();
                    buyerSign.Item().AlignCenter().Text(string.IsNullOrEmpty(_model.Contract.BuyerTitle) ? "Authorized Buyer Representative" : _model.Contract.BuyerTitle).FontSize(7.5f).FontColor("#4b5563");
                    if (_model.Contract.BuyerSignedAt.HasValue)
                    {
                        buyerSign.Item().AlignCenter().Text($"Signed: {_model.Contract.BuyerSignedAt:dd/MM/yyyy HH:mm} (UTC)").FontSize(7f).FontColor("#059669");
                    }
                });
            });
        });
    }

    private void ComposeFooter(IContainer container)
    {
        container.Column(col =>
        {
            col.Item().LineHorizontal(0.5f).LineColor("#e2e8f0");
            col.Item().PaddingTop(4).Row(row =>
            {
                row.RelativeItem().Text(text =>
                {
                    text.Span("Legal Status: ").Bold();
                    text.Span(_model.Contract.Status == "LEGALLY_BINDING" ? "LEGALLY BINDING (ĐÃ KÝ KẾT HỢP PHÁP)" : "ELECTRONIC CONTRACT PENDING SIGNATURES").Bold().FontColor(_model.Contract.Status == "LEGALLY_BINDING" ? "#059669" : "#d97706");
                    text.Span($" • Verification Hash: {(_model.Contract.DigitalSignatureHash ?? "SHA256:PENDING_FINAL_SIGN").Substring(0, Math.Min(24, (_model.Contract.DigitalSignatureHash ?? "SHA256:PENDING").Length))}...");
                });

                row.ConstantItem(80).AlignRight().Text(x =>
                {
                    x.Span("Page ");
                    x.CurrentPageNumber();
                    x.Span(" of ");
                    x.TotalPages();
                });
            });
        });
    }
}
