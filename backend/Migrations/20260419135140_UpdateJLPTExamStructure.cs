using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateJLPTExamStructure : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "HasParalysisScore",
                table: "ExamResults",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "ListeningScore",
                table: "ExamResults",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "ReadingScore",
                table: "ExamResults",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "VocabularyGrammarScore",
                table: "ExamResults",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AlterColumn<string>(
                name: "OptionD",
                table: "ExamQuestions",
                type: "nvarchar(255)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)");

            migrationBuilder.AlterColumn<string>(
                name: "OptionC",
                table: "ExamQuestions",
                type: "nvarchar(255)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(255)");

            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "ExamQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "MondaiNumber",
                table: "ExamQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Passage",
                table: "ExamQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QuestionGroupId",
                table: "ExamQuestions",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Section",
                table: "ExamQuestions",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HasParalysisScore",
                table: "ExamResults");

            migrationBuilder.DropColumn(
                name: "ListeningScore",
                table: "ExamResults");

            migrationBuilder.DropColumn(
                name: "ReadingScore",
                table: "ExamResults");

            migrationBuilder.DropColumn(
                name: "VocabularyGrammarScore",
                table: "ExamResults");

            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "ExamQuestions");

            migrationBuilder.DropColumn(
                name: "MondaiNumber",
                table: "ExamQuestions");

            migrationBuilder.DropColumn(
                name: "Passage",
                table: "ExamQuestions");

            migrationBuilder.DropColumn(
                name: "QuestionGroupId",
                table: "ExamQuestions");

            migrationBuilder.DropColumn(
                name: "Section",
                table: "ExamQuestions");

            migrationBuilder.AlterColumn<string>(
                name: "OptionD",
                table: "ExamQuestions",
                type: "nvarchar(255)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "OptionC",
                table: "ExamQuestions",
                type: "nvarchar(255)",
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "nvarchar(255)",
                oldNullable: true);
        }
    }
}
