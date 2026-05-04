using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Exam;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/exam-results")]
    public class ExamResultController : ControllerBase
    {
        private readonly IExamResultService _examResultService;

        public ExamResultController(IExamResultService examResultService)
        {
            _examResultService = examResultService;
        }

        [HttpPost("submit/{sessionId}")]
        public async Task<IActionResult> Submit(int sessionId)
        {
            var (success, message, data) = await _examResultService.SubmitAsync(sessionId);

            if (!success) 
            {
                if (message.Contains("Không tìm thấy")) return NotFound(new { Message = message });
                return BadRequest(new { Message = message });
            }

            return Ok(data);
        }

        // Lấy lịch sử làm bài của User
        [HttpGet("history/{userId}")]
        public async Task<IActionResult> GetUserHistory(int userId)
        {
            var results = await _examResultService.GetUserHistoryAsync(userId);
            return Ok(results);
        }

        [HttpGet("{examResultId}")]
        public async Task<IActionResult> GetResult(int examResultId)
        {
            var result = await _examResultService.ReviewExamAsync(examResultId);
            if (result == null) return NotFound(new { Message = "Không tìm thấy kết quả" });
            
            return Ok(result);
        }

        // API riêng để xem lại chi tiết 1 bài thi (Load SnapshotJson)
        [HttpGet("review/{examResultId}")]
        public async Task<IActionResult> ReviewExam(int examResultId)
        {
            var result = await _examResultService.ReviewExamAsync(examResultId);
            if (result == null) return NotFound(new { Message = "Không tìm thấy kết quả" });
            
            return Ok(result);
        }
    }
}