namespace DTOs.Dashboard
{
    public class DashboardResponse
    {
        public int UserId { get; set; }
        public int TotalLessonsLearned { get; set; }
        public int CompletedLessons { get; set; }
        public decimal AverageScore { get; set; }
    }
}
