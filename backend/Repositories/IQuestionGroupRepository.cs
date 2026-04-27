using Models;

namespace Repositories
{
    public interface IQuestionGroupRepository
    {
        Task<QuestionGroup?> GetByIdAsync(int id);
        Task<List<QuestionGroup>> GetByExamIdAsync(int examId);
        Task<QuestionGroup> CreateAsync(QuestionGroup questionGroup);
        Task UpdateAsync(QuestionGroup questionGroup);
        Task DeleteAsync(int id);
    }
}
