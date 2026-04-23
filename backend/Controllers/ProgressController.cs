using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Repositories;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Data;
using Microsoft.EntityFrameworkCore;

namespace Controllers
{
    [ApiController]
    [Route("api/progress")]
    // [Authorize] // Uncomment if JWT authentication is fully enforced
    public class ProgressController : ControllerBase
    {
        private readonly IProgressRepository _progressRepo;
        private readonly AppDbContext _context;

        public ProgressController(IProgressRepository progressRepo, AppDbContext context)
        {
            _progressRepo = progressRepo;
            _context = context;
        }

        // DTOs for requests
        public class UpdateProgressRequest
        {
            public int UserId { get; set; }
            public int LessonId { get; set; }
            public string PartType { get; set; }
            public string Status { get; set; }
            public decimal? Score { get; set; }
        }

        [HttpPut("lesson")]
        public async Task<IActionResult> UpdateProgress([FromBody] UpdateProgressRequest request)
        {
            var progress = await _progressRepo.UpsertProgressAsync(request.UserId, request.LessonId, request.PartType, request.Status, request.Score);
            return Ok(progress);
        }

        [HttpGet("lesson/{lessonId}/user/{userId}")]
        public async Task<IActionResult> GetLessonProgress(int lessonId, int userId)
        {
            var progresses = await _progressRepo.GetLessonProgressesAsync(lessonId, userId);
            return Ok(progresses);
        }

        [HttpGet("all/{userId}")]
        public async Task<IActionResult> GetAllProgress(int userId)
        {
            var all = await _context.LessonProgresses
                .Where(p => p.UserId == userId)
                .OrderByDescending(p => p.LastAccessedAt)
                .ToListAsync();
            return Ok(all);
        }

        [HttpGet("recent/{userId}")]
        public async Task<IActionResult> GetRecentProgress(int userId)
        {
            var recent = await _progressRepo.GetRecentProgressAsync(userId);
            if (recent == null) return NotFound("No recent learning progress found.");

            var lesson = await _context.Lessons.Include(l => l.Level).FirstOrDefaultAsync(l => l.LessonId == recent.LessonId);
            var levelName = lesson?.Level?.LevelName?.ToLower() ?? "n5";

            return Ok(new {
                recent.LessonId,
                recent.PartType,
                recent.LastAccessedAt,
                LevelName = levelName
            });
        }
    }
}
