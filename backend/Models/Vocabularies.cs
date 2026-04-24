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
        public string Word { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(255)")]
        public string Reading { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Meaning { get; set; } = string.Empty;

        [Column(TypeName = "nvarchar(max)")]
        public string? Example { get; set; }

        [MaxLength(50)] 
        [Column(TypeName = "nvarchar(50)")]
        public string? PartOfSpeech { get; set; }

        [MaxLength(500)] 
        [Column(TypeName = "nvarchar(500)")]
        public string? AudioUrl { get; set; }

        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson? Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; } 
    }
}