namespace DTOs.Folder
{
    public class FolderResponse
    {
        public int FolderId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<object> Decks { get; set; } = new();
    }
}
