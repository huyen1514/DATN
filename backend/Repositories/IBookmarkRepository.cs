using Models;

namespace Repositories
{
    public interface IBookmarkRepository
    {
        Task<bool> UserExistsAsync(int userId);
        Task<bool> LessonExistsAsync(int lessonId);
        Task<bool> VocabularyExistsAsync(int vocabularyId);
        Task<bool> GrammarExistsAsync(int grammarId);
        Task<bool> KanjiExistsAsync(int kanjiId);
        
        Task<string?> GetLessonNameAsync(int lessonId);
        Task<string?> GetVocabularyNameAsync(int vocabularyId);
        Task<string?> GetGrammarNameAsync(int grammarId);
        Task<string?> GetKanjiNameAsync(int kanjiId);
        
        // Cấp quyền truy vấn theo Batch (Gom nhóm) để chống N+1 Query
        Task<Dictionary<int, string>> GetLessonNamesAsync(IEnumerable<int> lessonIds);
        Task<Dictionary<int, string>> GetVocabularyNamesAsync(IEnumerable<int> vocabularyIds);
        Task<Dictionary<int, string>> GetGrammarNamesAsync(IEnumerable<int> grammarIds);
        Task<Dictionary<int, string>> GetKanjiNamesAsync(IEnumerable<int> kanjiIds);
        
        Task<Bookmark?> GetByKeyAsync(int userId, int itemId, string type);
        Task<List<Bookmark>> GetByUserIdAsync(int userId);
        Task AddAsync(Bookmark bookmark);
        Task DeleteAsync(Bookmark bookmark);
    }
}