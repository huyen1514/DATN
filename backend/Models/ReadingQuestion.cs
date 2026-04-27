using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("ReadingQuestions")]
    public class ReadingQuestion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ReadingQuestionId { get; set; } 

        [Required]
        [MaxLength(2000)]
        public string QuestionText { get; set; } = string.Empty; 

        [MaxLength(500)]
        public string Option1 { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Option2 { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Option3 { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Option4 { get; set; } = string.Empty;

        [Required]
        public int CorrectOption { get; set; }

        [Required]
        public int PassageId { get; set; }
        
        [ForeignKey(nameof(PassageId))]
        public ReadingPassage? Passage { get; set; }
    
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}