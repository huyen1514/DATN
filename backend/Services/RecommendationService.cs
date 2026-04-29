using DTOs.Recommendation;
using Models;
using Repositories;

namespace Services
{
    public class RecommendationService : IRecommendationService
    {
        private const int DefaultRecommendationCount = 5;

        private static readonly Dictionary<string, int> LevelRankMap = new(StringComparer.OrdinalIgnoreCase)
        {
            ["N5"] = 1,
            ["N4"] = 2,
            ["N3"] = 3,
            ["N2"] = 4,
            ["N1"] = 5
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

        public RecommendationService(IUserProgressRepository userProgressRepository, ILessonRepository lessonRepository)
        {
            _userProgressRepository = userProgressRepository;
            _lessonRepository = lessonRepository;
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
                    SimulatedKMeansCluster = "NoLessons",
                    SimulatedAprioriRule = "No lessons available in the system."
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

            // Simulated KMeans: group the learner into a simple cluster from score distribution.
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

            // Simulated Apriori: map a skill to the skill that usually supports it.
            var aprioriRule = $"{primarySkill} -> {relatedSkill}";

            var studiedLessonIds = validProgresses
                .Select(x => x.LessonId)
                .ToHashSet();

            var unseenLessons = lessons
                .Where(x => !studiedLessonIds.Contains(x.LessonId))
                .ToList();

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

            var recommendedLessons = candidateLessons
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

            if (recommendedLessons.Count == 0)
            {
                recommendedLessons = validProgresses
                    .OrderBy(x => x.Score)
                    .Take(DefaultRecommendationCount)
                    .Select(x => lessonMap[x.LessonId])
                    .Select(x => new RecommendedLessonResponse
                    {
                        LessonId = x.LessonId,
                        LessonName = x.LessonName,
                        SkillType = x.SkillType,
                        LevelName = x.Level?.LevelName ?? string.Empty,
                        RecommendationReason = "No new lesson is available, so the system suggests reviewing weak lessons."
                    })
                    .ToList();
            }

            return new RecommendationResponse
            {
                UserId = userId,
                AverageScore = averageScore,
                SimulatedKMeansCluster = cluster,
                SimulatedAprioriRule = aprioriRule,
                Lessons = recommendedLessons
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
                    RecommendationReason = "New learner flow: start from the easiest available lessons."
                })
                .ToList();

            return new RecommendationResponse
            {
                UserId = userId,
                AverageScore = 0,
                SimulatedKMeansCluster = "NewLearner",
                SimulatedAprioriRule = "No progress yet, so the system starts from the basic lessons.",
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
                "NeedsFoundation" => $"The learner needs reinforcement, so prioritize easier {primarySkill} or related {relatedSkill} lessons.",
                "HighPerformer" => $"The learner is performing well, so suggest a harder lesson around {primarySkill} and {relatedSkill}.",
                _ => $"The learner is stable, so continue with {primarySkill} and supporting {relatedSkill} lessons."
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
