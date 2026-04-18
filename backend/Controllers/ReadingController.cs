using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/readings")]
    public class ReadingController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReadingController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Reading model)
        {
            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Readings.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            var query = _context.Readings
                .Include(x => x.Lesson)
                .AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var readings = await query
                .OrderBy(x => x.ReadingId)
                .ToListAsync();

            return Ok(readings);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var reading = await _context.Readings
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.ReadingId == id);

            if (reading == null)
                return NotFound("Không tìm thấy bài đọc");

            return Ok(reading);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Reading model)
        {
            var reading = await _context.Readings.FindAsync(id);
            if (reading == null)
                return NotFound("Không tìm thấy bài đọc");

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            // Cập nhật các trường dữ liệu cũ
            reading.Content = model.Content;
            reading.Question = model.Question;
            reading.LessonId = model.LessonId;

            // Cập nhật các trường trắc nghiệm mới được thêm vào Model
            reading.Option1 = model.Option1;
            reading.Option2 = model.Option2;
            reading.Option3 = model.Option3;
            reading.Option4 = model.Option4;
            reading.CorrectOption = model.CorrectOption;
            reading.ImageUrl = model.ImageUrl;

            await _context.SaveChangesAsync();
            return Ok(reading);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var reading = await _context.Readings.FindAsync(id);
            if (reading == null)
                return NotFound("Không tìm thấy bài đọc");

            _context.Readings.Remove(reading);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá reading");
        }
    }
}