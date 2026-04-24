namespace DTOs.FlashCard
{
    public class FlashCardResponse
    {
        public int FlashCardId { get; set; }

        public string FrontText { get; set; } = string.Empty; // Kanji
        public string? HiraganaText { get; set; } // Hiragana/Romaji
        public string BackText { get; set; } = string.Empty; // Vietnamese meaning

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }

        public string Status { get; set; } = string.Empty;

        public DateTime? NextReviewDate { get; set; }
        public int ReviewCount { get; set; }
    }
}
