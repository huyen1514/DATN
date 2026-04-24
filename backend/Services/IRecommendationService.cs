using DTOs.Recommendation;

namespace Services
{
    public interface IRecommendationService
    {
        Task<RecommendationResponse> GetRecommendationsAsync(int userId);
    }
}
