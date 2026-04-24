using Models;

namespace Repositories
{
    public interface ILessonRepository
    {
        Task<Lesson?> GetByIdWithLevelAsync(int lessonId);
        Task<List<Lesson>> GetAllWithLevelAsync();
    }
}
