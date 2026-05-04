namespace backend.DTOs.Exam
{
    public class ExamDetailDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
        public int DurationSeconds { get; set; }
        public List<QuestionGroupDto> QuestionGroups { get; set; } = new();
    }

    public class QuestionGroupDto
    {
        public int QuestionGroupId { get; set; }
        public string? Passage { get; set; }
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        public int ExamQuestionId { get; set; }
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
        public int MondaiNumber { get; set; }
        public string? ImageUrl { get; set; }
        public string? Instruction { get; set; }
        public string? AudioUrl { get; set; }
        public string Section { get; set; } = string.Empty;
    }
}