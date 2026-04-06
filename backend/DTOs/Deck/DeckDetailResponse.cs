using DTOs.FlashCard;

public class DeckDetailResponse
{
    public int DeckId { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public bool IsPublic { get; set; }

    public DateTime CreatedAt { get; set; }

    public List<FlashCardResponse> FlashCards { get; set; }
}