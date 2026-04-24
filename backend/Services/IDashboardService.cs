using DTOs.Dashboard;

namespace Services
{
    public interface IDashboardService
    {
        Task<DashboardResponse> GetDashboardAsync(int userId);
    }
}
