using Models;

namespace backend.DTOs.Exam
{
    public class ExamQuestionAdminDto
    {
        public int ExamQuestionId { get; set; }
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
        public int CorrectAnswer { get; set; }
        public int Section { get; set; }
        public int MondaiNumber { get; set; }
        public string? Passage { get; set; }
        public string? Instruction { get; set; }
        public string? Explanation { get; set; }
        public string? AudioUrl { get; set; }
        public int ExamId { get; set; }
        public int UserId { get; set; }
        
        public ExamSimpleDto? Exam { get; set; }
    }

    public class ExamSimpleDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
    }
}
