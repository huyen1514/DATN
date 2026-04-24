using System.ComponentModel.DataAnnotations;

namespace DTOs.Bookmark
{
    public class DeleteBookmarkRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty;
    }
}
