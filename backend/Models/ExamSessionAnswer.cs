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
        public int SessionId { get; set; }

        [Required]
        public int QuestionId { get; set; }

        [Required]
        [StringLength(10)]
        public string SelectedOption { get; set; } = string.Empty;
    }
}
