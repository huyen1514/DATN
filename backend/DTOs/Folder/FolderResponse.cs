namespace DTOs.Folder
{
    public class FolderResponse
    {
        public int FolderId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public List<object> Decks { get; set; }
    }
}