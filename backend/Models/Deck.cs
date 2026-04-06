using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Decks")]
    public class Deck
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int DeckId { get; set; }

        [Required]
        [StringLength(200)]
        [Column(TypeName = "nvarchar(200)")]
        public string Title { get; set; }

        [StringLength(1000)]
        [Column(TypeName = "nvarchar(1000)")]
        public string? Description { get; set; }

        public bool IsPublic { get; set; } = false;

        [Required]
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        public int? FolderId { get; set; }

        [ForeignKey("FolderId")]
        public Folder? Folder { get; set; }

        public int TotalCards { get; set; } = 0;

        public int TotalViews { get; set; } = 0;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? UpdatedAt { get; set; }

        public ICollection<FlashCard> FlashCards { get; set; }
    }
}