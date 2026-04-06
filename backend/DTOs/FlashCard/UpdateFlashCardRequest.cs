namespace DTOs.FlashCard
{
    public class UpdateFlashCardRequest
    {
        public string FrontText { get; set; }
        public string BackText { get; set; }

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }
    }
}