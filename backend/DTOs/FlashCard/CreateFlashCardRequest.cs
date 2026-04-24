namespace DTOs.FlashCard
{
    public class CreateFlashCardRequest
    {
        public int DeckId { get; set; }

        public string FrontText { get; set; } = string.Empty; // Kanji
        public string? HiraganaText { get; set; } // Hiragana/Romaji
        public string BackText { get; set; } = string.Empty; // Vietnamese meaning

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }
    }
}
