namespace DTOs.Bookmark
{
    public class BookmarkResponse
    {
        public int BookmarkId { get; set; }
        public int UserId { get; set; }
        public int ItemId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string ItemName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }
}
