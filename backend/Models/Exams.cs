using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Exams")]
    public class Exam
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExamId { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string ExamName { get; set; } = string.Empty;

        [Required]
        public int Duration { get; set; } // Nên hiểu là DurationInMinutes

        [Required]
        [ForeignKey("LevelId")]
        public int LevelId { get; set; }
        public Level? Level { get; set; }

        public int? PassScaledTotal { get; set; }
        public int? PassScaledVocabularyGrammar { get; set; }
        public int? PassScaledReading { get; set; }
        public int? PassScaledListening { get; set; }
        public int? PassScaledVocabularyGrammarReading { get; set; }

        // [CẬP NHẬT] Thêm cấu hình điểm liệt (mặc định JLPT thường là 19 điểm)
        public int? MinimumSectionScore { get; set; } 
        
        [Column(TypeName = "decimal(18,2)")]
        public decimal Price { get; set; } = 50000;

        // [CẬP NHẬT] Thêm trạng thái để quản lý ẩn/hiện đề thi
        public bool IsActive { get; set; } = true; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // [CẬP NHẬT] Navigation Properties
        public ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
        public ICollection<UserExam> UserExams { get; set; } = new List<UserExam>();
    }
}