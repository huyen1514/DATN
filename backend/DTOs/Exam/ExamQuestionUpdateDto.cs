using Models; 

namespace backend.DTOs.Exam
{
    public class ExamQuestionUpdateDto
    {
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
        public AnswerOption CorrectAnswer { get; set; } 
        public ExamSectionType Section { get; set; }
        public int MondaiNumber { get; set; }
        public string? Passage { get; set; }
        public string? Instruction { get; set; }
        public string? Explanation { get; set; }
        public string? AudioUrl { get; set; }
        public int ExamId { get; set; }
        public int UserId { get; set; }
    }
}