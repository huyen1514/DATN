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
            var query = _context.Vocabularies
                .Include(x => x.Lesson)
                .AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var vocabularies = await query
                .OrderBy(x => x.VocabularyId)
                .ToListAsync();

            return Ok(vocabularies);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var vocabulary = await _context.Vocabularies
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
