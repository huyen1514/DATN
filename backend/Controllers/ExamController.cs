using Microsoft.AspNetCore.Mvc;
using backend.DTOs.Exam;
using Services;
using System.Security.Claims;
using System.Text.Json;
using System.IO;

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

        // API lấy chi tiết 1 đề thi
        [HttpGet("{id}")]
        public async Task<IActionResult> GetExamById(int id)
        {
            var exam = await _examService.GetExamByIdAsync(id);
            if (exam == null) return NotFound("Không tìm thấy đề thi");
            return Ok(exam);
        }

        // Tạo đề thi mới
        [HttpPost]
        public async Task<IActionResult> CreateExam([FromBody] ExamCreateDto createData)
        {
            try
            {
                var exam = await _examService.CreateExamAsync(createData);
                return CreatedAtAction(nameof(GetExamById), new { id = exam?.ExamId }, exam);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { Message = ex.Message });
            }
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
        /// Upload file .json, LƯU VÀO SERVER, và import vào Database.
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
                // 1. LƯU FILE VÀO THƯ MỤC WWWROOT (HỖ TRỢ DOCKER)
                string saveDirectory = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "data", "Exams");
                if (!Directory.Exists(saveDirectory))
                {
                    Directory.CreateDirectory(saveDirectory);
                }
                
                // Lấy tên file gốc
                string fileName = file.FileName;
                string filePath = Path.Combine(saveDirectory, fileName);

                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(fileStream);
                }

                // 2. ĐỌC NỘI DUNG FILE VỪA LƯU ĐỂ IMPORT VÀO DATABASE
                string jsonContent = await System.IO.File.ReadAllTextAsync(filePath);

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var request = JsonSerializer.Deserialize<ImportExamRequest>(jsonContent, options);

                if (request == null)
                    return BadRequest(new { Message = "Không thể đọc nội dung file JSON." });

                // 3. GỌI SERVICE ĐỂ LƯU VÀO DB
                var (success, message, examId) = await importService.ImportAsync(request, createdByUserId);

                if (!success) 
                {
                    // Tùy chọn: Xóa file vật lý vừa lưu nếu import vào DB thất bại để tránh rác server
                    // System.IO.File.Delete(filePath);
                    return BadRequest(new { Message = message });
                }

                return Ok(new { Message = message, ExamId = examId, SavedFilePath = filePath });
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
            try
            {
                var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
                int createdByUserId = 1;
                if (!string.IsNullOrEmpty(userIdClaim) && int.TryParse(userIdClaim, out int uid))
                {
                    createdByUserId = uid;
                }

                if (request == null)
                {
                    return BadRequest(new { Message = "Dữ liệu JSON không hợp lệ hoặc trống." });
                }

                var (success, message, examId) = await importService.ImportAsync(request, createdByUserId);

                if (!success) return BadRequest(new { Message = message });

                return Ok(new { Message = message, ExamId = examId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { Message = $"Lỗi hệ thống: {ex.Message} - {ex.InnerException?.Message}\n{ex.StackTrace}" });
            }
        }
        // ==========================================
        // UPLOAD MEDIA (AUDIO/IMAGE) CHO CÂU HỎI
        // ==========================================
        [HttpPost("upload-media")]
        public async Task<IActionResult> UploadMedia(
            [FromForm] IFormFile file,
            [FromForm] int questionId,
            [FromServices] Data.AppDbContext context,
            [FromServices] IWebHostEnvironment env)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { Message = "Không có file nào được tải lên." });

            var question = await context.ExamQuestions.FindAsync(questionId);
            if (question == null)
                return NotFound(new { Message = "Không tìm thấy câu hỏi với ID cung cấp." });

            var extension = Path.GetExtension(file.FileName).ToLower();
            string[] audioExts = { ".mp3", ".wav", ".m4a", ".ogg" };
            string[] imageExts = { ".jpg", ".jpeg", ".png", ".webp", ".gif" };

            string folderName = "";
            bool isAudio = audioExts.Contains(extension);
            bool isImage = imageExts.Contains(extension);

            if (isAudio) folderName = "audio";
            else if (isImage) folderName = "images";
            else return BadRequest(new { Message = "Định dạng file không được hỗ trợ." });

            // Sinh UUID để không bị trùng tên
            string newFileName = Guid.NewGuid().ToString() + extension;
            string webRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");
            string saveDirectory = Path.Combine(webRootPath, "uploads", folderName);

            if (!Directory.Exists(saveDirectory))
            {
                Directory.CreateDirectory(saveDirectory);
            }

            string filePath = Path.Combine(saveDirectory, newFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }

            string relativeUrl = $"/uploads/{folderName}/{newFileName}";

            if (isAudio)
            {
                question.AudioUrl = relativeUrl;
            }
            else
            {
                question.ImageUrl = relativeUrl;
            }

            await context.SaveChangesAsync();

            return Ok(new 
            { 
                Message = "Tải file thành công.", 
                Url = relativeUrl, 
                Type = isAudio ? "audio" : "image" 
            });
        }

    }
}