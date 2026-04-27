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
        public int Score { get; set; }

        public int VocabularyGrammarScore { get; set; }
        
        public int ReadingScore { get; set; }
        
        public int ListeningScore { get; set; }

        public bool HasParalysisScore { get; set; }

        [Required]
        public int TotalQuestion { get; set; }

        [Required]
        public int AmountCorrectAnswers { get; set; }

        public bool IsPassed { get; set; }

        public int Duration { get; set; }

        public DateTime CompletedAt { get; set; }

        // Dùng để lưu lại cấu trúc đề + câu trả lời của user dưới dạng JSON để xem lại bài giải.
        [Column(TypeName = "nvarchar(max)")]
        public string? ExamSnapshotJson { get; set; }

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