using System.Collections.Generic;

namespace DTOs.Reading
{
    public class ReadingImportDto
    {
        public int LessonId { get; set; } 
        
        public string LessonName { get; set; } = string.Empty;
        
        public string Content { get; set; } = string.Empty;
        
        public string? ImageUrl { get; set; }
        
        public List<ReadingQuestionImportDto> Questions { get; set; } = new();
    }

    public class ReadingQuestionImportDto
    {
        public string QuestionText { get; set; } = string.Empty;
        
        public string Option1 { get; set; } = string.Empty;
        
        public string Option2 { get; set; } = string.Empty;
        
        public string Option3 { get; set; } = string.Empty;
        
        public string Option4 { get; set; } = string.Empty;
        
        public int CorrectOption { get; set; }
    }
}