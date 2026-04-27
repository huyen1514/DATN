using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    // Thêm Enum để quản lý trạng thái phiên thi chuẩn xác hơn
    public enum SessionStatus { InProgress, Submitted, Abandoned }

    [Table("ExamSessions")]
    public class ExamSession
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SessionId { get; set; }

        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User? User { get; set; } // Navigation Property

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam? Exam { get; set; } // Navigation Property

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        public SessionStatus Status { get; set; } = SessionStatus.InProgress; // Chuyển sang dùng Enum

        public int TimeRemainingSeconds { get; set; }

        // Mối quan hệ 1-N: 1 Session có nhiều Câu trả lời
        public ICollection<ExamSessionAnswer> Answers { get; set; } = new List<ExamSessionAnswer>();
    }
}