using System.Collections.Generic;
using System.Threading.Tasks;
using Models;

namespace Repositories
{
    public interface IProgressRepository
    {
        Task<LessonProgress> UpsertProgressAsync(int userId, int lessonId, string partType, string status, decimal? score);
        Task<IEnumerable<LessonProgress>> GetLessonProgressesAsync(int lessonId, int userId);
        Task<LessonProgress> GetRecentProgressAsync(int userId);
    }
}
