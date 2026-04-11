using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum AnswerOption
    {
        A,
        B,
        C,
        D
    }
    [Table("ExamQuestions")]
    public class ExamQuestion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExamQuestionId { get; set; }
        
        [Required]
        [Column(TypeName="nvarchar(max)")]
        public string Question {get; set;}

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionA {get; set;}

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionB {get; set;}

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionC {get; set;}

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionD {get; set;}

        [Required]
        public AnswerOption CorrectAnswer {get; set;}

        public string? AudioUrl {get; set;}

        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User User { get; set; }

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam Exam { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}