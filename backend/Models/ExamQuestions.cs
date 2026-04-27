using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum AnswerOption { A, B, C, D }
    public enum ExamSectionType { Vocabulary, Grammar, Reading, Listening }

    [Table("ExamQuestions")]
    public class ExamQuestion
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ExamQuestionId { get; set; }
        
        [Required]
        [Column(TypeName="nvarchar(max)")]
        public string Question {get; set;} = string.Empty;

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionA {get; set;} = string.Empty;

        [Required]
        [Column(TypeName="nvarchar(255)")]
        public string OptionB {get; set;} = string.Empty;

        [Column(TypeName="nvarchar(255)")]
        public string? OptionC {get; set;}

        [Column(TypeName="nvarchar(255)")]
        public string? OptionD {get; set;}

        [Required]
        public AnswerOption CorrectAnswer {get; set;}

        public string? ImageUrl {get; set;}

        [Required]
        public ExamSectionType Section { get; set; }

        public int MondaiNumber { get; set; }

        // [CẬP NHẬT] Đã xóa Passage và AudioUrl, thay bằng Khóa ngoại trỏ về QuestionGroup
        [ForeignKey("QuestionGroupId")]
        public int? QuestionGroupId { get; set; }
        public QuestionGroup? QuestionGroup { get; set; }

        [Column(TypeName="nvarchar(max)")]
        public string? Instruction { get; set; }

        [Column(TypeName="nvarchar(max)")]
        public string? Explanation { get; set; }

        // [CẬP NHẬT] Đổi tên để phân biệt rõ đây là Admin/Giáo viên tạo câu hỏi
        [Required]
        [ForeignKey("CreatedByUserId")]
        public int CreatedByUserId { get; set; }
        public User? CreatedByUser { get; set; }

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam? Exam { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}