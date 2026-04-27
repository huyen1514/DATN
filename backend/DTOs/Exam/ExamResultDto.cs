namespace backend.DTOs.Exam
{
    public class ExamResultDto
    {
        public int ExamResultId { get; set; }
        
        // SỬA: Chuyển toàn bộ decimal thành int
        public int TotalScore { get; set; }
        public int VocabGrammarScore { get; set; }
        public int ReadingScore { get; set; }
        public int ListeningScore { get; set; }
        
        public bool IsPassed { get; set; }
        public bool HasParalysisScore { get; set; } 
        
        // SỬA TÊN: Đồng bộ với tên property trong model ExamResult (AmountCorrectAnswers)
        public int AmountCorrectAnswers { get; set; }
        public int TotalQuestion { get; set; }
        public DateTime CompletedAt { get; set; }
        
        public List<QuestionResultDto> Details { get; set; } = new();
    }

    public class QuestionResultDto
    {
        public int QuestionId { get; set; }
        public string? SelectedOption { get; set; }
        public string CorrectOption { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
        public string? Explanation { get; set; } 
    }
}