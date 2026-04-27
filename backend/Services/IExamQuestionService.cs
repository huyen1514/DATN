using backend.DTOs.Exam;

namespace Services
{
    public interface IExamQuestionService
    {
        Task<List<ExamQuestionAdminDto>> GetAllQuestionsAsync();
        Task<ExamDetailDto?> GetExamContentAsync(int examId);
        Task<ExamQuestionAdminDto?> CreateQuestionAsync(ExamQuestionCreateDto dto);
        Task<bool> UpdateQuestionAsync(int id, ExamQuestionUpdateDto dto);
        Task<bool> DeleteQuestionAsync(int id);
    }
}
