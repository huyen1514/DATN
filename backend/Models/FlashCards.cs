using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum FlashCardStatus
    {
        New,
        Learning,
        Review,
        Mastered
    }

    [Table("FlashCards")]
    public class FlashCard
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int FlashCardId { get; set; }

        [Required]
        public int DeckId { get; set; }

        [ForeignKey("DeckId")]
        public Deck Deck { get; set; }
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string FrontText { get; set; } // mặt trước
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string BackText { get; set; } // mặt sau

        public string? Example { get; set; }

        public string? AudioUrl { get; set; }

        [Required]
        public FlashCardStatus Status { get; set; }

        public DateTime? NextReviewDate { get; set; }

        public int ReviewCount { get; set; } = 0;

        public DateTime? LastReviewedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}