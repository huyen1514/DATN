using Models;

namespace Repositories
{
    public interface IExamSessionRepository
    {
        Task<ExamSession> StartSessionAsync(int userId, int examId, int durationSeconds);
        Task<ExamSession?> GetSessionAsync(int sessionId);
        Task<ExamSessionAnswer> SaveAnswerAsync(int sessionId, int questionId, AnswerOption? selectedOption);
        Task<IEnumerable<ExamSessionAnswer>> GetSessionAnswersAsync(int sessionId);
        Task<ExamSession?> SubmitSessionAsync(int sessionId);
    }
}
