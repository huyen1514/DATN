using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("LessonProgresses")] 
    // Ràng buộc Unique: Mỗi tiến độ tổng chỉ có 1 dòng cho 1 kỹ năng (PartType)
    [Index(nameof(UserProgressId), nameof(PartType), IsUnique = true)]
    public class LessonProgress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        // Khóa ngoại trỏ về bảng Cha (UserProgress)
        [Required]
        [ForeignKey(nameof(UserProgress))]
        public int UserProgressId { get; set; }
        public UserProgress? UserProgress { get; set; }

        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string PartType { get; set; } = string.Empty; // Vocabulary, Kanji, Grammar...

        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string Status { get; set; } = "NotStarted"; // NotStarted, InProgress, Completed

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Score { get; set; } 

        public DateTime LastAccessedAt { get; set; } = DateTime.UtcNow;
        public DateTime? CompletedAt { get; set; }
    }
}