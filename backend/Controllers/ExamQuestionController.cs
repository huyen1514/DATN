using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Exam;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/exam-questions")]
    public class ExamQuestionController : ControllerBase
    {
        private readonly IExamQuestionService _examQuestionService;

        public ExamQuestionController(IExamQuestionService examQuestionService)
        {
            _examQuestionService = examQuestionService;
        }

        // Lấy chi tiết đề thi để hiển thị trên giao diện làm bài
        [HttpGet("exam-detail/{examId}")]
        public async Task<IActionResult> GetExamContent(int examId)
        {
            var examDetail = await _examQuestionService.GetExamContentAsync(examId);
            if (examDetail == null) return NotFound(new { Message = "Không tìm thấy đề thi" });
            return Ok(examDetail);
        }

        // Lấy danh sách tất cả câu hỏi (cho Admin)
        [HttpGet]
        public async Task<IActionResult> GetAllQuestions()
        {
            var questions = await _examQuestionService.GetAllQuestionsAsync();
            return Ok(questions);
        }

        // Tạo câu hỏi mới
        [HttpPost]
        public async Task<IActionResult> CreateQuestion([FromBody] ExamQuestionCreateDto dto)
        {
            var result = await _examQuestionService.CreateQuestionAsync(dto);
            if (result == null) return BadRequest(new { Message = "Không thể tạo câu hỏi. Kiểm tra lại ExamId." });
            return Ok(result);
        }

        // Cập nhật câu hỏi
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateQuestion(int id, [FromBody] ExamQuestionUpdateDto dto)
        {
            var success = await _examQuestionService.UpdateQuestionAsync(id, dto);
            if (!success) return NotFound(new { Message = "Không tìm thấy câu hỏi" });
            return Ok(new { Message = "Cập nhật câu hỏi thành công" });
        }

        // Xóa câu hỏi
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteQuestion(int id)
        {
            var success = await _examQuestionService.DeleteQuestionAsync(id);
            if (!success) return NotFound(new { Message = "Không tìm thấy câu hỏi" });
            return Ok(new { Message = "Đã xóa câu hỏi" });
        }
    }
}