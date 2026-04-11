using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/exam-results")]
    public class ExamResultController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamResultController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(ExamResult model)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            if (model.CompletedAt == default)
                model.CompletedAt = DateTime.UtcNow;

            _context.ExamResults.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? examId, [FromQuery] int? userId)
        {
            var query = _context.ExamResults
                .Include(x => x.Exam)
                .Include(x => x.User)
                .AsQueryable();

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            var results = await query
                .OrderByDescending(x => x.CompletedAt)
                .ToListAsync();

            return Ok(results);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _context.ExamResults
                .Include(x => x.Exam)
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.ExamResultId == id);

            if (result == null)
                return NotFound("Không tìm thấy kết quả thi");

            return Ok(result);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ExamResult model)
        {
            var result = await _context.ExamResults.FindAsync(id);
            if (result == null)
                return NotFound("Không tìm thấy kết quả thi");

            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            result.Score = model.Score;
            result.TotalQuestion = model.TotalQuestion;
            result.AmountCorrectAnswers = model.AmountCorrectAnswers;
            result.IsPassed = model.IsPassed;
            result.Duration = model.Duration;
            result.CompletedAt = model.CompletedAt == default ? result.CompletedAt : model.CompletedAt;
            result.UserId = model.UserId;
            result.ExamId = model.ExamId;

            await _context.SaveChangesAsync();
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _context.ExamResults.FindAsync(id);
            if (result == null)
                return NotFound("Không tìm thấy kết quả thi");

            _context.ExamResults.Remove(result);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá exam result");
        }
    }
}
