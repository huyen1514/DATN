namespace backend.DTOs.Exam
{
    public class StartSessionRequest
    {
        public int ExamId { get; set; }
        
    }

    public class SessionResponseDto
    {
        public int SessionId { get; set; }
        public int ExamId { get; set; }
        public DateTime StartTime { get; set; }
        public int TimeRemainingSeconds { get; set; }
    }
}