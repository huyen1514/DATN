namespace DTOs.Deck
{
    public class CreateDeckRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool IsPublic { get; set; } 
        public int? FolderId { get; set; } // optional
    }
}
