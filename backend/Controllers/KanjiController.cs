using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/kanjis")]
    public class KanjiController : ControllerBase
    {
        private readonly AppDbContext _context;

        public KanjiController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Kanji model)
        {
            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Kanjis.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            var query = _context.Kanjis
                .Include(x => x.Lesson)
                .AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var kanjis = await query
                .OrderBy(x => x.KanjiId)
                .ToListAsync();

            return Ok(kanjis);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var kanji = await _context.Kanjis
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.KanjiId == id);

            if (kanji == null)
                return NotFound("Không tìm thấy kanji");

            return Ok(kanji);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Kanji model)
        {
            var kanji = await _context.Kanjis.FindAsync(id);
            if (kanji == null)
                return NotFound("Không tìm thấy kanji");

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            kanji.Character = model.Character;
            kanji.Meaning = model.Meaning;
            kanji.Onyomi = model.Onyomi;
            kanji.Kunyomi = model.Kunyomi;
            kanji.Example = model.Example;
            kanji.LessonId = model.LessonId;

            await _context.SaveChangesAsync();
            return Ok(kanji);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var kanji = await _context.Kanjis.FindAsync(id);
            if (kanji == null)
                return NotFound("Không tìm thấy kanji");

            _context.Kanjis.Remove(kanji);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá kanji");
        }
    }
}
