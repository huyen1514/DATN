using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class TestHistoryRepository : ITestHistoryRepository
    {
        private readonly AppDbContext _context;

        public TestHistoryRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> UserExistsAsync(int userId)
        {
            return await _context.Users.AnyAsync(x => x.UserId == userId);
        }

        public async Task AddAsync(TestHistory testHistory)
        {
            _context.TestHistories.Add(testHistory);
            await _context.SaveChangesAsync();
        }

        public async Task<List<TestHistory>> GetByUserIdAsync(int userId)
        {
            return await _context.TestHistories
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.Date)
                .ToListAsync();
        }
    }
}
