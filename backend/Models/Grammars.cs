using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Grammars")]
    public class Grammar
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int GrammarId { get; set; }
        [Required]
        [StringLength(255)]
        [Column(TypeName = "nvarchar(255)")]
        public string GrammarName { get; set; }
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Structure { get; set; }
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Meaning { get; set; }
        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Example { get; set; }
        [Required]
        [ForeignKey("LessonId")]
        public int LessonId { get; set; }
        public Lesson Lesson { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}