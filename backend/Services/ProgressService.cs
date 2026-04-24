using DTOs.Progress;
using Models;
using Repositories;

namespace Services
{
    public class ProgressService : IProgressService
    {
        private readonly IProgressRepository _progressRepository;

        public ProgressService(IProgressRepository progressRepository)
        {
            _progressRepository = progressRepository;
        }

        public async Task<UserProgressResponse> UpsertProgressAsync(UpsertProgressRequest request)
        {
            if (!await _progressRepository.UserExistsAsync(request.UserId)) throw new KeyNotFoundException("User not found.");
            if (!await _progressRepository.LessonExistsAsync(request.LessonId)) throw new KeyNotFoundException("Lesson not found.");

            var userProgress = await _progressRepository.GetUserProgressWithPartsAsync(request.UserId, request.LessonId);

            if (userProgress == null)
            {
                userProgress = new UserProgress
                {
                    UserId = request.UserId,
                    LessonId = request.LessonId,
                    LastAccessed = DateTime.UtcNow,
                    Completed = false
                };
                await _progressRepository.AddUserProgressAsync(userProgress);
                await _progressRepository.SaveChangesAsync(); 
            }

            userProgress.LastAccessed = DateTime.UtcNow;

            var partProgress = userProgress.LessonProgresses.FirstOrDefault(p => p.PartType == request.PartType);
            if (partProgress == null)
            {
                userProgress.LessonProgresses.Add(new LessonProgress
                {
                    UserProgressId = userProgress.UserProgressId,
                    PartType = request.PartType,
                    Status = request.Status,
                    Score = request.Score,
                    LastAccessedAt = DateTime.UtcNow,
                    CompletedAt = request.Status == "Completed" ? DateTime.UtcNow : null
                });
            }
            else
            {
                partProgress.Status = request.Status;
                if (request.Score.HasValue) partProgress.Score = request.Score;
                partProgress.LastAccessedAt = DateTime.UtcNow;
                if (request.Status == "Completed" && partProgress.CompletedAt == null)
                {
                    partProgress.CompletedAt = DateTime.UtcNow;
                }
            }

            await _progressRepository.SaveChangesAsync();

            var finalProgress = await _progressRepository.GetUserProgressWithPartsAsync(request.UserId, request.LessonId);
            return MapToResponse(finalProgress!);
        }

        public async Task<List<UserProgressResponse>> GetAllProgressByUserAsync(int userId)
        {
            if (!await _progressRepository.UserExistsAsync(userId)) throw new KeyNotFoundException("User not found.");

            var progresses = await _progressRepository.GetAllProgressByUserAsync(userId);
            return progresses.Select(MapToResponse).ToList();
        }

        public async Task<UserProgressResponse> GetLessonProgressDetailAsync(int lessonId, int userId)
        {
            var progress = await _progressRepository.GetUserProgressWithPartsAsync(userId, lessonId);
            if (progress == null) throw new KeyNotFoundException("Progress not found for this lesson.");
            
            return MapToResponse(progress);
        }

        public async Task<UserProgressResponse> GetRecentProgressAsync(int userId)
        {
            var progress = await _progressRepository.GetRecentProgressAsync(userId);
            if (progress == null) throw new KeyNotFoundException("No recent progress found.");

            return MapToResponse(progress);
        }

        private static UserProgressResponse MapToResponse(UserProgress progress)
        {
            return new UserProgressResponse
            {
                UserProgressId = progress.UserProgressId,
                UserId = progress.UserId,
                LessonId = progress.LessonId,
                LessonName = progress.Lesson?.LessonName ?? string.Empty,
                SkillType = progress.Lesson?.SkillType ?? string.Empty,
                LevelName = progress.Lesson?.Level?.LevelName ?? string.Empty,
                Score = progress.Score,
                LastAccessed = progress.LastAccessed,
                Completed = progress.Completed,
                CompletedAt = progress.CompletedAt,
                Parts = progress.LessonProgresses.Select(p => new LessonPartDto
                {
                    PartType = p.PartType,
                    Status = p.Status,
                    Score = p.Score,
                    LastAccessedAt = p.LastAccessedAt
                }).ToList()
            };
        }
    }
}