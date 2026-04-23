using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("LessonProgresses")]
    public class LessonProgress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int LessonId { get; set; }

        [Required]
        [StringLength(50)]
        public string PartType { get; set; } // Vocabulary, Kanji, Grammar, Reading, Listening

        [Required]
        [StringLength(50)]
        public string Status { get; set; } // NotStarted, InProgress, Completed

        [Column(TypeName = "decimal(5,2)")]
        public decimal? Score { get; set; }

        public DateTime LastAccessedAt { get; set; }
    }
}
