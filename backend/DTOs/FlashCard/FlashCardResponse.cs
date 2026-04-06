namespace DTOs.FlashCard
{
    public class FlashCardResponse
    {
        public int FlashCardId { get; set; }

        public string FrontText { get; set; }
        public string BackText { get; set; }

        public string? Example { get; set; }
        public string? AudioUrl { get; set; }

        public string Status { get; set; }

        public DateTime? NextReviewDate { get; set; }
    }
}