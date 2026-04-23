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

        public async Task<LessonProgress> UpsertProgressAsync(int userId, int lessonId, string partType, string status, decimal? score)
        {
            var progress = await _context.LessonProgresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LessonId == lessonId && p.PartType == partType);

            if (progress == null)
            {
                progress = new LessonProgress
                {
                    UserId = userId,
                    LessonId = lessonId,
                    PartType = partType,
                    Status = status,
                    Score = score,
                    LastAccessedAt = DateTime.UtcNow
                };
                _context.LessonProgresses.Add(progress);
            }
            else
            {
                progress.Status = status;
                progress.Score = score;
                progress.LastAccessedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return progress;
        }

        public async Task<IEnumerable<LessonProgress>> GetLessonProgressesAsync(int lessonId, int userId)
        {
            return await _context.LessonProgresses
                .Where(p => p.LessonId == lessonId && p.UserId == userId)
                .ToListAsync();
        }

        public async Task<LessonProgress> GetRecentProgressAsync(int userId)
        {
            return await _context.LessonProgresses
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.LastAccessedAt)
                .FirstOrDefaultAsync();
        }
    }
}
