using backend.DTOs.Exam;

namespace Services
{
    public interface IExamResultService
    {
        Task<(bool Success, string Message, ExamResultDto? Data)> SubmitAsync(int sessionId);
        Task<List<ExamResultDto>> GetUserHistoryAsync(int userId);
        Task<ExamResultDto?> ReviewExamAsync(int examResultId);
    }
}
