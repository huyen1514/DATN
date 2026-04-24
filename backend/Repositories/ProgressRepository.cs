using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class ProgressRepository : IProgressRepository
    {
        private readonly AppDbContext _context;

        public ProgressRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UserExistsAsync(int userId) => 
            await _context.Users.AnyAsync(u => u.UserId == userId);

        public async Task<bool> LessonExistsAsync(int lessonId) => 
            await _context.Lessons.AnyAsync(l => l.LessonId == lessonId);

        public async Task<UserProgress?> GetUserProgressWithPartsAsync(int userId, int lessonId)
        {
            return await _context.UserProgresses
                .Include(up => up.LessonProgresses)
                .Include(up => up.Lesson).ThenInclude(l => l.Level)
                .FirstOrDefaultAsync(up => up.UserId == userId && up.LessonId == lessonId);
        }

        public async Task<List<UserProgress>> GetAllProgressByUserAsync(int userId)
        {
            return await _context.UserProgresses
                .Include(up => up.LessonProgresses)
                .Include(up => up.Lesson).ThenInclude(l => l.Level)
                .Where(up => up.UserId == userId)
                .OrderByDescending(up => up.LastAccessed)
                .ToListAsync();
        }

        public async Task<UserProgress?> GetRecentProgressAsync(int userId)
        {
            return await _context.UserProgresses
                .Include(up => up.LessonProgresses)
                .Include(up => up.Lesson).ThenInclude(l => l.Level)
                .Where(up => up.UserId == userId)
                .OrderByDescending(up => up.LastAccessed)
                .FirstOrDefaultAsync();
        }

        public async Task AddUserProgressAsync(UserProgress progress)
        {
            _context.UserProgresses.Add(progress);
        }

        public async Task SaveChangesAsync()
        {
            await _context.SaveChangesAsync();
        }
    }
}