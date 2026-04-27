using Models;

namespace Repositories
{
    public interface IExamQuestionRepository
    {
        Task<ExamQuestion?> GetByIdAsync(int id);
        Task<List<ExamQuestion>> GetByExamIdAsync(int examId);
        Task<ExamQuestion> CreateAsync(ExamQuestion examQuestion);
        Task UpdateAsync(ExamQuestion examQuestion);
        Task DeleteAsync(int id);
    }
}
