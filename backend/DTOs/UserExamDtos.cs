using Models;

namespace DTOs
{
    public class UserExamCreateDto
    {
        public int UserId { get; set; }
        public int ExamId { get; set; }
        public DateTime? PurchaseDate { get; set; }
    }

    public class UserExamUpdateDto
    {
        public int UserId { get; set; }
        public int ExamId { get; set; }
        public DateTime? PurchaseDate { get; set; }
    }

    public class UserExamResponseDto
    {
        public int UserExamId { get; set; }
        public int UserId { get; set; }
        public string? UserName { get; set; }
        public int ExamId { get; set; }
        public string? ExamName { get; set; }
        public DateTime? PurchaseDate { get; set; }
        public DateTime CreatedAt { get; set; }

        public UserExamResponseDto() {}

        public UserExamResponseDto(UserExam model)
        {
            UserExamId = model.UserExamId;
            UserId = model.UserId;
            UserName = model.User?.UserName;
            ExamId = model.ExamId;
            ExamName = model.Exam?.ExamName;
            PurchaseDate = model.PurchaseDate;
            CreatedAt = model.CreatedAt;
        }
    }
}
