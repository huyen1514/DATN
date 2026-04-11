using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/exams")]
    public class ExamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Exam model)
        {
            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Exams.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? levelId)
        {
            var query = _context.Exams
                .Include(x => x.Level)
                .AsQueryable();

            if (levelId.HasValue)
                query = query.Where(x => x.LevelId == levelId.Value);

            var exams = await query
                .OrderBy(x => x.ExamId)
                .ToListAsync();

            return Ok(exams);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var exam = await _context.Exams
                .Include(x => x.Level)
                .FirstOrDefaultAsync(x => x.ExamId == id);

            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            return Ok(exam);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Exam model)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            exam.ExamName = model.ExamName;
            exam.Duration = model.Duration;
            exam.LevelId = model.LevelId;

            await _context.SaveChangesAsync();
            return Ok(exam);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá exam");
        }
    }
}
