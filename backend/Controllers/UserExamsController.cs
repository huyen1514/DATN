using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/user-exams")]
    public class UserExamsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserExamsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(UserExams model)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.UserExams.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? userId, [FromQuery] int? examId)
        {
            var query = _context.UserExams
                .Include(x => x.User)
                .Include(x => x.Exam)
                .AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            var userExams = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(userExams);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userExam = await _context.UserExams
                .Include(x => x.User)
                .Include(x => x.Exam)
                .FirstOrDefaultAsync(x => x.UserExamId == id);

            if (userExam == null)
                return NotFound("Không tìm thấy quyền truy cập đề thi");

            return Ok(userExam);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UserExams model)
        {
            var userExam = await _context.UserExams.FindAsync(id);
            if (userExam == null)
                return NotFound("Không tìm thấy quyền truy cập đề thi");

            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            userExam.UserId = model.UserId;
            userExam.ExamId = model.ExamId;
            userExam.PurchaseDate = model.PurchaseDate;

            await _context.SaveChangesAsync();
            return Ok(userExam);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userExam = await _context.UserExams.FindAsync(id);
            if (userExam == null)
                return NotFound("Không tìm thấy quyền truy cập đề thi");

            _context.UserExams.Remove(userExam);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá user exam");
        }
    }
}
