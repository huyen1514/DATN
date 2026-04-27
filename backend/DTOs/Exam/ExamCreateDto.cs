namespace backend.DTOs.Exam
{
    public class ExamCreateDto
    {
        public string ExamName { get; set; } = string.Empty;
        public int Duration { get; set; }
        public int LevelId { get; set; }
        public decimal Price { get; set; } = 50000;
        
        public int? PassScaledTotal { get; set; }
        public int? PassScaledVocabularyGrammar { get; set; }
        public int? PassScaledReading { get; set; }
        public int? PassScaledListening { get; set; }
        public int? PassScaledVocabularyGrammarReading { get; set; }
    }
}
