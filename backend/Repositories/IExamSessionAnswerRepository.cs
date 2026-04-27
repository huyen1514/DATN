using Models;

namespace Repositories
{
    public interface IExamSessionAnswerRepository
    {
        Task<ExamSessionAnswer?> GetByIdAsync(int id);
        Task<List<ExamSessionAnswer>> GetByExamSessionIdAsync(int examSessionId);
        Task<ExamSessionAnswer> CreateAsync(ExamSessionAnswer examSessionAnswer);
        Task UpdateAsync(ExamSessionAnswer examSessionAnswer);
        Task DeleteAsync(int id);
    }
}
