namespace backend.DTOs.Exam
{
    public class ExamResponseDto
    {
        public int ExamId { get; set; }
        public string ExamName { get; set; } = string.Empty;
        public int Duration { get; set; }
        public string LevelName { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public bool IsActive { get; set; }
        public int TotalQuestions { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}