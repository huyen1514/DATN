using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/vocabularies")]
    public class VocabularyController : ControllerBase
    {
        private readonly AppDbContext _context;

        public VocabularyController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Vocabulary model)
        {
            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Vocabularies.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            var query = _context.Vocabularies.AsNoTracking().AsQueryable(); // Thêm AsNoTracking để tối ưu tốc độ đọc

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            // Dùng Select để tránh lỗi vòng lặp JSON khi dính Include Lesson
            var vocabularies = await query
                .OrderBy(x => x.VocabularyId)
                .Select(v => new 
                {
                    v.VocabularyId,
                    v.Word,
                    v.Reading,
                    v.Meaning,
                    v.Example,
                    v.PartOfSpeech,
                    v.AudioUrl,
                    v.LessonId,
                    LessonName = v.Lesson != null ? v.Lesson.LessonName : null // Lấy tên bài học từ Model Lesson
                })
                .ToListAsync();

            return Ok(vocabularies);
        }

        [HttpGet("counts")]
        public async Task<IActionResult> GetCounts()
        {
            // Thêm AsNoTracking cho câu truy vấn GroupBy
            var counts = await _context.Vocabularies
                .AsNoTracking()
                .GroupBy(v => v.LessonId)
                .Select(g => new { LessonId = g.Key, Count = g.Count() })
                .ToListAsync();

            return Ok(counts);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vocabulary = await _context.Vocabularies
                .AsNoTracking() // Tối ưu hiệu năng
                .Include(x => x.Lesson)
                .FirstOrDefaultAsync(x => x.VocabularyId == id);

            if (vocabulary == null)
                return NotFound("Không tìm thấy từ vựng");

            return Ok(vocabulary);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Vocabulary model)
        {
            var vocabulary = await _context.Vocabularies.FindAsync(id);
            if (vocabulary == null)
                return NotFound("Không tìm thấy từ vựng");

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == model.LessonId);
            if (!lessonExists)
                return BadRequest("Lesson không tồn tại");

            vocabulary.Word = model.Word;
            vocabulary.Reading = model.Reading;
            vocabulary.Meaning = model.Meaning;
            vocabulary.Example = model.Example;
            vocabulary.PartOfSpeech = model.PartOfSpeech;
            vocabulary.AudioUrl = model.AudioUrl;
            vocabulary.LessonId = model.LessonId;
            vocabulary.UpdatedAt = DateTime.UtcNow; // Cập nhật thời gian chỉnh sửa

            await _context.SaveChangesAsync();
            return Ok(vocabulary);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var vocabulary = await _context.Vocabularies.FindAsync(id);
            if (vocabulary == null)
                return NotFound("Không tìm thấy từ vựng");

            _context.Vocabularies.Remove(vocabulary);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá vocabulary");
        }
    }
}