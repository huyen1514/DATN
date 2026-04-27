using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("ReadingPassages")]
    public class ReadingPassage
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PassageId { get; set; }

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Content { get; set; } = string.Empty; 

        [MaxLength(2048)]
        public string? ImageUrl { get; set; }

        [Required]
        public int LessonId { get; set; }
        
        [ForeignKey(nameof(LessonId))]
        public Lesson? Lesson { get; set; }

        // Navigation Property: 1 Đoạn văn chứa NHIỀU câu hỏi đọc hiểu
        public ICollection<ReadingQuestion> ReadingQuestions { get; set; } = new List<ReadingQuestion>();
    
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
    }
}