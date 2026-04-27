using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Exam;
using System.Security.Claims;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/exam-sessions")]
    public class ExamSessionController : ControllerBase
    {
        private readonly IExamSessionService _examSessionService;

        public ExamSessionController(IExamSessionService examSessionService)
        {
            _examSessionService = examSessionService;
        }

        [HttpPost("start")]
        public async Task<IActionResult> Start([FromBody] StartSessionRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized(new { Message = "Vui lòng đăng nhập để thi" });
            }

            var (success, message, data, statusCode) = await _examSessionService.StartSessionAsync(request, userId);

            if (!success)
            {
                return StatusCode(statusCode, new { Message = message });
            }

            return Ok(data);
        }

        [HttpPost("auto-save")]
        public async Task<IActionResult> AutoSave([FromBody] SubmitAnswerRequest request)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out int userId))
            {
                return Unauthorized();
            }

            var (success, message) = await _examSessionService.AutoSaveAnswerAsync(request, userId);
            
            if (!success) 
                return BadRequest(new { Message = message });

            return Ok(new { Message = message });
        }
    }
}