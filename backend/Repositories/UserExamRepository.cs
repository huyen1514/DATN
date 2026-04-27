using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class UserExamRepository : IUserExamRepository
    {
        private readonly AppDbContext _context;

        public UserExamRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<UserExam?> GetByIdAsync(int id)
        {
            return await _context.UserExams
                .Include(ue => ue.Exam)
                .Include(ue => ue.User)
                .FirstOrDefaultAsync(ue => ue.UserExamId == id);
        }

        public async Task<UserExam?> GetByUserIdAndExamIdAsync(int userId, int examId)
        {
            return await _context.UserExams
                .FirstOrDefaultAsync(ue => ue.UserId == userId && ue.ExamId == examId);
        }

        public async Task<List<UserExam>> GetByUserIdAsync(int userId)
        {
            return await _context.UserExams
                .Where(ue => ue.UserId == userId)
                .Include(ue => ue.Exam)
                .OrderByDescending(ue => ue.CreatedAt)
                .ToListAsync();
        }

        public async Task<UserExam> CreateAsync(UserExam userExam)
        {
            _context.UserExams.Add(userExam);
            await _context.SaveChangesAsync();
            return userExam;
        }

        public async Task UpdateAsync(UserExam userExam)
        {
            _context.UserExams.Update(userExam);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var userExam = await _context.UserExams.FindAsync(id);
            if (userExam != null)
            {
                _context.UserExams.Remove(userExam);
                await _context.SaveChangesAsync();
            }
        }
    }
}
