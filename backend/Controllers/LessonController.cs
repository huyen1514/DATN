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
            // Kiểm tra Level có tồn tại không
            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

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
                .AsNoTracking() // Tối ưu hiệu năng đọc
                .OrderBy(x => x.LessonId)
                .Select(x => new 
                {
                    x.LessonId,
                    x.LessonName,
                    x.SkillType,
                    x.LevelId,
                    LevelName = x.Level != null ? x.Level.LevelName : null,
                    x.CreatedAt // ĐÃ THÊM DÒNG NÀY ĐỂ FIX LỖI INVALID DATE
                })
                .ToListAsync();

            return Ok(lessons);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var lesson = await _context.Lessons
                .AsNoTracking()
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
                .AsNoTracking()
                .Where(x => x.LevelId == levelId)
                .OrderBy(x => x.LessonId)
                .Select(x => new 
                {
                    x.LessonId,
                    x.LessonName,
                    x.SkillType,
                    x.LevelId,
                    VocabularyCount = x.Vocabularies.Count, // Đếm trực tiếp số từ vựng thuộc bài học này
                    x.CreatedAt // ĐÃ THÊM DÒNG NÀY Ở ĐÂY NỮA
                })
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

            // Kiểm tra Level có tồn tại không
            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            lesson.LessonName = model.LessonName;
            lesson.LevelId = model.LevelId;
            lesson.SkillType = model.SkillType;
            lesson.UpdatedAt = DateTime.UtcNow;

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