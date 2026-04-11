using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/exam-questions")]
    public class ExamQuestionController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExamQuestionController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(ExamQuestion model)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.ExamQuestions.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? examId, [FromQuery] int? userId)
        {
            var query = _context.ExamQuestions
                .Include(x => x.Exam)
                .Include(x => x.User)
                .AsQueryable();

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            var questions = await query
                .OrderBy(x => x.ExamQuestionId)
                .ToListAsync();

            return Ok(questions);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var question = await _context.ExamQuestions
                .Include(x => x.Exam)
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.ExamQuestionId == id);

            if (question == null)
                return NotFound("Không tìm thấy câu hỏi");

            return Ok(question);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, ExamQuestion model)
        {
            var question = await _context.ExamQuestions.FindAsync(id);
            if (question == null)
                return NotFound("Không tìm thấy câu hỏi");

            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            question.Question = model.Question;
            question.OptionA = model.OptionA;
            question.OptionB = model.OptionB;
            question.OptionC = model.OptionC;
            question.OptionD = model.OptionD;
            question.CorrectAnswer = model.CorrectAnswer;
            question.AudioUrl = model.AudioUrl;
            question.UserId = model.UserId;
            question.ExamId = model.ExamId;

            await _context.SaveChangesAsync();
            return Ok(question);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var question = await _context.ExamQuestions.FindAsync(id);
            if (question == null)
                return NotFound("Không tìm thấy câu hỏi");

            _context.ExamQuestions.Remove(question);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá exam question");
        }
    }
}
