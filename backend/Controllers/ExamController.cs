using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Exam;
using Services;
using System.Security.Claims;
using System.Text.Json;

namespace Controllers
{
    [ApiController]
    [Route("api/exams")]
    public class ExamController : ControllerBase
    {
        private readonly IExamService _examService;

        public ExamController(IExamService examService)
        {
            _examService = examService;
        }

        // Lấy danh sách đề thi kèm theo thông tin Level
        [HttpGet]
        public async Task<IActionResult> GetExams(
            [FromQuery] int? levelId,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20)
        {
            var (exams, totalRecords) = await _examService.GetExamsAsync(levelId, page, pageSize);
            return Ok(new { Data = exams, Total = totalRecords, Page = page, PageSize = pageSize });
        }

        // BỔ SUNG: API lấy chi tiết 1 đề thi
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExamById(int id)
        {
            var exam = await _examService.GetExamByIdAsync(id);
            if (exam == null) return NotFound("Không tìm thấy đề thi");
            return Ok(exam);
        }

        // Cập nhật thông tin cơ bản của Exam
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateExam(int id, [FromBody] ExamUpdateDto updateData)
        {
            try
            {
                var success = await _examService.UpdateExamAsync(id, updateData);
                if (!success) return NotFound("Không tìm thấy đề thi");
                return Ok(new { Message = "Cập nhật đề thi thành công" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // Xóa đề thi
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteExam(int id)
        {
            var success = await _examService.DeleteExamAsync(id);
            if (!success) return NotFound("Không tìm thấy đề thi");
            return Ok(new { Message = "Đã xóa đề thi" });
        }

        // ==========================================
        // IMPORT ĐỀ THI TỪ FILE JSON
        // ==========================================
        
        /// <summary>
        /// Upload file .json chứa cấu trúc đề thi theo format ImportExamRequest.
        /// </summary>
        [HttpPost("import-json")]
        public async Task<IActionResult> ImportFromJson(
            IFormFile file,
            [FromServices] ExamJsonImportService importService)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Không có file nào được tải lên." });

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".json")
                return BadRequest(new { Message = "Chỉ chấp nhận file .json" });

            // Lấy UserId từ JWT (người tạo đề)
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int createdByUserId = 1; // Mặc định Admin nếu không có token
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
            {
                createdByUserId = uid;
            }

            try
            {
                using var stream = file.OpenReadStream();
                using var reader = new StreamReader(stream);
                var jsonContent = await reader.ReadToEndAsync();

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var request = JsonSerializer.Deserialize<ImportExamRequest>(jsonContent, options);

                if (request == null)
                    return BadRequest(new { Message = "Không thể đọc nội dung file JSON." });

                var (success, message, examId) = await importService.ImportAsync(request, createdByUserId);

                if (!success) return BadRequest(new { Message = message });

                return Ok(new { Message = message, ExamId = examId });
            }
            catch (JsonException ex)
            {
                return BadRequest(new { Message = $"File JSON không hợp lệ: {ex.Message}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Lỗi server: {ex.Message}" });
            }
        }

        /// <summary>
        /// Import đề thi từ body JSON (không cần upload file).
        /// </summary>
        [HttpPost("import-json-body")]
        public async Task<IActionResult> ImportFromJsonBody(
            [FromBody] ImportExamRequest request,
            [FromServices] ExamJsonImportService importService)
        {
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int createdByUserId = 1;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
            {
                createdByUserId = uid;
            }

            var (success, message, examId) = await importService.ImportAsync(request, createdByUserId);

            if (!success) return BadRequest(new { Message = message });

            return Ok(new { Message = message, ExamId = examId });
        }

        // ==========================================
        // IMPORT ĐỀ THI TỪ FILE PDF
        // ==========================================
        [HttpPost("import-pdf")]
        public async Task<IActionResult> ImportFromPdf(
            IFormFile file,
            [FromServices] ExamPdfImportService pdfService,
            [FromServices] ExamJsonImportService jsonImportService)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Không có file nào được tải lên." });

            var extension = Path.GetExtension(file.FileName).ToLower();
            if (extension != ".pdf")
                return BadRequest(new { Message = "Chỉ chấp nhận file .pdf" });

            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
            int createdByUserId = 1;
            if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
            {
                createdByUserId = uid;
            }

            try
            {
                using var stream = file.OpenReadStream();
                var (request, warnings) = pdfService.Parse(stream, file.FileName);

                if (request == null)
                    return BadRequest(new { Message = "Không thể parse PDF.", Warnings = warnings });

                var (success, message, examId) = await jsonImportService.ImportAsync(request, createdByUserId);

                return Ok(new { Message = message, ExamId = examId, Warnings = warnings });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Lỗi server: {ex.Message}" });
            }
        }
    }
}