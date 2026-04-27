using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models; // Đổi lại namespace theo project của bạn
using Data;   // Đổi lại namespace chứa AppDbContext của bạn

namespace Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ReadingsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReadingsController(AppDbContext context)
        {
            _context = context;
        }

        // 1. LẤY DANH SÁCH BÀI ĐỌC THEO BÀI HỌC (GET: api/readings/lesson/5)
        // API quan trọng nhất để Frontend render lúc học
        [HttpGet("lesson/{lessonId}")]
        public async Task<ActionResult<IEnumerable<ReadingPassage>>> GetReadingsByLessonId(int lessonId)
        {
            // Dùng .Include() để lấy luôn danh sách các câu hỏi đi kèm bài đọc đó
            var passages = await _context.ReadingPassages
                .Include(p => p.ReadingQuestions)
                .Where(p => p.LessonId == lessonId)
                .ToListAsync();

            if (passages == null || passages.Count == 0)
            {
                return NotFound(new { message = "Chưa có bài đọc nào cho bài học này." });
            }

            return Ok(passages);
        }

        // LẤY TẤT CẢ BÀI ĐỌC (GET: api/readings)
        // Dùng cho trang quản trị (Admin Dashboard)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ReadingPassage>>> GetAllReadings()
        {
            var passages = await _context.ReadingPassages
                .Include(p => p.ReadingQuestions)
                .Include(p => p.Lesson)
                .ToListAsync();

            return Ok(passages);
        }

        // 2. LẤY CHI TIẾT 1 BÀI ĐỌC (GET: api/readings/5)
        [HttpGet("{id}")]
        public async Task<ActionResult<ReadingPassage>> GetReadingPassage(int id)
        {
            var readingPassage = await _context.ReadingPassages
                .Include(p => p.ReadingQuestions)
                .FirstOrDefaultAsync(p => p.PassageId == id);

            if (readingPassage == null)
            {
                return NotFound(new { message = "Không tìm thấy bài đọc." });
            }

            return Ok(readingPassage);
        }

        // 3. THÊM MỚI BÀI ĐỌC & CÁC CÂU HỎI (POST: api/readings)
        /* Payload JSON mẫu gửi lên:
           {
             "content": "Đoạn văn tiếng Nhật...",
             "lessonId": 1,
             "readingQuestions": [
               { "questionText": "Câu 1?", "option1": "A", "option2": "B", "correctOption": 1 },
               { "questionText": "Câu 2?", "option1": "A", "option2": "B", "correctOption": 2 }
             ]
           }
        */
        [HttpPost]
        public async Task<ActionResult<ReadingPassage>> PostReadingPassage(ReadingPassage readingPassage)
        {
            readingPassage.CreatedAt = DateTime.UtcNow;

            // Nếu có gửi kèm câu hỏi, set CreatedAt cho từng câu hỏi
            if (readingPassage.ReadingQuestions != null && readingPassage.ReadingQuestions.Any())
            {
                foreach (var q in readingPassage.ReadingQuestions)
                {
                    q.CreatedAt = DateTime.UtcNow;
                }
            }

            _context.ReadingPassages.Add(readingPassage);
            await _context.SaveChangesAsync();

            // Trả về dữ liệu vừa tạo thành công
            return CreatedAtAction(nameof(GetReadingPassage), new { id = readingPassage.PassageId }, readingPassage);
        }

        // 4. CẬP NHẬT BÀI ĐỌC (PUT: api/readings/5)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutReadingPassage(int id, ReadingPassage readingPassage)
        {
            if (id != readingPassage.PassageId)
            {
                return BadRequest(new { message = "ID không khớp." });
            }

            readingPassage.UpdatedAt = DateTime.UtcNow;
            _context.Entry(readingPassage).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ReadingPassageExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 5. XÓA BÀI ĐỌC (DELETE: api/readings/5)
        // Khi xóa bài đọc, hệ thống tự động xóa luôn các câu hỏi đi kèm nhờ tính năng Cascade Delete của EF Core
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteReadingPassage(int id)
        {
            var readingPassage = await _context.ReadingPassages
                // Phải Include để đảm bảo khi xóa, EF Core biết đường xóa luôn câu hỏi con
                .Include(p => p.ReadingQuestions) 
                .FirstOrDefaultAsync(p => p.PassageId == id);

            if (readingPassage == null)
            {
                return NotFound();
            }

            _context.ReadingPassages.Remove(readingPassage);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        private bool ReadingPassageExists(int id)
        {
            return _context.ReadingPassages.Any(e => e.PassageId == id);
        }
    }
}