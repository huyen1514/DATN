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
        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        //Loại nội dung (Vocabulary, Kanji)
        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string ItemType { get; set; }

        //ID của item tương ứng
        [Required]
        public int ItemId { get; set; }

        [Required]
        public FlashCardStatus Status { get; set; }

        public DateTime? NextReviewDate { get; set; }

        public int ReviewCount { get; set; } = 0;

        public DateTime? LastReviewedAt { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}