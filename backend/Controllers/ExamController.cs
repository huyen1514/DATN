using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/exams")]
    public class ExamController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Exam model)
        {
            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Exams.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? levelId)
        {
            var query = _context.Exams
                .Include(x => x.Level)
                .AsQueryable();

            if (levelId.HasValue)
                query = query.Where(x => x.LevelId == levelId.Value);

            var exams = await query
                .OrderBy(x => x.ExamId)
                .ToListAsync();

            return Ok(exams);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var exam = await _context.Exams
                .Include(x => x.Level)
                .FirstOrDefaultAsync(x => x.ExamId == id);

            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            return Ok(exam);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Exam model)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            exam.ExamName = model.ExamName;
            exam.Duration = model.Duration;
            exam.LevelId = model.LevelId;

            await _context.SaveChangesAsync();
            return Ok(exam);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá exam");
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedExams()
        {
            var user = await _context.Users.FirstOrDefaultAsync();
            if (user == null)
            {
                user = new User { UserName = "admin_seed", Email = "admin@seed.com", PassWord = "hash", FullName = "Admin", Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var level = await _context.Levels.FirstOrDefaultAsync();
            if (level == null)
            {
                level = new Level { LevelName = "N5", Description = "Level N5" };
                _context.Levels.Add(level);
                await _context.SaveChangesAsync();
            }

            var exam1 = new Exam { ExamName = "JLPT N5 - Đề thi thử (Có Nghe)", Duration = 45, LevelId = level.LevelId, CreatedAt = DateTime.UtcNow };
            _context.Exams.Add(exam1);
            await _context.SaveChangesAsync();

            var questions = new List<ExamQuestion>
            {
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Từ 「学生」đọc là gì?", OptionA = "がくせい", OptionB = "がくせ", OptionC = "がっしょう", OptionD = "がくしょう", CorrectAnswer = AnswerOption.A, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Hãy nghe đoạn băng sau và chọn câu đúng.", OptionA = "Cô gái đi mua sắm.", OptionB = "Cậu bé đi thư viện.", OptionC = "Cô gái đi học.", OptionD = "Cả hai đi xem phim.", CorrectAnswer = AnswerOption.B, AudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Điền vào chỗ trống: わたし＿＿ベトナム人です。", OptionA = "が", OptionB = "は", OptionC = "の", OptionD = "を", CorrectAnswer = AnswerOption.B, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Hôm nay là thứ mấy? (Theo đoạn nghe)", OptionA = "Thứ hai", OptionB = "Thứ ba", OptionC = "Thứ sáu", OptionD = "Chủ nhật", CorrectAnswer = AnswerOption.C, AudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" }
            };

            _context.ExamQuestions.AddRange(questions);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã tạo dữ liệu mẫu thành công!", ExamId = exam1.ExamId });
        }
    }
}
