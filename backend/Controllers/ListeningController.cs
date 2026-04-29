using Data;
using DTOs.Listening; 
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using Services; 

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
        public async Task<IActionResult> Create([FromBody] ListeningCreateDto createDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == createDto.LessonId);
            if (!lessonExists)
                return BadRequest(new { message = "Lesson không tồn tại" });

            var listening = new Listening
            {
                AudioUrl = createDto.AudioUrl,
                ImageUrl = createDto.ImageUrl,
                Transcript = createDto.Transcript,
                Question = createDto.Question,
                OptionA = createDto.OptionA,
                OptionB = createDto.OptionB,
                OptionC = createDto.OptionC,
                OptionD = createDto.OptionD,
                CorrectAnswer = createDto.CorrectAnswer,
                LessonId = createDto.LessonId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Listenings.Add(listening);
            await _context.SaveChangesAsync();

            // Load thêm thông tin Lesson để trả về sau khi tạo mới
            _context.Entry(listening).Reference(x => x.Lesson).Load();

            var readDto = MapToReadDto(listening);

            return CreatedAtAction(nameof(GetById), new { id = listening.ListeningId }, readDto);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? lessonId)
        {
            // THÊM: .Include(x => x.Lesson) để join với bảng Lesson
            var query = _context.Listenings.Include(x => x.Lesson).AsQueryable();

            if (lessonId.HasValue)
                query = query.Where(x => x.LessonId == lessonId.Value);

            var listenings = await query
                .OrderBy(x => x.ListeningId)
                .ToListAsync();

            var readDtos = listenings.Select(MapToReadDto).ToList();

            return Ok(readDtos);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var listening = await _context.Listenings
                .Include(x => x.Lesson) // THÊM: .Include(x => x.Lesson) ở đây nữa
                .FirstOrDefaultAsync(x => x.ListeningId == id);

            if (listening == null)
                return NotFound(new { message = "Không tìm thấy bài nghe" });

            return Ok(MapToReadDto(listening));
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ListeningUpdateDto updateDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            if (id != updateDto.ListeningId)
                return BadRequest(new { message = "ID trên URL và ID trong dữ liệu không khớp" });

            var listening = await _context.Listenings.FindAsync(id);
            if (listening == null)
                return NotFound(new { message = "Không tìm thấy bài nghe" });

            var lessonExists = await _context.Lessons.AnyAsync(x => x.LessonId == updateDto.LessonId);
            if (!lessonExists)
                return BadRequest(new { message = "Lesson không tồn tại" });

            listening.AudioUrl = updateDto.AudioUrl;
            listening.ImageUrl = updateDto.ImageUrl;
            listening.Transcript = updateDto.Transcript;
            listening.Question = updateDto.Question;
            listening.OptionA = updateDto.OptionA;
            listening.OptionB = updateDto.OptionB;
            listening.OptionC = updateDto.OptionC;
            listening.OptionD = updateDto.OptionD;
            listening.CorrectAnswer = updateDto.CorrectAnswer;
            listening.LessonId = updateDto.LessonId;

            await _context.SaveChangesAsync();

            // Load thêm thông tin Lesson để map DTO trả về chính xác
            _context.Entry(listening).Reference(x => x.Lesson).Load();

            return Ok(MapToReadDto(listening));
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var listening = await _context.Listenings.FindAsync(id);
            if (listening == null)
                return NotFound(new { message = "Không tìm thấy bài nghe" });

            _context.Listenings.Remove(listening);
            await _context.SaveChangesAsync();

            return NoContent(); 
        }

        // ==========================================
        // API IMPORT DỮ LIỆU TỪ THƯ MỤC
        // ==========================================
        [HttpPost("import-data")]
        public async Task<IActionResult> ImportFromFolder([FromServices] ListenImportService importService)
        {
            try
            {
                await importService.ImportAllFromFolderAsync();
                return Ok(new { message = "Đã thực hiện quét và import dữ liệu từ thư mục wwwroot/data/Listenings" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Lỗi khi import: {ex.Message}" });
            }
        }

        #region Helper Methods

        private static ListeningReadDto MapToReadDto(Listening listening)
        {
            return new ListeningReadDto
            {
                ListeningId = listening.ListeningId,
                AudioUrl = listening.AudioUrl,
                ImageUrl = listening.ImageUrl,
                Transcript = listening.Transcript,
                Question = listening.Question,
                OptionA = listening.OptionA,
                OptionB = listening.OptionB,
                OptionC = listening.OptionC,
                OptionD = listening.OptionD,
                CorrectAnswer = listening.CorrectAnswer,
                LessonId = listening.LessonId,
                CreatedAt = listening.CreatedAt,
                // THÊM DÒNG NÀY ĐỂ MAP TÊN BÀI HỌC VÀO DTO
                LessonName = listening.Lesson?.LessonName 
            };
        }

        #endregion
    }
}