// Đảm bảo bạn đã import namespace chứa enum AnswerOption từ Models
using Models; 

namespace backend.DTOs.Exam
{
    public class SubmitAnswerRequest
    {
        public int SessionId { get; set; }
        public int QuestionId { get; set; }
        
        // SỬA: Cho phép null và dùng chung Enum với Model
        // Nếu client không chọn hoặc bỏ chọn, gửi lên null
        public AnswerOption? SelectedOption { get; set; } 
    }
}