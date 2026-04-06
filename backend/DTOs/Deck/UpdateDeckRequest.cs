namespace DTOs.Deck
{
    public class UpdateDeckRequest
    {
        public string Title { get; set; }
        public string Description { get; set; }
        public bool IsPublic { get; set; }
        public int? FolderId { get; set; }
    }
}   