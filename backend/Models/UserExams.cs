using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("UserExams")]
    public class UserExam // [CẬP NHẬT] Đổi từ UserExams thành số ít UserExam
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserExamId { get; set; }

        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam Exam { get; set; } = null!;

        public DateTime? PurchaseDate { get; set;}
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}