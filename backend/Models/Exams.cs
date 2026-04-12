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
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}