using System.Text.Json.Serialization;

namespace backend.DTOs.Exam
{
    public class ImportExamRequest
    {
        [JsonPropertyName("test_info")]
        public TestInfoDto TestInfo { get; set; } = new();

        [JsonPropertyName("sections")]
        public List<SectionDto> Sections { get; set; } = new();
    }

    public class TestInfoDto
    {
        [JsonPropertyName("test_id")]
        public string TestId { get; set; } = string.Empty;

        [JsonPropertyName("title")]
        public string Title { get; set; } = string.Empty;

        [JsonPropertyName("level")]
        public string Level { get; set; } = string.Empty;

        [JsonPropertyName("total_duration_minutes")]
        public int TotalDurationMinutes { get; set; }
        
        [JsonPropertyName("pass_marks")]
        public PassMarksDto PassMarks { get; set; } = new();
    }

    public class PassMarksDto
    {
        [JsonPropertyName("total")]
        public int Total { get; set; }

        [JsonPropertyName("vocabulary_grammar")]
        public int VocabularyGrammar { get; set; }

        // Some official-style JSONs bundle 語彙・文法・読解 as one section (max 120)
        [JsonPropertyName("vocabulary_grammar_reading")]
        public int VocabularyGrammarReading { get; set; }

        [JsonPropertyName("reading")]
        public int Reading { get; set; }

        [JsonPropertyName("listening")]
        public int Listening { get; set; }
    }

    public class SectionDto
    {
        [JsonPropertyName("section_id")]
        public string SectionId { get; set; } = string.Empty;

        [JsonPropertyName("section_name")]
        public string SectionName { get; set; } = string.Empty;

        [JsonPropertyName("jp_name")]
        public string JpName { get; set; } = string.Empty;

        [JsonPropertyName("duration_minutes")]
        public int DurationMinutes { get; set; }

        [JsonPropertyName("mondai_list")]
        public List<MondaiDto> MondaiList { get; set; } = new();
    }

    public class MondaiDto
    {
        [JsonPropertyName("mondai_id")]
        public string MondaiId { get; set; } = string.Empty;

        [JsonPropertyName("mondai_number")]
        public int MondaiNumber { get; set; }

        [JsonPropertyName("instruction")]
        public string Instruction { get; set; } = string.Empty;

        [JsonPropertyName("vn_instruction")]
        public string VnInstruction { get; set; } = string.Empty;

        [JsonPropertyName("reading_passage")]
        public string? ReadingPassage { get; set; }

        [JsonPropertyName("audio_url")]
        public string? AudioUrl { get; set; }

        [JsonPropertyName("questions")]
        public List<QuestionDto> Questions { get; set; } = new();
    }

    public class QuestionDto
    {
        [JsonPropertyName("question_id")]
        public string QuestionId { get; set; } = string.Empty;

        [JsonPropertyName("number")]
        public int Number { get; set; }

        [JsonPropertyName("content")]
        public string Content { get; set; } = string.Empty;

        [JsonPropertyName("attachment")]
        public string? Attachment { get; set; }

        [JsonPropertyName("options")]
        public List<OptionDto> Options { get; set; } = new();

        [JsonPropertyName("correct_option_id")]
        public int CorrectOptionId { get; set; }

        [JsonPropertyName("explanation")]
        public string? Explanation { get; set; }
    }

    public class OptionDto
    {
        [JsonPropertyName("option_id")]
        public int OptionId { get; set; }

        [JsonPropertyName("text")]
        public string Text { get; set; } = string.Empty;
    }
}
