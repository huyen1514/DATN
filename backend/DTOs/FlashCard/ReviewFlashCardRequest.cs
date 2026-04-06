namespace DTOs.FlashCard
{
    public class ReviewFlashCardRequest
    {
        public int FlashCardId { get; set; }

        // 1 = Again | 3 = Good | 5 = Easy
        public int Score { get; set; }
    }
}