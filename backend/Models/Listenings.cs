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

        [MaxLength(255)]
        public string? AudioUrl { get; set; }

        [MaxLength(255)]
        public string? ImageUrl { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Transcript { get; set; }
        
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Question { get; set; } = string.Empty;

        // 4 đáp án
        [Required]
        [MaxLength(255)]
        public string OptionA { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string OptionB { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string OptionC { get; set; } = string.Empty;

        [Required]
        [MaxLength(255)]
        public string OptionD { get; set; } = string.Empty;

        // Đáp án đúng: A / B / C / D
        [Required]
        [Column(TypeName = "char(1)")]
        [RegularExpression("^[ABCD]$", ErrorMessage = "Đáp án đúng chỉ có thể là A, B, C hoặc D")]
        public string CorrectAnswer { get; set; } = string.Empty;

        [Required]
        public int LessonId { get; set; }
        
        [ForeignKey("LessonId")]
        public virtual Lesson? Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}