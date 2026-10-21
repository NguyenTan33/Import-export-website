using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Data.SqlClient;
using WebXNK.Domain.Entities;
using WebXNK.Infrastructure.Persistence.Context;

namespace WebXNK.Infrastructure.Persistence.Seed;

public static class DbInitializer
{
    public static async Task InitializeAsync(WebXnkDbContext context, ILogger logger)
    {
        try
        {
            // Tự động kiểm tra và áp dụng Migration nếu CSDL chưa khởi tạo
            if (context.Database.IsSqlServer())
            {
                await context.Database.MigrateAsync();
                await context.Database.ExecuteSqlRawAsync(@"
                    IF COL_LENGTH('Products', 'ImageUrl') IS NULL
                    BEGIN
                        ALTER TABLE Products ADD ImageUrl NVARCHAR(MAX) NULL;
                    END

                    IF COL_LENGTH('Products', 'ImageUrlsJson') IS NULL
                    BEGIN
                        ALTER TABLE Products ADD ImageUrlsJson NVARCHAR(MAX) NULL;
                    END
                ");
            }

            await SeedRolesAsync(context);
            await SeedCurrenciesAsync(context);
            await SeedIncotermsAsync(context);
            await SeedWarehousesAsync(context);
            await SeedCategoriesAndProductsAsync(context);
            await EnsureProductDefaultImagesAsync(context);
            await SeedUsersAndSampleRfqAsync(context);

            await context.SaveChangesAsync();
            logger.LogInformation("Khởi tạo dữ liệu mẫu (Seed Data) thành công.");
        }
        catch (Exception ex)
        {
            // LocalDB may be unavailable on machines without the LocalDB runtime.
            // Keep the API process alive so the client can still start; database-backed
            // endpoints will become usable after the configured database is available
            // and the application is restarted.
            if (HasSqlException(ex))
            {
                logger.LogError(
                    ex,
                    "Không thể kết nối SQL Server khi chạy migration/seed. API vẫn khởi động; hãy kiểm tra ConnectionStrings:DefaultConnection và dịch vụ SQL Server/LocalDB, sau đó khởi động lại.");
                return;
            }

            logger.LogError(ex, "Lỗi không thể phục hồi trong quá trình nạp dữ liệu mẫu vào CSDL.");
            throw;
        }
    }

    private static bool HasSqlException(Exception exception)
    {
        for (var current = exception; current is not null; current = current.InnerException)
        {
            if (current is SqlException) return true;
        }

        return false;
    }

    private static async Task SeedRolesAsync(WebXnkDbContext context)
    {
        var requiredRoles = new (string Name, string Description)[]
        {
            ("Admin_Super", "Quản trị viên tối cao hệ thống"),
            ("Sales_Executive", "Chuyên viên kinh doanh xuất nhập khẩu B2B & B2C"),
            ("Warehouse_Manager", "Thủ kho quản lý kho Cát Lái và kho Bình Dương"),
            ("B2B_Buyer", "Khách hàng doanh nghiệp quốc tế (B2B Buyer)"),
            ("B2C_Customer", "Khách hàng lẻ mua trực tiếp (B2C Customer)")
        };

        var existingRoles = await context.Roles.Select(r => r.Name).ToListAsync();
        bool changed = false;

        foreach (var (name, desc) in requiredRoles)
        {
            if (!existingRoles.Contains(name))
            {
                context.Roles.Add(new Role { Name = name, Description = desc });
                changed = true;
            }
        }

        if (changed)
        {
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedCurrenciesAsync(WebXnkDbContext context)
    {
        if (await context.Currencies.AnyAsync()) return;

        var currencies = new List<Currency>
        {
            new() { Code = "USD", Name = "US Dollar", Symbol = "$", DecimalPlaces = 2, IsBaseCurrency = true, IsActive = true },
            new() { Code = "VND", Name = "Việt Nam Đồng", Symbol = "₫", DecimalPlaces = 0, IsBaseCurrency = false, IsActive = true },
            new() { Code = "EUR", Name = "Euro", Symbol = "€", DecimalPlaces = 2, IsBaseCurrency = false, IsActive = true },
            new() { Code = "JPY", Name = "Japanese Yen", Symbol = "¥", DecimalPlaces = 0, IsBaseCurrency = false, IsActive = true }
        };

        await context.Currencies.AddRangeAsync(currencies);
    }

    private static async Task SeedIncotermsAsync(WebXnkDbContext context)
    {
        if (await context.Incoterms.AnyAsync()) return;

        var incoterms = new List<Incoterm>
        {
            new() { Code = "FOB", Name = "Free On Board (Giao hàng lên tàu tại Cảng Cát Lái)", RequiresFreightCost = false, RequiresInsuranceCost = false },
            new() { Code = "CIF", Name = "Cost, Insurance and Freight (Giá hàng + Cước biển + Bảo hiểm)", RequiresFreightCost = true, RequiresInsuranceCost = true },
            new() { Code = "CFR", Name = "Cost and Freight (Giá hàng + Cước biển quốc tế)", RequiresFreightCost = true, RequiresInsuranceCost = false },
            new() { Code = "EXW", Name = "Ex Works (Giao tại xưởng Bình Dương)", RequiresFreightCost = false, RequiresInsuranceCost = false },
            new() { Code = "DDP", Name = "Delivered Duty Paid (Giao hàng đã nộp thuế tại nước nhập)", RequiresFreightCost = true, RequiresInsuranceCost = true }
        };

        await context.Incoterms.AddRangeAsync(incoterms);
    }

    private static async Task SeedWarehousesAsync(WebXnkDbContext context)
    {
        if (await context.Warehouses.AnyAsync()) return;

        var warehouses = new List<Warehouse>
        {
            new()
            {
                Code = "WH-BINHDUONG",
                Name = "Kho Tổng Sản Xuất & Lưu Trữ Bình Dương",
                WarehouseType = "FACTORY_CENTRAL",
                Address = "KCN VSIP 1, TP. Thuận An, Tỉnh Bình Dương",
                IsActive = true
            },
            new()
            {
                Code = "WH-CATLAI",
                Name = "Kho Cảng Cát Lái (Kho Ngoại Quan Xuất Khẩu)",
                WarehouseType = "PORT_BONDED",
                Address = "Cổng B Cảng Tân Cảng Cát Lái, Đ. Nguyễn Thị Định, P. Cát Lái, TP. Thủ Đức, TP. HCM",
                IsActive = true
            }
        };

        await context.Warehouses.AddRangeAsync(warehouses);
        await context.SaveChangesAsync();
    }

    private static async Task SeedCategoriesAndProductsAsync(WebXnkDbContext context)
    {
        if (await context.Categories.AnyAsync()) return;

        // 6 Danh mục cốt lõi của công ty xuất nhập khẩu
        var categories = new List<Category>
        {
            new()
            {
                Slug = "giay-dep-quan-ao",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Giày dép & Quần áo xuất khẩu", Description = "Sản phẩm may mặc và giày dép thời trang đạt tiêu chuẩn xuất khẩu EU/Mỹ" },
                    new() { LanguageCode = "en", Name = "Footwear & Apparel", Description = "Export-standard fashion apparel and footwear" }
                }
            },
            new()
            {
                Slug = "than-khong-khoi",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Than không khói", Description = "Than gáo dừa, than mùn cưa không khói xuất khẩu Trung Đông, Hàn Quốc, Nhật Bản" },
                    new() { LanguageCode = "en", Name = "Smokeless Charcoal", Description = "High calorie smokeless coconut and sawdust briquette charcoal" }
                }
            },
            new()
            {
                Slug = "can-choi-go",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Cán chổi gỗ", Description = "Cán chổi gỗ tiện tròn bọc màng nhựa PVC chống mối mọt xuất khẩu" },
                    new() { LanguageCode = "en", Name = "Wooden Broom Handles", Description = "Eucalyptus & Acacia wooden broom handles with PVC coated sleeve" }
                }
            },
            new()
            {
                Slug = "nong-san-xuat-khau",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Hàng nông sản", Description = "Hạt điều nhân xuất khẩu, hồ tiêu, cà phê Robusta, thanh long sấy" },
                    new() { LanguageCode = "en", Name = "Agricultural Products", Description = "Premium cashew nuts, black pepper, coffee beans and dried fruits" }
                }
            },
            new()
            {
                Slug = "bang-keo-dong-goi",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Băng keo công nghiệp", Description = "Băng keo OPP đóng gói thùng carton (trong, đục, in logo thương hiệu)" },
                    new() { LanguageCode = "en", Name = "OPP Packaging Tape", Description = "High adhesion OPP packing tape for industrial carton sealing" }
                }
            },
            new()
            {
                Slug = "mang-pe-stretch-film",
                Translations = new List<CategoryTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Màng PE quấn pallet", Description = "Màng co PE quấn tay và quấn máy bảo vệ hàng hóa xuất khẩu" },
                    new() { LanguageCode = "en", Name = "PE Stretch Film", Description = "Linear low-density PE stretch wrap film for pallet wrapping" }
                }
            }
        };

        await context.Categories.AddRangeAsync(categories);
        await context.SaveChangesAsync();

        // Nạp sản phẩm mẫu cho từng danh mục kèm quy cách đóng gói container (ExportPackaging)
        var products = new List<Product>
        {
            // 1. Giày dép & Quần áo
            new()
            {
                CategoryId = categories[0].Id,
                BaseSku = "SHOES-SNK-V1",
                HsCode = "6404.11.00",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 25.00m,
                ImageUrl = "/images/products/shoes-snk-v1.jpg",
                SpecificationsJson = "{\"Material\":\"Canvas/Rubber\",\"Gender\":\"Unisex\",\"Sizes\":\"38-44\",\"Packing\":\"1 pair/box, 12 boxes/carton\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Giày thể thao Sneaker xuất khẩu đế đúc", ShortDescription = "Giày vải canvas đế cao su lưu hóa tiêu chuẩn xuất khẩu" },
                    new() { LanguageCode = "en", Name = "Export Canvas Sneakers Molded Rubber Sole", ShortDescription = "Vulcanized rubber sole canvas sneakers for export" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 60m,
                    CartonWidthCm = 40m,
                    CartonHeightCm = 35m,
                    NetWeightKg = 9.6m,
                    GrossWeightKg = 11.2m,
                    PcsPerCarton = 12
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 120, MaxQuantity = 499, UnitPriceUsd = 22.00m, DiscountPercentage = 12 },
                    new() { MinQuantity = 500, MaxQuantity = 1999, UnitPriceUsd = 19.50m, DiscountPercentage = 22 },
                    new() { MinQuantity = 2000, MaxQuantity = null, UnitPriceUsd = 17.00m, DiscountPercentage = 32 }
                }
            },
            // 2. Than không khói
            new()
            {
                CategoryId = categories[1].Id,
                BaseSku = "CHAR-COCO-BBQ",
                HsCode = "4402.90.10",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 1.20m,
                ImageUrl = "/images/products/char-coco-bbq.jpg",
                SpecificationsJson = "{\"FixedCarbon\":\"75-80%\",\"Calorie\":\"7200-7500 kcal/kg\",\"Moisture\":\"< 5%\",\"Ash\":\"< 3%\",\"BurningTime\":\"3.5-4 hours\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Than gáo dừa nén lục giác không khói BBQ", ShortDescription = "Than sinh thái không mùi, không tia lửa, thời gian cháy 4 giờ" },
                    new() { LanguageCode = "en", Name = "Smokeless Coconut Briquette Charcoal Hexagon", ShortDescription = "Eco-friendly BBQ charcoal, long burning time, zero smoke" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 40m,
                    CartonWidthCm = 30m,
                    CartonHeightCm = 25m,
                    NetWeightKg = 10.0m,
                    GrossWeightKg = 10.6m,
                    PcsPerCarton = 10 // 10 hộp 1kg
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 500, MaxQuantity = 1999, UnitPriceUsd = 0.95m, DiscountPercentage = 20 },
                    new() { MinQuantity = 2000, MaxQuantity = null, UnitPriceUsd = 0.85m, DiscountPercentage = 29 }
                }
            },
            // 3. Cán chổi gỗ
            new()
            {
                CategoryId = categories[2].Id,
                BaseSku = "BROOM-EUC-120",
                HsCode = "4417.00.10",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 0.65m,
                ImageUrl = "/images/products/broom-euc-120.jpg",
                SpecificationsJson = "{\"Wood\":\"Eucalyptus / Acacia\",\"Length\":\"120cm\",\"Diameter\":\"2.2cm\",\"Coating\":\"PVC Shrink Pattern\",\"Cap\":\"Plastic hook\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Cán chổi gỗ bạch đàn 120cm bọc màng PVC", ShortDescription = "Tiện tròn mịn, sấy chống mốc mối mọt, bọc màng PVC vân gỗ kèm móc treo" },
                    new() { LanguageCode = "en", Name = "Eucalyptus Wooden Broom Handle 120cm PVC Coated", ShortDescription = "Sanded smooth, kiln dried, shrink PVC film with plastic hanging cap" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 122m,
                    CartonWidthCm = 25m,
                    CartonHeightCm = 25m,
                    NetWeightKg = 22.0m,
                    GrossWeightKg = 23.5m,
                    PcsPerCarton = 50
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 1000, MaxQuantity = 4999, UnitPriceUsd = 0.50m, DiscountPercentage = 23 },
                    new() { MinQuantity = 5000, MaxQuantity = null, UnitPriceUsd = 0.42m, DiscountPercentage = 35 }
                }
            },
            // 4. Hàng nông sản
            new()
            {
                CategoryId = categories[3].Id,
                BaseSku = "AGRI-CASHEW-W320",
                HsCode = "0801.32.00",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 8.50m,
                ImageUrl = "/images/products/cashew-w240-bp.jpg",
                SpecificationsJson = "{\"Grade\":\"W320\",\"Moisture\":\"< 5%\",\"Broken\":\"< 5%\",\"Packaging\":\"2 vacuum flexi tins (25lbs each) per carton\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Hạt điều nhân trắng xuất khẩu Grade W320", ShortDescription = "Hạt điều Bình Phước chất lượng cao đóng túi hút chân không xuất khẩu" },
                    new() { LanguageCode = "en", Name = "White Whole Cashew Nuts Grade W320 Export", ShortDescription = "Premium Vietnam cashew nuts packed in vacuum flexi-pouches" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 48m,
                    CartonWidthCm = 35m,
                    CartonHeightCm = 28m,
                    NetWeightKg = 22.68m,
                    GrossWeightKg = 24.2m,
                    PcsPerCarton = 2 // 2 túi 11.34kg
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 100, MaxQuantity = 499, UnitPriceUsd = 7.80m, DiscountPercentage = 8 },
                    new() { MinQuantity = 500, MaxQuantity = null, UnitPriceUsd = 7.20m, DiscountPercentage = 15 }
                }
            },
            // 5. Băng keo
            new()
            {
                CategoryId = categories[4].Id,
                BaseSku = "TAPE-OPP-48X100",
                HsCode = "3919.10.10",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 0.85m,
                ImageUrl = "/images/products/tape-opp-48x100.jpg",
                SpecificationsJson = "{\"Width\":\"48mm (2 inch)\",\"Length\":\"100 yard\",\"Thickness\":\"50 micron\",\"Film\":\"BOPP film with acrylic water adhesive\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Băng keo trong OPP dán thùng 48mm x 100 yards", ShortDescription = "Băng dính đóng gói độ dính cao 50 mic, quy cách 72 cuộn/thùng" },
                    new() { LanguageCode = "en", Name = "Clear OPP Carton Sealing Tape 48mm x 100y", ShortDescription = "Strong adhesion 50-micron packaging tape, 72 rolls per carton" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 33m,
                    CartonWidthCm = 33m,
                    CartonHeightCm = 30m,
                    NetWeightKg = 13.5m,
                    GrossWeightKg = 14.5m,
                    PcsPerCarton = 72
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 360, MaxQuantity = 1439, UnitPriceUsd = 0.65m, DiscountPercentage = 23 },
                    new() { MinQuantity = 1440, MaxQuantity = null, UnitPriceUsd = 0.55m, DiscountPercentage = 35 }
                }
            },
            // 6. Màng PE
            new()
            {
                CategoryId = categories[5].Id,
                BaseSku = "PE-FILM-50-17",
                HsCode = "3920.10.10",
                CountryOfOrigin = "VNM",
                DefaultRetailPriceUsd = 3.20m,
                ImageUrl = "/images/products/film-pe-pallet.jpg",
                SpecificationsJson = "{\"Width\":\"500mm\",\"Thickness\":\"17 micron\",\"WeightPerRoll\":\"2.8 kg\",\"CoreWeight\":\"0.3 kg\",\"Elongation\":\"300-350%\"}",
                Translations = new List<ProductTranslation>
                {
                    new() { LanguageCode = "vi", Name = "Màng PE quấn pallet tay 50cm độ dày 17 mic (Cuộn 2.8kg)", ShortDescription = "Màng chít bọc hàng độ dai cao, chống bụi bẩn chống ẩm xuất khẩu" },
                    new() { LanguageCode = "en", Name = "Manual PE Stretch Film 500mm 17 Mic (2.8kg Roll)", ShortDescription = "High tensile strength stretch wrap film for export pallet protection" }
                },
                ExportPackaging = new ExportPackaging
                {
                    CartonLengthCm = 35m,
                    CartonWidthCm = 25m,
                    CartonHeightCm = 52m,
                    NetWeightKg = 15.0m,
                    GrossWeightKg = 16.8m,
                    PcsPerCarton = 6
                },
                PriceTiers = new List<ProductPriceTier>
                {
                    new() { MinQuantity = 120, MaxQuantity = 479, UnitPriceUsd = 2.60m, DiscountPercentage = 18 },
                    new() { MinQuantity = 480, MaxQuantity = null, UnitPriceUsd = 2.25m, DiscountPercentage = 30 }
                }
            }
        };

        await context.Products.AddRangeAsync(products);
        await context.SaveChangesAsync();

        // Nạp sẵn tồn kho ban đầu vào Sổ cái (InventoryLedger) tại Kho Bình Dương
        var whBinhDuong = await context.Warehouses.FirstAsync(w => w.Code == "WH-BINHDUONG");

        var initialStockEntries = new List<InventoryLedger>
        {
            new()
            {
                WarehouseId = whBinhDuong.Id, // Kho Bình Dương
                ProductId = products[0].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 5000,
                ReferenceType = "MANUFACTURING_ORDER",
                ReferenceId = "MO-202609-001",
                Note = "Nhập kho sản xuất thành phẩm ban đầu",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                WarehouseId = whBinhDuong.Id,
                ProductId = products[1].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 15000,
                ReferenceType = "MANUFACTURING_ORDER",
                ReferenceId = "MO-202609-002",
                Note = "Nhập kho mẻ nung than gáo dừa",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                WarehouseId = whBinhDuong.Id,
                ProductId = products[2].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 20000,
                ReferenceType = "MANUFACTURING_ORDER",
                ReferenceId = "MO-202609-003",
                Note = "Nhập kho cán chổi thành phẩm",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                WarehouseId = whBinhDuong.Id,
                ProductId = products[3].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 2500,
                ReferenceType = "IMPORT_PROCUREMENT",
                ReferenceId = "PO-202609-CASHEW",
                Note = "Nhập thu mua hạt điều đạt chuẩn xuất khẩu",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                WarehouseId = whBinhDuong.Id,
                ProductId = products[4].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 10000,
                ReferenceType = "MANUFACTURING_ORDER",
                ReferenceId = "MO-202609-TAPE",
                Note = "Nhập kho dây chuyền phân cuộn băng keo OPP",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            },
            new()
            {
                WarehouseId = whBinhDuong.Id,
                ProductId = products[5].Id,
                TransactionType = "INITIAL_STOCK",
                QuantityChange = 3000,
                ReferenceType = "MANUFACTURING_ORDER",
                ReferenceId = "MO-202609-PE",
                Note = "Nhập kho màng thổi PE",
                CreatedBy = 1,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.InventoryLedger.AddRangeAsync(initialStockEntries);
        await context.SaveChangesAsync();
    }

    private static async Task EnsureProductDefaultImagesAsync(WebXnkDbContext context)
    {
        var defaultImageMap = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["SHOES-SNK-V1"] = "/images/products/shoes-snk-v1.jpg",
            ["CHAR-COCO-BBQ"] = "/images/products/char-coco-bbq.jpg",
            ["BROOM-EUC-120"] = "/images/products/broom-euc-120.jpg",
            ["AGRI-CASHEW-W320"] = "/images/products/cashew-w240-bp.jpg",
            ["CASHEW-W240-BP"] = "/images/products/cashew-w240-bp.jpg",
            ["TAPE-OPP-48X100"] = "/images/products/tape-opp-48x100.jpg",
            ["PE-FILM-50-17"] = "/images/products/film-pe-pallet.jpg",
            ["FILM-PE-PALLET"] = "/images/products/film-pe-pallet.jpg"
        };

        var productsWithoutImage = await context.Products
            .Where(p => p.ImageUrl == null || p.ImageUrl == "")
            .ToListAsync();

        if (productsWithoutImage.Count == 0) return;

        foreach (var p in productsWithoutImage)
        {
            if (defaultImageMap.TryGetValue(p.BaseSku, out var imgUrl))
            {
                p.ImageUrl = imgUrl;
            }
        }

        await context.SaveChangesAsync();
    }

    private static async Task SeedUsersAndSampleRfqAsync(WebXnkDbContext context)
    {
        // 1. Tạo hoặc đồng bộ tài khoản Admin Super
        var adminUser = await context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email == "admin@webxnk.com");

        var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Admin_Super");
        var salesRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Sales_Executive");
        var whRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "Warehouse_Manager");

        if (adminUser == null)
        {
            adminUser = new User
            {
                Email = "admin@webxnk.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456"),
                FullName = "Administrator Super",
                PhoneNumber = "+84901234567",
                IsEmailVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (adminRole != null) adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = adminRole });
            if (salesRole != null) adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = salesRole });
            if (whRole != null) adminUser.UserRoles.Add(new UserRole { User = adminUser, Role = whRole });

            await context.Users.AddAsync(adminUser);
            await context.SaveChangesAsync();
        }
        else
        {
            adminUser.IsActive = true;
            adminUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123456");
            adminUser.LockoutEnd = null;
            adminUser.AccessFailedCount = 0;

            if (adminRole != null && !adminUser.UserRoles.Any(ur => ur.RoleId == adminRole.Id))
                adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            if (salesRole != null && !adminUser.UserRoles.Any(ur => ur.RoleId == salesRole.Id))
                adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = salesRole.Id });
            if (whRole != null && !adminUser.UserRoles.Any(ur => ur.RoleId == whRole.Id))
                adminUser.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = whRole.Id });

            await context.SaveChangesAsync();
        }

        // 2. Tạo hoặc đồng bộ tài khoản Buyer B2B Nhật Bản và Công ty đối tác
        var buyerUser = await context.Users
            .Include(u => u.UserRoles)
            .Include(u => u.Company)
            .FirstOrDefaultAsync(u => u.Email == "buyer@tokyo-trading.jp");

        var b2bRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == "B2B_Buyer");
        Company? company = null;

        if (buyerUser == null)
        {
            buyerUser = new User
            {
                Email = "buyer@tokyo-trading.jp",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Buyer@123456"),
                FullName = "Kenji Sato",
                PhoneNumber = "+81312345678",
                IsEmailVerified = true,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            if (b2bRole != null) buyerUser.UserRoles.Add(new UserRole { User = buyerUser, Role = b2bRole });

            company = new Company
            {
                User = buyerUser,
                CompanyName = "TOKYO OVERSEAS LOGISTICS & TRADING CO., LTD.",
                TaxId = "JP-987654321",
                CountryCode = "JPN",
                Website = "https://tokyo-trading.co.jp",
                VerificationStatus = "VERIFIED",
                CreditLimit = 200000.00m,
                DefaultPaymentTerms = "T/T 30% Deposit, 70% against B/L copy",
                CreatedAt = DateTime.UtcNow
            };
            buyerUser.Company = company;

            await context.Users.AddAsync(buyerUser);
            await context.SaveChangesAsync();
        }
        else
        {
            buyerUser.IsActive = true;
            buyerUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Buyer@123456");
            buyerUser.LockoutEnd = null;
            buyerUser.AccessFailedCount = 0;

            if (b2bRole != null && !buyerUser.UserRoles.Any(ur => ur.RoleId == b2bRole.Id))
                buyerUser.UserRoles.Add(new UserRole { UserId = buyerUser.Id, RoleId = b2bRole.Id });

            company = buyerUser.Company ?? await context.Companies.FirstOrDefaultAsync(c => c.UserId == buyerUser.Id);
            await context.SaveChangesAsync();
        }

        // 3. Tạo Đơn Báo Giá Mẫu (Sample RFQ Request) nếu chưa có
        if (company != null && !await context.RfqRequests.AnyAsync(r => r.RfqNumber == "RFQ-2026-JP001"))
        {
            var products = await context.Products.Include(p => p.ExportPackaging).ToListAsync();
            if (products.Count >= 3)
            {
                var rfq = new RfqRequest
                {
                    RfqNumber = "RFQ-2026-JP001",
                    CompanyId = company.Id,
                    IncotermCode = "FOB",
                    PortOfLoading = "Cat Lai Port, Ho Chi Minh City",
                    PortOfDischarge = "Tokyo Port, Japan",
                    TargetDeliveryDate = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(45)),
                    PriceValidityUntil = DateOnly.FromDateTime(DateTime.UtcNow.AddDays(30)),
                    Status = "QUOTED",
                    TotalCbm = 38.5m,
                    TotalGrossWeightKg = 6750m,
                    SuggestedContainerType = "1x40ft High Cube (40HC)",
                    OceanFreightCostUsd = 0,
                    MarineInsuranceCostUsd = 0,
                    TotalQuotedAmountUsd = 28500.00m,
                    CreatedAt = DateTime.UtcNow
                };

                // Mặt hàng 1: Giày sneaker (1200 đôi)
                rfq.RfqItems.Add(new RfqItem
                {
                    ProductId = products[0].Id,
                    Quantity = 1200,
                    TargetPriceUsd = 18.00m,
                    QuotedUnitPriceUsd = 19.50m,
                    CalculatedCbm = 8.4m,
                    CustomRequirements = "Đóng thùng 5 lớp chống ẩm kèm hạt hút ẩm silica gel"
                });

                // Mặt hàng 2: Than không khói BBQ (5000 hộp)
                rfq.RfqItems.Add(new RfqItem
                {
                    ProductId = products[1].Id,
                    Quantity = 5000,
                    TargetPriceUsd = 0.80m,
                    QuotedUnitPriceUsd = 0.85m,
                    CalculatedCbm = 15.0m,
                    CustomRequirements = "In ấn bao bì thương hiệu Nhật Bản"
                });

                // Mặt hàng 3: Băng keo đóng gói (1440 cuộn)
                if (products.Count >= 5)
                {
                    rfq.RfqItems.Add(new RfqItem
                    {
                        ProductId = products[4].Id,
                        Quantity = 1440,
                        TargetPriceUsd = 0.50m,
                        QuotedUnitPriceUsd = 0.55m,
                        CalculatedCbm = 1.0m,
                        CustomRequirements = "Đóng 72 cuộn/thùng"
                    });
                }

                await context.RfqRequests.AddAsync(rfq);
                await context.SaveChangesAsync();
            }
        }
    }
}
