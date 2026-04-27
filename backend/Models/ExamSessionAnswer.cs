using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("ExamSessionAnswers")]
    public class ExamSessionAnswer
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int AnswerId { get; set; }

        [Required]
        [ForeignKey("SessionId")]
        public int SessionId { get; set; }
        public ExamSession? Session { get; set; } // Navigation Property

        [Required]
        [ForeignKey("QuestionId")]
        public int QuestionId { get; set; }
        public ExamQuestion? Question { get; set; } // Navigation Property

        public AnswerOption? SelectedOption { get; set; }
    }
}