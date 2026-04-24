using System.ComponentModel.DataAnnotations;

namespace DTOs.Progress
{
    public class UpsertProgressRequest
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int LessonId { get; set; }
        
        [Required]
        public string PartType { get; set; } = string.Empty; // "Vocabulary", "Grammar"...
        
        [Required]
        public string Status { get; set; } = string.Empty; // "InProgress", "Completed"
        
        public decimal? Score { get; set; }
    }

    public class UserProgressResponse
    {
        public int UserProgressId { get; set; }
        public int UserId { get; set; }
        public int LessonId { get; set; }
        public string LessonName { get; set; } = string.Empty;
        public string SkillType { get; set; } = string.Empty;
        public string LevelName { get; set; } = string.Empty;
        public decimal Score { get; set; }
        public DateTime LastAccessed { get; set; }
        public bool Completed { get; set; }
        public DateTime? CompletedAt { get; set; }
        
        public List<LessonPartDto> Parts { get; set; } = new List<LessonPartDto>();
    }

    public class LessonPartDto
    {
        public string PartType { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public decimal? Score { get; set; }
        public DateTime LastAccessedAt { get; set; }
    }
}