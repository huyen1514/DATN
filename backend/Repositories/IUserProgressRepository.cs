using Models;

namespace Repositories
{
    public interface IUserProgressRepository
    {
        Task<bool> UserExistsAsync(int userId);
        Task<bool> LessonExistsAsync(int lessonId);
        Task<UserProgress?> GetByUserAndLessonAsync(int userId, int lessonId);
        Task<List<UserProgress>> GetByUserIdAsync(int userId);
        Task AddAsync(UserProgress progress);
        Task UpdateAsync(UserProgress progress);
    }
}
