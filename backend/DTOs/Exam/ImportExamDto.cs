using System.Text.Json.Serialization;

namespace backend.DTOs.Exam
{
    public class ImportExamRequest
    {
        [JsonPropertyName("test_info")]
        public TestInfoDto TestInfo { get; set; } = null!;

        [JsonPropertyName("sections")]
        public List<SectionDto> Sections { get; set; } = new();
    }

    public class TestInfoDto
    {
        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public string Level { get; set; } = string.Empty;

        [JsonPropertyName("total_duration_minutes")]
        public int TotalDurationMinutes { get; set; }

        [JsonPropertyName("pass_marks")]
        public PassMarksDto? PassMarks { get; set; }
    }

    public class PassMarksDto
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("vocabulary_grammar")]
        public int VocabularyGrammar { get; set; }

        [JsonPropertyName("reading")]
        public int Reading { get; set; }

        [JsonPropertyName("listening")]
        public int Listening { get; set; }

        [JsonPropertyName("vocabulary_grammar_reading")]
        public int VocabularyGrammarReading { get; set; }
    }

    public class SectionDto
    {
        [JsonPropertyName("section_id")]
        public string? SectionId { get; set; }

        [JsonPropertyName("section_name")]
        public string SectionName { get; set; } = string.Empty;

        [JsonPropertyName("jp_name")]
        public string JpName { get; set; } = string.Empty;

        [JsonPropertyName("mondai_list")]
        public List<MondaiDto> MondaiList { get; set; } = new();
    }

    public class MondaiDto
    {
        [JsonPropertyName("mondai_number")]
        public int MondaiNumber { get; set; }

        [JsonPropertyName("instruction")]
        public string? Instruction { get; set; }

        [JsonPropertyName("vn_instruction")]
        public string? VnInstruction { get; set; }

        [JsonPropertyName("reading_passage")]
        public string? ReadingPassage { get; set; }

        [JsonPropertyName("questions")]
        public List<ImportQuestionDto> Questions { get; set; } = new();
    }

    public class ImportQuestionDto
    {
        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("options")]
        public List<OptionDto> Options { get; set; } = new();
        
        [JsonPropertyName("correct_option_id")]
        public int CorrectOptionId { get; set; } 
        
        [JsonPropertyName("explanation")]
        public string? Explanation { get; set; }

        [JsonPropertyName("attachments")]
        public List<string> Attachments { get; set; } = new();

        [JsonPropertyName("audio_url")]
        public string? AudioUrl { get; set; }
    }

    public class OptionDto
    {
        [JsonPropertyName("option_id")]
        public int Id { get; set; }

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }
}