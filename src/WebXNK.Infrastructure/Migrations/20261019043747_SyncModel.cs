using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebXNK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Products",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "RfqCounterOffers",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RfqRequestId = table.Column<long>(type: "bigint", nullable: false),
                    RevisionNumber = table.Column<int>(type: "int", nullable: false),
                    SenderRole = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SenderUserId = table.Column<long>(type: "bigint", nullable: true),
                    SenderName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProposedUnitPriceUsd = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProposedTotalAmountUsd = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ProposedIncotermCode = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ProposedPaymentTerms = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Note = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RfqCounterOffers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RfqCounterOffers_RfqRequests_RfqRequestId",
                        column: x => x.RfqRequestId,
                        principalTable: "RfqRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SalesContracts",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ContractNumber = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RfqRequestId = table.Column<long>(type: "bigint", nullable: false),
                    SellerCompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellerTaxCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellerAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellerRepresentative = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellerTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuyerCompanyName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuyerTaxCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuyerAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuyerRepresentative = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BuyerTitle = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IncotermCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PortOfLoading = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PortOfDischarge = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PaymentTerms = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TargetDeliveryDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Currency = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TotalAmountUsd = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SellerSignatureData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SellerSignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    SellerSignedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SellerStampData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BuyerSignatureData = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    BuyerSignedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BuyerSignedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DigitalSignatureHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ContractPdfUrl = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RowVersion = table.Column<byte[]>(type: "varbinary(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesContracts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SalesContracts_RfqRequests_RfqRequestId",
                        column: x => x.RfqRequestId,
                        principalTable: "RfqRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RfqCounterOffers_RfqRequestId",
                table: "RfqCounterOffers",
                column: "RfqRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_SalesContracts_RfqRequestId",
                table: "SalesContracts",
                column: "RfqRequestId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RfqCounterOffers");

            migrationBuilder.DropTable(
                name: "SalesContracts");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Products");
        }
    }
}
