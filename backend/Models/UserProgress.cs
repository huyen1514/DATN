using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("UserProgresses")]
    // Ràng buộc Unique: Một user chỉ có 1 tiến độ tổng cho 1 bài học
    [Index(nameof(UserId), nameof(LessonId), IsUnique = true)] 
    public class UserProgress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserProgressId { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Required]
        [ForeignKey(nameof(Lesson))]
        public int LessonId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; }

        public DateTime LastAccessed { get; set; } = DateTime.UtcNow;

        public bool Completed { get; set; }
        
        public DateTime? CompletedAt { get; set; } 

        public User? User { get; set; }
        public Lesson? Lesson { get; set; }

        public ICollection<LessonProgress> LessonProgresses { get; set; } = new List<LessonProgress>();
    }
}