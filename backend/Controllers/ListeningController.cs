using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/listenings")]
    public class ListeningController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ListeningController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Listening model)
        {
            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Listenings.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            var query = _context.Listenings
                .Include(x => x.Lesson)
                .AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var listenings = await query
                .OrderBy(x => x.ListeningId)
                .ToListAsync();

            return Ok(listenings);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var listening = await _context.Listenings
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.ListeningId == id);

            if (listening == null)
                return NotFound("Không tìm thấy bài nghe");

            return Ok(listening);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Listening model)
        {
            var listening = await _context.Listenings.FindAsync(id);
            if (listening == null)
                return NotFound("Không tìm thấy bài nghe");

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            listening.AudioUrl = model.AudioUrl;
            listening.ImageUrl = model.ImageUrl;
            listening.Transcript = model.Transcript;
            listening.Question = model.Question;
            listening.OptionA = model.OptionA;
            listening.OptionB = model.OptionB;
            listening.OptionC = model.OptionC;
            listening.OptionD = model.OptionD;
            listening.CorrectAnswer = model.CorrectAnswer;
            listening.LessonId = model.LessonId;

            await _context.SaveChangesAsync();
            return Ok(listening);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var listening = await _context.Listenings.FindAsync(id);
            if (listening == null)
                return NotFound("Không tìm thấy bài nghe");

            _context.Listenings.Remove(listening);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá listening");
        }
    }
}
