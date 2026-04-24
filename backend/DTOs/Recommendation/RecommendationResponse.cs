namespace DTOs.Recommendation
{
    public class RecommendationResponse
    {
        public int UserId { get; set; }
        public decimal AverageScore { get; set; }
        public string SimulatedKMeansCluster { get; set; } = string.Empty;
        public string SimulatedAprioriRule { get; set; } = string.Empty;
        public List<RecommendedLessonResponse> Lessons { get; set; } = new();
    }
}
