using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateProgressSchema : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LessonId",
                table: "LessonProgresses");

            migrationBuilder.RenameColumn(
                name: "UserId",
                table: "LessonProgresses",
                newName: "UserProgressId");

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "UserProgresses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "CompletedAt",
                table: "LessonProgresses",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_LessonProgresses_UserProgressId_PartType",
                table: "LessonProgresses",
                columns: new[] { "UserProgressId", "PartType" },
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_LessonProgresses_UserProgresses_UserProgressId",
                table: "LessonProgresses",
                column: "UserProgressId",
                principalTable: "UserProgresses",
                principalColumn: "UserProgressId",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_LessonProgresses_UserProgresses_UserProgressId",
                table: "LessonProgresses");

            migrationBuilder.DropIndex(
                name: "IX_LessonProgresses_UserProgressId_PartType",
                table: "LessonProgresses");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "UserProgresses");

            migrationBuilder.DropColumn(
                name: "CompletedAt",
                table: "LessonProgresses");

            migrationBuilder.RenameColumn(
                name: "UserProgressId",
                table: "LessonProgresses",
                newName: "UserId");

            migrationBuilder.AddColumn<int>(
                name: "LessonId",
                table: "LessonProgresses",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }
    }
}
