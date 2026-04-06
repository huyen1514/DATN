public class DeckResponse
{
    public int DeckId { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }

    public int FlashCardCount { get; set; }

    public DateTime CreatedAt { get; set; }
}