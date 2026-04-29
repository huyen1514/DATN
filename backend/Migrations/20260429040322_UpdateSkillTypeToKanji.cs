using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateSkillTypeToKanji : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Lessons SET SkillType = N'Kanji' WHERE SkillType = N'Hán tự'");
            migrationBuilder.Sql("UPDATE Lessons SET SkillType = N'Từ vựng' WHERE SkillType = N'Tự do'");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("UPDATE Lessons SET SkillType = N'Hán tự' WHERE SkillType = N'Kanji'");
        }
    }
}
