using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("QuestionGroups")]
    public class QuestionGroup
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int QuestionGroupId { get; set; }

        [Column(TypeName="nvarchar(max)")]
        public string? Passage { get; set; } // Đoạn văn đọc hiểu chung

        [StringLength(500)]
        public string? AudioUrl { get; set; } // File nghe chung

        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam? Exam { get; set; }

        // Navigation Property: Danh sách các câu hỏi thuộc nhóm này
        public ICollection<ExamQuestion> Questions { get; set; } = new List<ExamQuestion>();
    }
}