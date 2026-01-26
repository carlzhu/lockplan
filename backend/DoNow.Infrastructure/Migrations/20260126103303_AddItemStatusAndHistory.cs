using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DoNow.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddItemStatusAndHistory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "status",
                table: "items",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "status_changed_at",
                table: "items",
                type: "datetime(6)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "item_status_histories",
                columns: table => new
                {
                    id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    item_id = table.Column<long>(type: "bigint", nullable: false),
                    old_status = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    new_status = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    comment = table.Column<string>(type: "longtext", nullable: true)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    changed_at = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    user_id = table.Column<string>(type: "varchar(95)", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_item_status_histories", x => x.id);
                    table.ForeignKey(
                        name: "FK_item_status_histories_items_item_id",
                        column: x => x.item_id,
                        principalTable: "items",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_item_status_histories_users_user_id",
                        column: x => x.user_id,
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Restrict);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_item_status_histories_changed_at",
                table: "item_status_histories",
                column: "changed_at");

            migrationBuilder.CreateIndex(
                name: "IX_item_status_histories_item_id",
                table: "item_status_histories",
                column: "item_id");

            migrationBuilder.CreateIndex(
                name: "IX_item_status_histories_user_id",
                table: "item_status_histories",
                column: "user_id");

            // 为现有数据设置初始状态
            migrationBuilder.Sql(@"
                UPDATE items 
                SET status = CASE 
                    WHEN is_completed = 1 THEN 'Completed'
                    ELSE 'Todo'
                END,
                status_changed_at = COALESCE(completed_at, created_at)
                WHERE status IS NULL OR status = '';
            ");

            // 为现有数据创建初始状态历史记录
            migrationBuilder.Sql(@"
                INSERT INTO item_status_histories (item_id, old_status, new_status, comment, changed_at, user_id)
                SELECT 
                    id,
                    NULL,
                    CASE 
                        WHEN is_completed = 1 THEN 'Completed'
                        ELSE 'Todo'
                    END,
                    '系统迁移：初始状态',
                    created_at,
                    user_id
                FROM items
                WHERE NOT EXISTS (
                    SELECT 1 FROM item_status_histories WHERE item_id = items.id
                );
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "item_status_histories");

            migrationBuilder.DropColumn(
                name: "status",
                table: "items");

            migrationBuilder.DropColumn(
                name: "status_changed_at",
                table: "items");
        }
    }
}
