using Models;

namespace Repositories
{
    public interface IExamResultRepository
    {
        Task<ExamResult?> GetByIdAsync(int id);
        Task<List<ExamResult>> GetByUserIdAsync(int userId);
        Task<List<ExamResult>> GetByExamIdAsync(int examId);
        Task<ExamResult> CreateAsync(ExamResult examResult);
        Task UpdateAsync(ExamResult examResult);
        Task DeleteAsync(int id);
    }
}
