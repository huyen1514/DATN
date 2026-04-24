using DTOs.Dashboard;
using Repositories;

namespace Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUserProgressRepository _userProgressRepository;

        public DashboardService(IUserProgressRepository userProgressRepository)
        {
            _userProgressRepository = userProgressRepository;
        }

        public async Task<DashboardResponse> GetDashboardAsync(int userId)
        {
            if (!await _userProgressRepository.UserExistsAsync(userId))
            {
                throw new KeyNotFoundException("User was not found.");
            }

            var progresses = await _userProgressRepository.GetByUserIdAsync(userId);

            return new DashboardResponse
            {
                UserId = userId,
                TotalLessonsLearned = progresses.Count,
                CompletedLessons = progresses.Count(x => x.Completed),
                AverageScore = progresses.Count == 0 ? 0 : Math.Round(progresses.Average(x => x.Score), 2)
            };
        }
    }
}
