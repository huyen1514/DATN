using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Vocabularies")]
    public class Vocabulary
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int VocabularyId { get; set; }
        
        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string Word { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string Reading { get; set; }
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Meaning { get; set; }

        [Column(TypeName = "nvarchar(max)")]
        public string? Example { get; set; }

        public string? PartOfSpeech { get; set; }

        public string? AudioUrl { get; set; }

        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}