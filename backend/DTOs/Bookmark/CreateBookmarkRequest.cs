using System.ComponentModel.DataAnnotations;

namespace DTOs.Bookmark
{
    public class CreateBookmarkRequest
    {
        [Required]
        public int UserId { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        public string Type { get; set; } = string.Empty;
    }
}
