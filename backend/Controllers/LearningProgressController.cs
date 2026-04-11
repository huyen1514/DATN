using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/learning-progress")]
    public class LearningProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LearningProgressController(AppDbContext context)
        {
            _context = context;
        }

        [HttpPost]
        public async Task<IActionResult> Create(LearningProgress model)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            model.LastAccessed = model.LastAccessed == default ? DateTime.UtcNow : model.LastAccessed;
            _context.LearningProgress.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? userId, [FromQuery] int? itemId)
        {
            var query = _context.LearningProgress.AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            if (itemId.HasValue)
                query = query.Where(x => x.ItemId == itemId.Value);

            var progress = await query
                .OrderByDescending(x => x.LastAccessed)
                .ToListAsync();

            return Ok(progress);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var progress = await _context.LearningProgress.FindAsync(id);
            if (progress == null)
                return NotFound("Không tìm thấy tiến độ học");

            return Ok(progress);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, LearningProgress model)
        {
            var progress = await _context.LearningProgress.FindAsync(id);
            if (progress == null)
                return NotFound("Không tìm thấy tiến độ học");

            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            progress.UserId = model.UserId;
            progress.ItemId = model.ItemId;
            progress.Status = model.Status;
            progress.Score = model.Score;
            progress.LastAccessed = model.LastAccessed == default ? DateTime.UtcNow : model.LastAccessed;

            await _context.SaveChangesAsync();
            return Ok(progress);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var progress = await _context.LearningProgress.FindAsync(id);
            if (progress == null)
                return NotFound("Không tìm thấy tiến độ học");

            _context.LearningProgress.Remove(progress);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá learning progress");
        }
    }
}
