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
        public string LessonName { get; set; } = string.Empty;

        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string SkillType { get; set; } = "Chung";

        [Required]
        [ForeignKey("LevelId")]
        public int LevelId { get; set; }
        public Level? Level { get; set; }

        public ICollection<Vocabulary> Vocabularies { get; set; } = new List<Vocabulary>();
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; } 
    }
}