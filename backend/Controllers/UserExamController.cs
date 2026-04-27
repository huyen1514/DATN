using Microsoft.AspNetCore.Mvc;
using DTOs;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/user-exams")]
    public class UserExamsController : ControllerBase
    {
        private readonly IUserExamService _userExamService;

        public UserExamsController(IUserExamService userExamService)
        {
            _userExamService = userExamService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserExamCreateDto dto)
        {
            var (success, message, data) = await _userExamService.CreateAsync(dto);
            if (!success) return BadRequest(message);

            return CreatedAtAction(nameof(GetById), new { id = data?.UserExamId }, data); 
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? userId, 
            [FromQuery] int? examId,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            var (userExams, totalRecords) = await _userExamService.GetAllAsync(userId, examId, page, pageSize);

            return Ok(new { Data = userExams, Total = totalRecords, Page = page, PageSize = pageSize });
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userExam = await _userExamService.GetByIdAsync(id);

            if (userExam == null)
                return NotFound("Không tìm thấy quyền truy cập đề thi");

            return Ok(userExam);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserExamUpdateDto dto)
        {
            var (success, message, data) = await _userExamService.UpdateAsync(id, dto);
            if (!success)
                return NotFound(message);

            return Ok(data);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var (success, message) = await _userExamService.DeleteAsync(id);

            if (!success)
                return NotFound(message);

            return Ok(new { Message = message });
        }
    }
}