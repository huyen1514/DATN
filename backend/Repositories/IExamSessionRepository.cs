using System.Collections.Generic;
using System.Threading.Tasks;
using Models;

namespace Repositories
{
    public interface IExamSessionRepository
    {
        Task<ExamSession> StartSessionAsync(int userId, int examId, int durationSeconds);
        Task<ExamSession?> GetSessionAsync(int sessionId);
        Task<ExamSessionAnswer> SaveAnswerAsync(int sessionId, int questionId, string selectedOption);
        Task<IEnumerable<ExamSessionAnswer>> GetSessionAnswersAsync(int sessionId);
        Task<ExamSession?> SubmitSessionAsync(int sessionId);
    }
}
