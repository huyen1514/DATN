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
        public int Duration { get; set; }
        public DateTime CompletedAt { get; set; }
        
        public ExamInfoDto? Exam { get; set; }
        public List<ExamQuestionAdminDto> Questions { get; set; } = new();
        public Dictionary<int, string?> Answers { get; set; } = new();
        public List<QuestionResultDto> Details { get; set; } = new();
    }

    public class ExamInfoDto
    {
        public string ExamName { get; set; } = string.Empty;
        public int? PassScaledTotal { get; set; }
        public int? PassScaledVocabularyGrammar { get; set; }
        public int? PassScaledReading { get; set; }
        public int? PassScaledListening { get; set; }
        public int? PassScaledVocabularyGrammarReading { get; set; }
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