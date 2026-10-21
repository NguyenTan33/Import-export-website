using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using WebXNK.Infrastructure.Persistence.Context;

#nullable disable

namespace WebXNK.Infrastructure.Migrations;

[DbContext(typeof(WebXnkDbContext))]
[Migration("20261019150000_AddProductImageGallery")]
public partial class AddProductImageGallery : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "ImageUrlsJson",
            table: "Products",
            type: "nvarchar(max)",
            nullable: true);
    }

    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropColumn(name: "ImageUrlsJson", table: "Products");
    }
}
