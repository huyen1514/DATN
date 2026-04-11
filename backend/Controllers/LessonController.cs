using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/lessons")]
    public class LessonController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LessonController(AppDbContext context)
        {
            _context = context;
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create(Lesson model)
        {
            model.CreatedAt = DateTime.UtcNow;

            _context.Lessons.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var lessons = await _context.Lessons
                .Include(x => x.Level)
                .OrderBy(x => x.LessonId)
                .ToListAsync();

            return Ok(lessons);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var lesson = await _context.Lessons
                .Include(x => x.Level)
                .FirstOrDefaultAsync(x => x.LessonId == id);

            if (lesson == null)
                return NotFound("Không tìm thấy bài học");

            return Ok(lesson);
        }

        // GET BY LEVEL
        [HttpGet("level/{levelId}")]
        public async Task<IActionResult> GetByLevel(int levelId)
        {
            var lessons = await _context.Lessons
                .Where(x => x.LevelId == levelId)
                .OrderBy(x => x.LessonId)
                .ToListAsync();

            return Ok(lessons);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Lesson model)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound("Không tìm thấy bài học");

            lesson.LessonName = model.LessonName;
            lesson.LevelId = model.LevelId;

            await _context.SaveChangesAsync();

            return Ok(lesson);
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var lesson = await _context.Lessons.FindAsync(id);

            if (lesson == null)
                return NotFound("Không tìm thấy bài học");

            _context.Lessons.Remove(lesson);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá lesson");
        }
    }
}