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
        Task<bool> ReadingExistsAsync(int readingId);
        Task<bool> ListeningExistsAsync(int listeningId);
        Task<bool> ExamExistsAsync(int examId);
        
        Task<string?> GetLessonNameAsync(int lessonId);
        Task<string?> GetVocabularyNameAsync(int vocabularyId);
        Task<string?> GetGrammarNameAsync(int grammarId);
        Task<string?> GetKanjiNameAsync(int kanjiId);
        Task<string?> GetReadingNameAsync(int readingId);
        Task<string?> GetListeningNameAsync(int listeningId);
        Task<string?> GetExamNameAsync(int examId);
        
        // Cấp quyền truy vấn theo Batch (Gom nhóm) để chống N+1 Query
        Task<Dictionary<int, string>> GetLessonNamesAsync(IEnumerable<int> lessonIds);
        Task<Dictionary<int, string>> GetVocabularyNamesAsync(IEnumerable<int> vocabularyIds);
        Task<Dictionary<int, string>> GetGrammarNamesAsync(IEnumerable<int> grammarIds);
        Task<Dictionary<int, string>> GetKanjiNamesAsync(IEnumerable<int> kanjiIds);
        Task<Dictionary<int, string>> GetReadingNamesAsync(IEnumerable<int> readingIds);
        Task<Dictionary<int, string>> GetListeningNamesAsync(IEnumerable<int> listeningIds);
        Task<Dictionary<int, string>> GetExamNamesAsync(IEnumerable<int> examIds);
        
        Task<Bookmark?> GetByKeyAsync(int userId, int itemId, string type);
        Task<List<Bookmark>> GetByUserIdAsync(int userId);
        Task AddAsync(Bookmark bookmark);
        Task DeleteAsync(Bookmark bookmark);
    }
}