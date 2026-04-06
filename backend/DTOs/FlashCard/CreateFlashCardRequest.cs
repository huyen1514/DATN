namespace DTOs.FlashCard
{
    public class CreateFlashCardRequest
    {
        public int DeckId { get; set; }

        public string FrontText { get; set; } // Kanji
        public string? HiraganaText { get; set; } // Hiragana/Romaji
        public string BackText { get; set; } // Vietnamese meaning

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }
    }
}