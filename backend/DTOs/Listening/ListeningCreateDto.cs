using System.ComponentModel.DataAnnotations;

namespace DTOs.Listening
{
    public class ListeningCreateDto
    {
        [MaxLength(255)]
        public string? AudioUrl { get; set; }

        [MaxLength(255)]
        public string? ImageUrl { get; set; }

        public string? Transcript { get; set; }
        
        [Required(ErrorMessage = "Câu hỏi không được để trống")]
        public string Question { get; set; } = string.Empty;

        [Required(ErrorMessage = "Đáp án A không được để trống")]
        [MaxLength(255)]
        public string OptionA { get; set; } = string.Empty;

        [Required(ErrorMessage = "Đáp án B không được để trống")]
        [MaxLength(255)]
        public string OptionB { get; set; } = string.Empty;

        [Required(ErrorMessage = "Đáp án C không được để trống")]
        [MaxLength(255)]
        public string OptionC { get; set; } = string.Empty;

        [Required(ErrorMessage = "Đáp án D không được để trống")]
        [MaxLength(255)]
        public string OptionD { get; set; } = string.Empty;

        [Required(ErrorMessage = "Cần chọn đáp án đúng")]
        [RegularExpression("^[ABCD]$", ErrorMessage = "Đáp án đúng phải là A, B, C hoặc D")]
        public string CorrectAnswer { get; set; } = string.Empty;

        [Required(ErrorMessage = "Vui lòng chọn bài học (Lesson)")]
        public int LessonId { get; set; }
    }
}