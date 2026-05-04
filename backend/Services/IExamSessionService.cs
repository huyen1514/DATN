using backend.DTOs.Exam;

namespace Services
{
    public interface IExamSessionService
    {
        Task<(bool Success, string Message, SessionResponseDto? Data, int StatusCode)> StartSessionAsync(StartSessionRequest request, int userId, bool isAdmin = false);
        Task<(bool Success, string Message)> AutoSaveAnswerAsync(SubmitAnswerRequest request, int userId);
    }
}
