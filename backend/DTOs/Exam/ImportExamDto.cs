namespace backend.DTOs.Exam
{
    public class ImportExamRequest
    {
        public TestInfoDto TestInfo { get; set; } = null!;
        public List<SectionDto> Sections { get; set; } = new();
    }

    public class TestInfoDto
    {
        public string Title { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public int TotalDurationMinutes { get; set; }
        public PassMarksDto PassMarks { get; set; } = new();
    }

    public class PassMarksDto
    {
        public int Total { get; set; }
        public int VocabularyGrammar { get; set; }
        public int Reading { get; set; }
        public int Listening { get; set; }
        public int VocabularyGrammarReading { get; set; }
    }

    public class SectionDto
    {
        public string? SectionId { get; set; }
        public string SectionName { get; set; } = string.Empty;
        public string JpName { get; set; } = string.Empty;
        public List<MondaiDto> MondaiList { get; set; } = new();
    }

    public class MondaiDto
    {
        public int MondaiNumber { get; set; }
        public string? Instruction { get; set; }
        public string? VnInstruction { get; set; }
        public string? ReadingPassage { get; set; }
        public string? AudioUrl { get; set; }
        public List<ImportQuestionDto> Questions { get; set; } = new();
    }

    public class ImportQuestionDto
    {
        public string Content { get; set; } = string.Empty;
        public List<OptionDto> Options { get; set; } = new();
        
        // SỬA: Nhận trực tiếp ký tự "A", "B", "C", "D" từ file JSON để dễ map sang Enum
        public string CorrectOption { get; set; } = string.Empty; 
        
        public string? Explanation { get; set; }
        public string? Attachment { get; set; } 
    }

    public class OptionDto
    {
        public int Id { get; set; }
        public string Text { get; set; } = string.Empty;
    }
}