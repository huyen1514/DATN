using Models;

namespace Repositories
{
    public interface ITestHistoryRepository
    {
        Task<bool> UserExistsAsync(int userId);
        Task AddAsync(TestHistory testHistory);
        Task<List<TestHistory>> GetByUserIdAsync(int userId);
    }
}
