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
        public string ExamName { get; set; }

        [Required]
        public int Duration { get; set; }

        [Required]
        [ForeignKey("LevelId")]
        public int LevelId { get; set; }
        public Level? Level { get; set; }

        /// <summary>Điểm tối thiểu (thang 180, kiểu JLPT) để đạt; null = dùng mặc định phía client/API.</summary>
        public int? PassScaledTotal { get; set; }

        /// <summary>Ngưỡng điểm phần Từ vựng + Ngữ pháp (thang 60).</summary>
        public int? PassScaledVocabularyGrammar { get; set; }

        /// <summary>Ngưỡng điểm phần Đọc hiểu (thang 60).</summary>
        public int? PassScaledReading { get; set; }

        /// <summary>Ngưỡng điểm phần Nghe hiểu (thang 60).</summary>
        public int? PassScaledListening { get; set; }

        /// <summary>
        /// Ngưỡng điểm phần "Từ vựng + Ngữ pháp + Đọc" theo format JLPT official (thang 120).
        /// Nếu có giá trị, hệ thống sẽ chấm theo 2 phần: (120 + 60).
        /// </summary>
        public int? PassScaledVocabularyGrammarReading { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}