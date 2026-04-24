namespace DTOs.Recommendation
{
    public class RecommendedLessonResponse
    {
        public int LessonId { get; set; }
        public string LessonName { get; set; } = string.Empty;
        public string SkillType { get; set; } = string.Empty;
        public string LevelName { get; set; } = string.Empty;
        public string RecommendationReason { get; set; } = string.Empty;
    }
}
