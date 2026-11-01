using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace WebXNK.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class SyncLatestEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF NOT EXISTS (
                    SELECT 1 FROM sys.columns 
                    WHERE Name = N'CreatedAt' 
                    AND Object_ID = Object_ID(N'ShipmentMilestones')
                )
                BEGIN
                    ALTER TABLE [ShipmentMilestones] ADD [CreatedAt] datetime2 NOT NULL DEFAULT GETUTCDATE();
                END
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "ShipmentMilestones");
        }
    }
}
