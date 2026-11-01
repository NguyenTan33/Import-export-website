using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WebXNK.Infrastructure.Persistence.Context;

#nullable disable

namespace WebXNK.Infrastructure.Migrations;

[DbContext(typeof(WebXnkDbContext))]
[Migration("20261022120000_AddCustomerAddressBook")]
public partial class AddCustomerAddressBook : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "CustomerAddresses",
            columns: table => new
            {
                Id = table.Column<long>(type: "bigint", nullable: false).Annotation("SqlServer:Identity", "1, 1"),
                UserId = table.Column<long>(type: "bigint", nullable: false),
                RecipientName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: false),
                PhoneNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                Province = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                District = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                Ward = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                AddressLine = table.Column<string>(type: "nvarchar(300)", maxLength: 300, nullable: false),
                CountryCode = table.Column<string>(type: "nvarchar(3)", maxLength: 3, nullable: false),
                PostalCode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                IsDefault = table.Column<bool>(type: "bit", nullable: false),
                CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_CustomerAddresses", x => x.Id);
                table.ForeignKey("FK_CustomerAddresses_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_CustomerAddresses_UserId_IsDefault",
            table: "CustomerAddresses",
            columns: new[] { "UserId", "IsDefault" },
            unique: true,
            filter: "[IsDefault] = 1");
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(name: "CustomerAddresses");
    }
}
