namespace backend.DTOs.Exam
{
    public class ExamUpdateDto
    {
        public string ExamName { get; set; } = string.Empty;
        public int Duration { get; set; } // Tính bằng phút
        public decimal Price { get; set; }
        public bool IsActive { get; set; }
        // Admin có thể muốn đổi Level cho đề thi (VD: từ N4 lên N3)
        public int LevelId { get; set; } 
    }
}