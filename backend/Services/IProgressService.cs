using DTOs.Progress;

namespace Services
{
    public interface IProgressService
    {
        Task<UserProgressResponse> UpsertProgressAsync(UpsertProgressRequest request);
        Task<List<UserProgressResponse>> GetAllProgressByUserAsync(int userId);
        Task<UserProgressResponse> GetLessonProgressDetailAsync(int lessonId, int userId);
        Task<UserProgressResponse> GetRecentProgressAsync(int userId);
    }
}