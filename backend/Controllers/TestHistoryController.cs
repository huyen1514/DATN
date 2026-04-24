using DTOs.TestHistory;
using Microsoft.AspNetCore.Mvc;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/test-history")]
    public class TestHistoryController : ControllerBase
    {
        private readonly ITestHistoryService _testHistoryService;

        public TestHistoryController(ITestHistoryService testHistoryService)
        {
            _testHistoryService = testHistoryService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateTestHistoryRequest request)
        {
            try
            {
                var result = await _testHistoryService.SaveAsync(request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            try
            {
                var result = await _testHistoryService.GetByUserAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}
