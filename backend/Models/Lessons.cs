using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Lessons")]
    public class Lesson
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int LessonId { get; set; }
        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string LessonName { get; set; }

        [Required]
        [ForeignKey("LevelId")]
        public int LevelId { get; set; }
        public Level Level { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}