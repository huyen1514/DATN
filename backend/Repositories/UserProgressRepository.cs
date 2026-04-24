using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class UserProgressRepository : IUserProgressRepository
    {
        private readonly AppDbContext _context;

        public UserProgressRepository(AppDbContext context)
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

        public async Task<UserProgress?> GetByUserAndLessonAsync(int userId, int lessonId)
        {
            return await _context.UserProgresses
                .Include(x => x.Lesson!)
                .ThenInclude(x => x.Level)
                .FirstOrDefaultAsync(x => x.UserId == userId && x.LessonId == lessonId);
        }

        public async Task<List<UserProgress>> GetByUserIdAsync(int userId)
        {
            return await _context.UserProgresses
                .Include(x => x.Lesson!)
                .ThenInclude(x => x.Level)
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.LastAccessed)
                .ToListAsync();
        }

        public async Task AddAsync(UserProgress progress)
        {
            _context.UserProgresses.Add(progress);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(UserProgress progress)
        {
            _context.UserProgresses.Update(progress);
            await _context.SaveChangesAsync();
        }
    }
}
