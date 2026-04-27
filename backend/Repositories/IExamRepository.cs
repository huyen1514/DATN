using Models;

namespace Repositories
{
    public interface IExamRepository
    {
        Task<Exam?> GetByIdAsync(int examId);
        Task<List<Exam>> GetAllAsync();
        Task<Exam> CreateAsync(Exam exam);
        Task UpdateAsync(Exam exam);
        Task DeleteAsync(int examId);
    }
}
