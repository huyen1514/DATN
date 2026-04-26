using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/grammars")]
    public class GrammarController : ControllerBase
    {
        private readonly AppDbContext _context;

        public GrammarController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Grammar model)
        {
            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Grammars.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            var query = _context.Grammars
                .AsNoTracking() // Tối ưu: Không theo dõi tracking
                .Include(x => x.Lesson)
                .AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var grammars = await query
                .OrderBy(x => x.GrammarId)
                .ToListAsync();

            return Ok(grammars);
        }

        [HttpGet("counts")]
        public async Task<IActionResult> GetCounts()
        {
            var counts = await _context.Grammars
                .AsNoTracking() // Tối ưu
                .GroupBy(g => g.LessonId)
                .Select(g => new { LessonId = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(counts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var grammar = await _context.Grammars
                .AsNoTracking() // Tối ưu
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.GrammarId == id);

            if (grammar == null)
                return NotFound("Không tìm thấy ngữ pháp");

            return Ok(grammar);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Grammar model)
        {
            var grammar = await _context.Grammars.FindAsync(id);
            if (grammar == null)
                return NotFound("Không tìm thấy ngữ pháp");

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            grammar.GrammarName = model.GrammarName;
            grammar.Structure = model.Structure;
            grammar.Meaning = model.Meaning;
            grammar.Example = model.Example;
            grammar.LessonId = model.LessonId;

            await _context.SaveChangesAsync();
            return Ok(grammar);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var grammar = await _context.Grammars.FindAsync(id);
            if (grammar == null)
                return NotFound("Không tìm thấy ngữ pháp");

            _context.Grammars.Remove(grammar);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá grammar");
        }
    }
}