using System.Collections.Generic;
using System.Threading.Tasks;
using Models;

namespace Repositories
{
    public interface IProgressRepository
    {
        Task<bool> UserExistsAsync(int userId);
        Task<bool> LessonExistsAsync(int lessonId);
        Task<UserProgress?> GetUserProgressWithPartsAsync(int userId, int lessonId);
        Task<List<UserProgress>> GetAllProgressByUserAsync(int userId);
        Task<UserProgress?> GetRecentProgressAsync(int userId);
        Task AddUserProgressAsync(UserProgress progress);
        Task SaveChangesAsync();
    }
}