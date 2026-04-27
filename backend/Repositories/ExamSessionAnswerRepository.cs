using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class ExamSessionAnswerRepository : IExamSessionAnswerRepository
    {
        private readonly AppDbContext _context;

        public ExamSessionAnswerRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExamSessionAnswer?> GetByIdAsync(int id)
        {
            return await _context.ExamSessionAnswers
                .Include(esa => esa.Session)
                .Include(esa => esa.Question)
                .FirstOrDefaultAsync(esa => esa.AnswerId == id);
        }

        public async Task<List<ExamSessionAnswer>> GetByExamSessionIdAsync(int examSessionId)
        {
            return await _context.ExamSessionAnswers
                .Where(esa => esa.SessionId == examSessionId)
                .Include(esa => esa.Question)
                .ToListAsync();
        }

        public async Task<ExamSessionAnswer> CreateAsync(ExamSessionAnswer examSessionAnswer)
        {
            _context.ExamSessionAnswers.Add(examSessionAnswer);
            await _context.SaveChangesAsync();
            return examSessionAnswer;
        }

        public async Task UpdateAsync(ExamSessionAnswer examSessionAnswer)
        {
            _context.ExamSessionAnswers.Update(examSessionAnswer);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var examSessionAnswer = await _context.ExamSessionAnswers.FindAsync(id);
            if (examSessionAnswer != null)
            {
                _context.ExamSessionAnswers.Remove(examSessionAnswer);
                await _context.SaveChangesAsync();
            }
        }
    }
}
