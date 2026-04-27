using Models;

namespace Repositories
{
    public interface IUserExamRepository
    {
        Task<UserExam?> GetByIdAsync(int id);
        Task<UserExam?> GetByUserIdAndExamIdAsync(int userId, int examId);
        Task<List<UserExam>> GetByUserIdAsync(int userId);
        Task<UserExam> CreateAsync(UserExam userExam);
        Task UpdateAsync(UserExam userExam);
        Task DeleteAsync(int id);
    }
}
