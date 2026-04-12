using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("ExamResults")]
    public class ExamResult
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExamResultId { get; set; }
        
        [Required]
        public decimal Score  { get; set; }

        [Required]
        public int TotalQuestion { get; set; }

        [Required]
        public int AmountCorrectAnswers { get; set; }

        public bool IsPassed { get; set; }

        public int Duration { get; set; }

        public DateTime CompletedAt { get; set; }

        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User? User { get; set; }

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam? Exam { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}