using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class LessonRepository : ILessonRepository
    {
        private readonly AppDbContext _context;

        public LessonRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<Lesson?> GetByIdWithLevelAsync(int lessonId)
        {
            return await _context.Lessons
                .Include(x => x.Level)
                .FirstOrDefaultAsync(x => x.LessonId == lessonId);
        }

        public async Task<List<Lesson>> GetAllWithLevelAsync()
        {
            return await _context.Lessons
                .Include(x => x.Level)
                .OrderBy(x => x.LessonId)
                .ToListAsync();
        }
    }
}
