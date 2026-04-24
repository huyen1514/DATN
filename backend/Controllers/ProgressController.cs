using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using System.Collections.Generic;
using DTOs.Progress;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/progress")]
    // [Authorize] // Bỏ comment dòng này khi project của bạn đã bật xác thực JWT
    public class ProgressController : ControllerBase
    {
        private readonly IProgressService _progressService;

        public ProgressController(IProgressService progressService)
        {
            _progressService = progressService;
        }

        [HttpPost("upsert")]
        public async Task<IActionResult> UpsertPartProgress([FromBody] UpsertProgressRequest request)
        {
            try
            {
                var result = await _progressService.UpsertProgressAsync(request);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("user/{userId:int}")]
        public async Task<IActionResult> GetAllProgressByUser(int userId)
        {
            try
            {
                var result = await _progressService.GetAllProgressByUserAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("lesson/{lessonId:int}/user/{userId:int}")]
        public async Task<IActionResult> GetLessonProgress(int lessonId, int userId)
        {
            try
            {
                var progress = await _progressService.GetLessonProgressDetailAsync(lessonId, userId);
                return Ok(progress);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("recent/user/{userId:int}")]
        public async Task<IActionResult> GetRecentProgress(int userId)
        {
            try
            {
                var recent = await _progressService.GetRecentProgressAsync(userId);
                return Ok(recent);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}