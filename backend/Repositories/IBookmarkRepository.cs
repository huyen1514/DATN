using Models;

namespace Repositories
{
    public interface IBookmarkRepository
    {
        Task<bool> UserExistsAsync(int userId);
        Task<bool> LessonExistsAsync(int lessonId);
        Task<bool> VocabularyExistsAsync(int vocabularyId);
        
        Task<string?> GetLessonNameAsync(int lessonId);
        Task<string?> GetVocabularyNameAsync(int vocabularyId);
        
        // Cấp quyền truy vấn theo Batch (Gom nhóm) để chống N+1 Query
        Task<Dictionary<int, string>> GetLessonNamesAsync(IEnumerable<int> lessonIds);
        Task<Dictionary<int, string>> GetVocabularyNamesAsync(IEnumerable<int> vocabularyIds);
        
        Task<Bookmark?> GetByKeyAsync(int userId, int itemId, string type);
        Task<List<Bookmark>> GetByUserIdAsync(int userId);
        Task AddAsync(Bookmark bookmark);
        Task DeleteAsync(Bookmark bookmark);
    }
}