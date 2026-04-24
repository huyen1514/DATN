using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Listenings")]
    public class Listening
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ListeningId { get; set; }
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string? AudioUrl { get; set; }

        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string? ImageUrl { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Transcript { get; set; }
        
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Question { get; set; } = string.Empty;
        // 4 đáp án
        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string OptionA { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string OptionB { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string OptionC { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string OptionD { get; set; } = string.Empty;

        // Đáp án đúng: A / B / C / D
        [Required]
        [Column(TypeName = "nvarchar(1)")]
        public string CorrectAnswer { get; set; } = string.Empty;
        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson? Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
