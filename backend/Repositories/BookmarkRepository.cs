using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class BookmarkRepository : IBookmarkRepository
    {
        private readonly AppDbContext _context;

        public BookmarkRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UserExistsAsync(int userId)
        {
            return await _context.Users.AnyAsync(x => x.UserId == userId);
        }

        public async Task<bool> LessonExistsAsync(int lessonId)
        {
            return await _context.Lessons.AnyAsync(x => x.LessonId == lessonId);
        }

        public async Task<bool> VocabularyExistsAsync(int vocabularyId)
        {
            return await _context.Vocabularies.AnyAsync(x => x.VocabularyId == vocabularyId);
        }

        public async Task<string?> GetLessonNameAsync(int lessonId)
        {
            return await _context.Lessons
                .Where(x => x.LessonId == lessonId)
                .Select(x => x.LessonName)
                .FirstOrDefaultAsync();
        }

        public async Task<string?> GetVocabularyNameAsync(int vocabularyId)
        {
            return await _context.Vocabularies
                .Where(x => x.VocabularyId == vocabularyId)
                .Select(x => x.Word)
                .FirstOrDefaultAsync();
        }

        // --- Batch Queries ---
        public async Task<Dictionary<int, string>> GetLessonNamesAsync(IEnumerable<int> lessonIds)
        {
            return await _context.Lessons
                .AsNoTracking()
                .Where(x => lessonIds.Contains(x.LessonId))
                .ToDictionaryAsync(x => x.LessonId, x => x.LessonName);
        }

        public async Task<Dictionary<int, string>> GetVocabularyNamesAsync(IEnumerable<int> vocabularyIds)
        {
            return await _context.Vocabularies
                .AsNoTracking()
                .Where(x => vocabularyIds.Contains(x.VocabularyId))
                .ToDictionaryAsync(x => x.VocabularyId, x => x.Word);
        }

        public async Task<Bookmark?> GetByKeyAsync(int userId, int itemId, string type)
        {
            return await _context.Bookmarks
                .FirstOrDefaultAsync(x => x.UserId == userId && x.ItemId == itemId && x.Type == type);
        }

        public async Task<List<Bookmark>> GetByUserIdAsync(int userId)
        {
            return await _context.Bookmarks
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Bookmark bookmark)
        {
            _context.Bookmarks.Add(bookmark);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(Bookmark bookmark)
        {
            _context.Bookmarks.Remove(bookmark);
            await _context.SaveChangesAsync();
        }
    }
}