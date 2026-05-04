using Microsoft.AspNetCore.Mvc;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/dashboard")]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetDashboard(int userId)
        {
            try
            {
                var dashboard = await _dashboardService.GetDashboardAsync(userId);
                return Ok(dashboard);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("admin")]
        public async Task<IActionResult> GetAdminDashboard()
        {
            var stats = await _dashboardService.GetAdminDashboardStatsAsync();
            return Ok(stats);
        }
    }
}
