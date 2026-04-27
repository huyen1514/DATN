namespace DTOs.Listening
{
    public class ListeningReadDto
    {
        public int ListeningId { get; set; }
        public string? AudioUrl { get; set; }
        public string? ImageUrl { get; set; }
        public string? Transcript { get; set; }
        public string Question { get; set; } = string.Empty;
        public string OptionA { get; set; } = string.Empty;
        public string OptionB { get; set; } = string.Empty;
        public string OptionC { get; set; } = string.Empty;
        public string OptionD { get; set; } = string.Empty;
        
        public string CorrectAnswer { get; set; } = string.Empty; 
        
        public int LessonId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}