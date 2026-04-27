using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class ExamResultRepository : IExamResultRepository
    {
        private readonly AppDbContext _context;

        public ExamResultRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExamResult?> GetByIdAsync(int id)
        {
            return await _context.ExamResults
                .Include(er => er.Exam)
                .Include(er => er.User)
                .FirstOrDefaultAsync(er => er.ExamResultId == id);
        }

        public async Task<List<ExamResult>> GetByUserIdAsync(int userId)
        {
            return await _context.ExamResults
                .Where(er => er.UserId == userId)
                .Include(er => er.Exam)
                .OrderByDescending(er => er.CreatedAt)
                .ToListAsync();
        }

        public async Task<List<ExamResult>> GetByExamIdAsync(int examId)
        {
            return await _context.ExamResults
                .Where(er => er.ExamId == examId)
                .Include(er => er.User)
                .OrderByDescending(er => er.CreatedAt)
                .ToListAsync();
        }

        public async Task<ExamResult> CreateAsync(ExamResult examResult)
        {
            _context.ExamResults.Add(examResult);
            await _context.SaveChangesAsync();
            return examResult;
        }

        public async Task UpdateAsync(ExamResult examResult)
        {
            _context.ExamResults.Update(examResult);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var examResult = await _context.ExamResults.FindAsync(id);
            if (examResult != null)
            {
                _context.ExamResults.Remove(examResult);
                await _context.SaveChangesAsync();
            }
        }
    }
}
