using DTOs.Bookmark;
using Models;
using Repositories;

namespace Services
{
    public class BookmarkService : IBookmarkService
    {
        private const string LessonType = "Lesson";
        private const string VocabularyType = "Vocabulary";
        private const string GrammarType = "Grammar";
        private const string KanjiType = "Kanji";

        private readonly IBookmarkRepository _bookmarkRepository;

        public BookmarkService(IBookmarkRepository bookmarkRepository)
        {
            _bookmarkRepository = bookmarkRepository;
        }

        // Tối ưu Use case: Xử lý Toggle (Bấm lần 1 là Lưu, bấm lại là Bỏ lưu)
        public async Task<bool> ToggleAsync(CreateBookmarkRequest request)
        {
            var normalizedType = NormalizeType(request.Type);

            if (!await _bookmarkRepository.UserExistsAsync(request.UserId))
                throw new KeyNotFoundException("User was not found.");

            await ValidateItemAsync(request.ItemId, normalizedType);

            var existingBookmark = await _bookmarkRepository.GetByKeyAsync(request.UserId, request.ItemId, normalizedType);
            
            if (existingBookmark != null)
            {
                await _bookmarkRepository.DeleteAsync(existingBookmark);
                return false; // False = Đã bỏ lưu (Un-bookmarked)
            }

            var bookmark = new Bookmark
            {
                UserId = request.UserId,
                ItemId = request.ItemId,
                Type = normalizedType,
                CreatedAt = DateTime.UtcNow
            };

            await _bookmarkRepository.AddAsync(bookmark);
            return true; // True = Đã lưu thành công (Bookmarked)
        }

        public async Task DeleteAsync(DeleteBookmarkRequest request)
        {
            var normalizedType = NormalizeType(request.Type);

            if (!await _bookmarkRepository.UserExistsAsync(request.UserId))
                throw new KeyNotFoundException("User was not found.");

            var bookmark = await _bookmarkRepository.GetByKeyAsync(request.UserId, request.ItemId, normalizedType);
            if (bookmark == null)
                throw new KeyNotFoundException("Bookmark was not found.");

            await _bookmarkRepository.DeleteAsync(bookmark);
        }

        // Tối ưu Hiệu năng: Xử lý triệt để lỗi N+1 Query bằng kỹ thuật gom nhóm (Batch Mapping)
        public async Task<List<BookmarkResponse>> GetByUserAsync(int userId)
        {
            if (!await _bookmarkRepository.UserExistsAsync(userId))
                throw new KeyNotFoundException("User was not found.");

            var bookmarks = await _bookmarkRepository.GetByUserIdAsync(userId);
            if (!bookmarks.Any()) return new List<BookmarkResponse>();

            var lessonIds = bookmarks.Where(b => b.Type == LessonType).Select(b => b.ItemId).Distinct().ToList();
            var vocabIds = bookmarks.Where(b => b.Type == VocabularyType).Select(b => b.ItemId).Distinct().ToList();
            var grammarIds = bookmarks.Where(b => b.Type == GrammarType).Select(b => b.ItemId).Distinct().ToList();
            var kanjiIds = bookmarks.Where(b => b.Type == KanjiType).Select(b => b.ItemId).Distinct().ToList();

            var lessonNames = lessonIds.Any() ? await _bookmarkRepository.GetLessonNamesAsync(lessonIds) : new Dictionary<int, string>();
            var vocabNames = vocabIds.Any() ? await _bookmarkRepository.GetVocabularyNamesAsync(vocabIds) : new Dictionary<int, string>();
            var grammarNames = grammarIds.Any() ? await _bookmarkRepository.GetGrammarNamesAsync(grammarIds) : new Dictionary<int, string>();
            var kanjiNames = kanjiIds.Any() ? await _bookmarkRepository.GetKanjiNamesAsync(kanjiIds) : new Dictionary<int, string>();

            return bookmarks.Select(bookmark => new BookmarkResponse
            {
                BookmarkId = bookmark.BookmarkId,
                UserId = bookmark.UserId,
                ItemId = bookmark.ItemId,
                Type = bookmark.Type,
                ItemName = bookmark.Type switch
                {
                    LessonType => lessonNames.GetValueOrDefault(bookmark.ItemId, string.Empty),
                    VocabularyType => vocabNames.GetValueOrDefault(bookmark.ItemId, string.Empty),
                    GrammarType => grammarNames.GetValueOrDefault(bookmark.ItemId, string.Empty),
                    KanjiType => kanjiNames.GetValueOrDefault(bookmark.ItemId, string.Empty),
                    _ => string.Empty
                },
                CreatedAt = bookmark.CreatedAt
            }).ToList();
        }

        private async Task ValidateItemAsync(int itemId, string normalizedType)
        {
            var exists = normalizedType switch
            {
                LessonType => await _bookmarkRepository.LessonExistsAsync(itemId),
                VocabularyType => await _bookmarkRepository.VocabularyExistsAsync(itemId),
                GrammarType => await _bookmarkRepository.GrammarExistsAsync(itemId),
                KanjiType => await _bookmarkRepository.KanjiExistsAsync(itemId),
                _ => false
            };

            if (!exists)
                throw new KeyNotFoundException($"{normalizedType} was not found.");
        }

        private static string NormalizeType(string type)
        {
            if (string.Equals(type, LessonType, StringComparison.OrdinalIgnoreCase))
                return LessonType;

            if (string.Equals(type, VocabularyType, StringComparison.OrdinalIgnoreCase) 
                || string.Equals(type, "Vocab", StringComparison.OrdinalIgnoreCase))
                return VocabularyType;

            if (string.Equals(type, GrammarType, StringComparison.OrdinalIgnoreCase))
                return GrammarType;

            if (string.Equals(type, KanjiType, StringComparison.OrdinalIgnoreCase))
                return KanjiType;

            throw new ArgumentException("Type must be Lesson, Vocabulary, Grammar, or Kanji.");
        }
    }
}