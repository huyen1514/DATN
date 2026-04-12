using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Kanjis")]
    public class Kanji
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int KanjiId { get; set; }
        [Required]
        [StringLength(10)]
        [Column(TypeName = "nvarchar(10)")]
        public string Character { get; set; }
    
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Meaning { get; set; }

        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string Onyomi { get; set; }
        
        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string? Kunyomi { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Example { get; set; }
        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson? Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}