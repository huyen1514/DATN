namespace DTOs.FlashCard
{
    public class CreateFlashCardRequest
    {
        public int DeckId { get; set; }

        public string FrontText { get; set; }
        public string BackText { get; set; }

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }
    }
}