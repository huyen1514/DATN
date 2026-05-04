using DTOs.Recommendation;
using Models;
using Repositories;
using System.Text.Json;

namespace Services
{
    public class RecommendationService : IRecommendationService
    {
        private const int DefaultRecommendationCount = 5;

        private static readonly Dictionary<string, int> LevelRankMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["N5"] = 1,
            ["N4"] = 2,
            ["N3"] = 3
        };

        private static readonly Dictionary<string, string> AprioriSkillMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Tu vung"] = "Han tu",
            ["Nghe hieu"] = "Ngu phap",
            ["Doc hieu"] = "Tu vung",
            ["Ngu phap"] = "Doc hieu",
            ["Han tu"] = "Tu vung",
            ["Từ vựng"] = "Kanji",
            ["Nghe hiểu"] = "Ngữ pháp",
            ["Đọc hiểu"] = "Từ vựng",
            ["Ngữ pháp"] = "Đọc hiểu",
            ["Kanji"] = "Từ vựng"
        };

        private readonly IUserProgressRepository _userProgressRepository;
        private readonly ILessonRepository _lessonRepository;
        private readonly GeminiRecommendationService _geminiService;

        public RecommendationService(
            IUserProgressRepository userProgressRepository, 
            ILessonRepository lessonRepository,
            GeminiRecommendationService geminiService)
        {
            _userProgressRepository = userProgressRepository;
            _lessonRepository = lessonRepository;
            _geminiService = geminiService;
        }

        public async Task<RecommendationResponse> GetRecommendationsAsync(int userId)
        {
            if (!await _userProgressRepository.UserExistsAsync(userId))
            {
                throw new KeyNotFoundException("User was not found.");
            }

            var progresses = await _userProgressRepository.GetByUserIdAsync(userId);
            var lessons = await _lessonRepository.GetAllWithLevelAsync();

            if (lessons.Count == 0)
            {
                return new RecommendationResponse
                {
                    UserId = userId,
                    AverageScore = 0,
                    SimulatedKMeansCluster = "Chưa có dữ liệu",
                    SimulatedAprioriRule = "Hệ thống chưa có bài học nào.",
                    Lessons = new List<RecommendedLessonResponse>()
                };
            }

            if (progresses.Count == 0)
            {
                return BuildColdStartResponse(userId, lessons);
            }

            var lessonMap = lessons.ToDictionary(x => x.LessonId);
            var validProgresses = progresses.Where(x => lessonMap.ContainsKey(x.LessonId)).ToList();

            if (validProgresses.Count == 0)
            {
                return BuildColdStartResponse(userId, lessons);
            }

            var averageScore = validProgresses.Count == 0 ? 0 : Math.Round(validProgresses.Average(x => x.Score), 2);

            var recentProgress = validProgresses
                .OrderByDescending(x => x.LastAccessed)
                .First();

            var currentLesson = lessonMap[recentProgress.LessonId];
            var currentLevelRank = GetLevelRank(currentLesson.Level?.LevelName);
            var maxLevelRank = lessons.Max(x => GetLevelRank(x.Level?.LevelName));

            var weakSkill = GetSkillByAverage(validProgresses, lessonMap, selectLowest: true);
            var strongSkill = GetSkillByAverage(validProgresses, lessonMap, selectLowest: false);
            var relatedSkill = ResolveRelatedSkill(averageScore < 50 ? weakSkill : strongSkill);

            var lowScoreCount = validProgresses.Count(x => x.Score < 50);
            var highScoreCount = validProgresses.Count(x => x.Score >= 80);

            string cluster;
            int targetLevelRank;
            string primarySkill;

            if (averageScore < 50 || lowScoreCount >= Math.Max(1, validProgresses.Count / 2))
            {
                cluster = "NeedsFoundation";
                targetLevelRank = Math.Max(1, currentLevelRank - 1);
                primarySkill = weakSkill;
            }
            else if (averageScore >= 80 && highScoreCount >= Math.Max(1, validProgresses.Count / 2))
            {
                cluster = "HighPerformer";
                targetLevelRank = Math.Min(maxLevelRank, currentLevelRank + 1);
                primarySkill = strongSkill;
            }
            else
            {
                cluster = "BalancedLearner";
                targetLevelRank = currentLevelRank;
                primarySkill = weakSkill;
            }

            var aprioriRule = $"{primarySkill} -> {relatedSkill}";

            var studiedLessonIds = validProgresses
                .Select(x => x.LessonId)
                .ToHashSet();

            var unseenLessons = lessons
                .Where(x => !studiedLessonIds.Contains(x.LessonId))
                .ToList();

            List<RecommendedLessonResponse> finalRecommendations = new();
            bool isAiUsed = false;

            if (unseenLessons.Count > 0)
            {
                var candidateLessonsForAi = unseenLessons
                    .OrderBy(x => Math.Abs(GetLevelRank(x.Level?.LevelName) - targetLevelRank))
                    .Take(15)
                    .Select(x => new { x.LessonId, x.LessonName, x.SkillType, LevelName = x.Level?.LevelName })
                    .ToList();

                string unseenLessonsJson = JsonSerializer.Serialize(candidateLessonsForAi);

                try
                {
                    var aiResults = await _geminiService.GetAiRecommendations((decimal)averageScore, weakSkill, unseenLessonsJson);
                    
                    if (aiResults != null && aiResults.Count > 0)
                    {
                        finalRecommendations = aiResults;
                        isAiUsed = true;
                    }
                }
                catch
                {
                    // Fallback to rule-based logic
                }
            }

            if (finalRecommendations.Count == 0)
            {
                var candidateLessons = cluster switch
                {
                    "NeedsFoundation" => unseenLessons.Where(x => GetLevelRank(x.Level?.LevelName) <= currentLevelRank).ToList(),
                    "HighPerformer" => unseenLessons.Where(x => GetLevelRank(x.Level?.LevelName) >= currentLevelRank).ToList(),
                    _ => unseenLessons
                };

                if (candidateLessons.Count == 0)
                {
                    candidateLessons = unseenLessons;
                }

                finalRecommendations = candidateLessons
                    .OrderBy(x => GetSkillPriority(x.SkillType, primarySkill, relatedSkill))
                    .ThenBy(x => Math.Abs(GetLevelRank(x.Level?.LevelName) - targetLevelRank))
                    .ThenBy(x => x.LessonId)
                    .Take(DefaultRecommendationCount)
                    .Select(x => new RecommendedLessonResponse
                    {
                        LessonId = x.LessonId,
                        LessonName = x.LessonName,
                        SkillType = x.SkillType,
                        LevelName = x.Level?.LevelName ?? string.Empty,
                        RecommendationReason = BuildReason(cluster, primarySkill, relatedSkill, x)
                    })
                    .ToList();
            }

            if (finalRecommendations.Count == 0)
            {
                finalRecommendations = validProgresses
                    .OrderBy(x => x.Score)
                    .Take(DefaultRecommendationCount)
                    .Select(x => lessonMap[x.LessonId])
                    .Select(x => new RecommendedLessonResponse
                    {
                        LessonId = x.LessonId,
                        LessonName = x.LessonName,
                        SkillType = x.SkillType,
                        LevelName = x.Level?.LevelName ?? string.Empty,
                        RecommendationReason = "Chưa có bài học mới, hệ thống đề xuất ôn tập lại các bài cũ bị điểm thấp."
                    })
                    .ToList();
            }

            string displayCluster = cluster switch
            {
                "NeedsFoundation" => "Cần củng cố nền tảng",
                "HighPerformer" => "Học viên xuất sắc",
                "BalancedLearner" => "Phát triển đồng đều",
                _ => cluster
            };

            return new RecommendationResponse
            {
                UserId = userId,
                AverageScore = averageScore,
                SimulatedKMeansCluster = isAiUsed ? $"AI Cá nhân hóa ({displayCluster})" : displayCluster,
                SimulatedAprioriRule = aprioriRule,
                Lessons = finalRecommendations
            };
        }

        private static RecommendationResponse BuildColdStartResponse(int userId, List<Lesson> lessons)
        {
            var firstLessons = lessons
                .OrderBy(x => GetLevelRank(x.Level?.LevelName))
                .ThenBy(x => x.LessonId)
                .Take(DefaultRecommendationCount)
                .Select(x => new RecommendedLessonResponse
                {
                    LessonId = x.LessonId,
                    LessonName = x.LessonName,
                    SkillType = x.SkillType,
                    LevelName = x.Level?.LevelName ?? string.Empty,
                    RecommendationReason = "Hành trình mới: Bắt đầu từ những bài học cơ bản nhất."
                })
                .ToList();

            return new RecommendationResponse
            {
                UserId = userId,
                AverageScore = 0,
                SimulatedKMeansCluster = "Người học mới",
                SimulatedAprioriRule = "Chưa có dữ liệu tiến độ, hệ thống bắt đầu từ cấp độ cơ bản.",
                Lessons = firstLessons
            };
        }

        private static string GetSkillByAverage(
            List<UserProgress> progresses,
            Dictionary<int, Lesson> lessonMap,
            bool selectLowest)
        {
            var groupedSkills = progresses
                .Where(x => lessonMap.ContainsKey(x.LessonId))
                .GroupBy(x => lessonMap[x.LessonId].SkillType)
                .Select(x => new
                {
                    SkillType = x.Key,
                    AverageScore = x.Average(p => p.Score)
                });

            return selectLowest
                ? groupedSkills.OrderBy(x => x.AverageScore).First().SkillType
                : groupedSkills.OrderByDescending(x => x.AverageScore).First().SkillType;
        }

        private static string ResolveRelatedSkill(string skillType)
        {
            return AprioriSkillMap.TryGetValue(skillType, out var relatedSkill)
                ? relatedSkill
                : skillType;
        }

        private static int GetSkillPriority(string lessonSkill, string primarySkill, string relatedSkill)
        {
            if (string.Equals(lessonSkill, primarySkill, StringComparison.OrdinalIgnoreCase))
            {
                return 0;
            }

            if (string.Equals(lessonSkill, relatedSkill, StringComparison.OrdinalIgnoreCase))
            {
                return 1;
            }

            return 2;
        }

        private static string BuildReason(string cluster, string primarySkill, string relatedSkill, Lesson lesson)
        {
            return cluster switch
            {
                "NeedsFoundation" => $"Bạn cần củng cố kiến thức, nên hệ thống ưu tiên các bài học dễ hơn về {primarySkill} hoặc kỹ năng bổ trợ {relatedSkill}.",
                "HighPerformer" => $"Bạn đang làm rất tốt, hệ thống đề xuất thử thách với bài học khó hơn về {primarySkill} và {relatedSkill}.",
                _ => $"Tiến độ của bạn đang ổn định, hãy tiếp tục phát huy với {primarySkill} và {relatedSkill}."
            };
        }

        private static int GetLevelRank(string? levelName)
        {
            if (!string.IsNullOrWhiteSpace(levelName) && LevelRankMap.TryGetValue(levelName, out var rank))
            {
                return rank;
            }

            return 1;
        }
    }
}