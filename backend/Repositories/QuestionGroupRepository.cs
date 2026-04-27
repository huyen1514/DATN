using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class QuestionGroupRepository : IQuestionGroupRepository
    {
        private readonly AppDbContext _context;

        public QuestionGroupRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<QuestionGroup?> GetByIdAsync(int id)
        {
            return await _context.QuestionGroups
                .Include(qg => qg.Questions)
                .FirstOrDefaultAsync(qg => qg.QuestionGroupId == id);
        }

        public async Task<List<QuestionGroup>> GetByExamIdAsync(int examId)
        {
            return await _context.QuestionGroups
                .Where(qg => qg.ExamId == examId)
                .Include(qg => qg.Questions)
                .ToListAsync();
        }

        public async Task<QuestionGroup> CreateAsync(QuestionGroup questionGroup)
        {
            _context.QuestionGroups.Add(questionGroup);
            await _context.SaveChangesAsync();
            return questionGroup;
        }

        public async Task UpdateAsync(QuestionGroup questionGroup)
        {
            _context.QuestionGroups.Update(questionGroup);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var questionGroup = await _context.QuestionGroups.FindAsync(id);
            if (questionGroup != null)
            {
                _context.QuestionGroups.Remove(questionGroup);
                await _context.SaveChangesAsync();
            }
        }
    }
}
