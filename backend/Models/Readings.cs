using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Readings")]
    public class Reading
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReadingId { get; set; }
        
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string? Content { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Question { get; set; }

        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson? Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}