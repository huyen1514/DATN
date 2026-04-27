using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class ExamQuestionRepository : IExamQuestionRepository
    {
        private readonly AppDbContext _context;

        public ExamQuestionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExamQuestion?> GetByIdAsync(int id)
        {
            return await _context.ExamQuestions
                .Include(q => q.QuestionGroup)
                .FirstOrDefaultAsync(q => q.ExamQuestionId == id);
        }

        public async Task<List<ExamQuestion>> GetByExamIdAsync(int examId)
        {
            return await _context.ExamQuestions
                .Where(q => q.ExamId == examId)
                .Include(q => q.QuestionGroup)
                .ToListAsync();
        }

        public async Task<ExamQuestion> CreateAsync(ExamQuestion examQuestion)
        {
            _context.ExamQuestions.Add(examQuestion);
            await _context.SaveChangesAsync();
            return examQuestion;
        }

        public async Task UpdateAsync(ExamQuestion examQuestion)
        {
            _context.ExamQuestions.Update(examQuestion);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var examQuestion = await _context.ExamQuestions.FindAsync(id);
            if (examQuestion != null)
            {
                _context.ExamQuestions.Remove(examQuestion);
                await _context.SaveChangesAsync();
            }
        }
    }
}
