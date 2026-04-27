using Data;
using Microsoft.EntityFrameworkCore;
using backend.DTOs.Exam;

namespace Services
{
    public class ExamService : IExamService
    {
        private readonly AppDbContext _context;

        public ExamService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(List<ExamResponseDto> Data, int Total)> GetExamsAsync(int? levelId, int page, int pageSize)
        {
            var query = _context.Exams.AsNoTracking().AsQueryable();

            if (levelId.HasValue) 
                query = query.Where(x => x.LevelId == levelId.Value);

            var exams = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(e => new ExamResponseDto 
                {
                    ExamId = e.ExamId,
                    ExamName = e.ExamName,
                    Duration = e.Duration,
                    LevelName = e.Level != null ? e.Level.LevelName : "N/A",
                    Price = e.Price,
                    IsActive = e.IsActive,
                    TotalQuestions = e.Questions.Count,
                    CreatedAt = e.CreatedAt
                })
                .ToListAsync();

            var totalRecords = await query.CountAsync();

            return (exams, totalRecords);
        }

        public async Task<ExamResponseDto?> GetExamByIdAsync(int id)
        {
            var exam = await _context.Exams
                .AsNoTracking()
                .Where(x => x.ExamId == id)
                .Select(e => new ExamResponseDto 
                {
                    ExamId = e.ExamId,
                    ExamName = e.ExamName,
                    Duration = e.Duration,
                    LevelName = e.Level != null ? e.Level.LevelName : "N/A",
                    Price = e.Price,
                    IsActive = e.IsActive,
                    TotalQuestions = e.Questions.Count,
                    CreatedAt = e.CreatedAt
                })
                .FirstOrDefaultAsync();

            return exam;
        }

        public async Task<bool> UpdateExamAsync(int id, ExamUpdateDto updateData)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null) return false;

            if (exam.LevelId != updateData.LevelId)
            {
                var levelExists = await _context.Levels.AnyAsync(l => l.LevelId == updateData.LevelId);
                if (!levelExists) throw new ArgumentException("Level không tồn tại");
                exam.LevelId = updateData.LevelId;
            }

            exam.ExamName = updateData.ExamName;
            exam.Duration = updateData.Duration;
            exam.Price = updateData.Price;
            exam.IsActive = updateData.IsActive;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteExamAsync(int id)
        {
            var rowsAffected = await _context.Exams
                .Where(x => x.ExamId == id)
                .ExecuteDeleteAsync();

            return rowsAffected > 0;
        }

        public async Task<ExamResponseDto?> CreateExamAsync(ExamCreateDto createData)
        {
            var levelExists = await _context.Levels.AnyAsync(l => l.LevelId == createData.LevelId);
            if (!levelExists) throw new ArgumentException("Level không tồn tại");

            var exam = new Models.Exam
            {
                ExamName = createData.ExamName,
                Duration = createData.Duration,
                LevelId = createData.LevelId,
                Price = createData.Price,
                PassScaledTotal = createData.PassScaledTotal,
                PassScaledVocabularyGrammar = createData.PassScaledVocabularyGrammar,
                PassScaledReading = createData.PassScaledReading,
                PassScaledListening = createData.PassScaledListening,
                PassScaledVocabularyGrammarReading = createData.PassScaledVocabularyGrammarReading,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            return await GetExamByIdAsync(exam.ExamId);
        }
    }
}
