using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Constants;
using Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Services
{
    public class GrammarImportService
    {
        private sealed class GrammarFileDefinition
        {
            public required string FileName { get; init; }
            public required Lesson TargetLesson { get; init; }
            public required Dictionary<string, Grammar> EntriesByKey { get; init; }
        }

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public GrammarImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        #region Helpers
        private static string NormalizeAscii(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return string.Empty;

            var normalized = input.Trim().ToLowerInvariant().Normalize(NormalizationForm.FormD);
            var builder = new StringBuilder(normalized.Length);

            foreach (var ch in normalized)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(ch) != UnicodeCategory.NonSpacingMark)
                {
                    builder.Append(ch);
                }
            }

            return builder.ToString();
        }

        private static bool IsGrammarSkillType(string? skillType)
        {
            var ascii = NormalizeAscii(skillType);
            return ascii == "ngu phap" || ascii == "grammar";
        }

        private static int? ExtractLessonNumber(string? lessonName)
        {
            if (string.IsNullOrWhiteSpace(lessonName)) return null;
            var match = Regex.Match(lessonName, @"(\d+)");
            return match.Success ? int.Parse(match.Value) : null;
        }

        private static (int? LessonNumber, string? LevelName) ParseFileMetadata(string fileName)
        {
            var match = Regex.Match(
                fileName,
                @"^grammar_(?<lesson>\d+)(?:_(?<level>n\d+))?$",
                RegexOptions.IgnoreCase);

            if (!match.Success) return (null, null);

            var lessonNumber = int.Parse(match.Groups["lesson"].Value);
            var levelName = match.Groups["level"].Success
                ? JlptLevels.Normalize(match.Groups["level"].Value)
                : null;

            return (lessonNumber, levelName);
        }

        // Với ngữ pháp, dùng GrammarName làm Key đối soát chính
        private static string BuildKey(string? grammarName) => grammarName?.Trim() ?? string.Empty;

        private static void ApplyGrammarValues(Grammar target, Grammar source)
        {
            target.GrammarName = source.GrammarName;
            target.Structure = source.Structure;
            target.Meaning = source.Meaning;
            target.Example = source.Example;
            target.CreatedAt = DateTime.UtcNow;
        }
        #endregion

        private async Task<List<GrammarFileDefinition>> LoadDefinitionsAsync(IEnumerable<string> jsonFiles)
        {
            var definitions = new List<GrammarFileDefinition>();

            foreach (var filePath in jsonFiles)
            {
                try
                {
                    var jsonData = await File.ReadAllTextAsync(filePath);
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var grammarList = JsonSerializer.Deserialize<List<Grammar>>(jsonData, options);

                    if (grammarList == null || grammarList.Count == 0) continue;

                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                    var (lessonNumberFromFile, levelNameFromFile) = ParseFileMetadata(fileName);
                    Lesson? targetLesson = null;

                    var jsonLessonId = grammarList.FirstOrDefault()?.LessonId ?? 0;
                    if (jsonLessonId > 0)
                    {
                        var lessonById = await _context.Lessons
                            .Include(l => l.Level)
                            .FirstOrDefaultAsync(l => l.LessonId == jsonLessonId);

                        if (lessonById != null &&
                            IsGrammarSkillType(lessonById.SkillType) &&
                            (!lessonNumberFromFile.HasValue || ExtractLessonNumber(lessonById.LessonName) == lessonNumberFromFile) &&
                            (string.IsNullOrWhiteSpace(levelNameFromFile) ||
                             string.Equals(lessonById.Level?.LevelName, levelNameFromFile, StringComparison.OrdinalIgnoreCase)))
                        {
                            targetLesson = lessonById;
                        }
                    }

                    if (targetLesson == null && lessonNumberFromFile.HasValue)
                    {
                        var lessonCandidates = await _context.Lessons
                            .Include(l => l.Level)
                            .Where(l => string.IsNullOrWhiteSpace(levelNameFromFile) ||
                                        (l.Level != null && l.Level.LevelName == levelNameFromFile))
                            .ToListAsync();

                        targetLesson = lessonCandidates.FirstOrDefault(l =>
                            IsGrammarSkillType(l.SkillType) &&
                            ExtractLessonNumber(l.LessonName) == lessonNumberFromFile);
                    }

                    // Fallback theo định dạng tên file cũ (chỉ có số)
                    if (targetLesson == null)
                    {
                        var match = Regex.Match(fileName, @"\d+");
                        if (match.Success)
                        {
                            int fallbackLessonNumber = int.Parse(match.Value);
                            var fallbackCandidates = await _context.Lessons.ToListAsync();
                            targetLesson = fallbackCandidates.FirstOrDefault(l => 
                                ExtractLessonNumber(l.LessonName) == fallbackLessonNumber && 
                                IsGrammarSkillType(l.SkillType));
                        }
                    }

                    if (targetLesson == null)
                    {
                        Console.WriteLine($"[Grammar Error] Target lesson not found for file {fileName}. Skipping.");
                        continue;
                    }

                    var entriesByKey = new Dictionary<string, Grammar>();
                    foreach (var item in grammarList)
                    {
                        var key = BuildKey(item.GrammarName);
                        if (string.IsNullOrWhiteSpace(key)) continue;

                        item.LessonId = targetLesson.LessonId;
                        entriesByKey[key] = item;
                    }

                    definitions.Add(new GrammarFileDefinition
                    {
                        FileName = fileName,
                        TargetLesson = targetLesson,
                        EntriesByKey = entriesByKey
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Grammar Error] Lỗi xử lý file {Path.GetFileName(filePath)}: {ex.Message}");
                }
            }

            return definitions;
        }

        public async Task ImportAllFromFolderAsync()
        {
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Grammars");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Grammar] Folder không tồn tại: {folderPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(folderPath, "*.json");
            if (jsonFiles.Length == 0)
            {
                Console.WriteLine("[Grammar] Không tìm thấy file .json nào trong wwwroot/data/Grammars.");
                return;
            }

            var definitions = await LoadDefinitionsAsync(jsonFiles);
            if (definitions.Count == 0)
            {
                Console.WriteLine("[Grammar] Không có định dạng ngữ pháp hợp lệ nào được tải.");
                return;
            }

            var desiredLessonIds = definitions
                .Select(d => d.TargetLesson.LessonId)
                .Distinct()
                .ToHashSet();

            var desiredByLesson = definitions
                .GroupBy(d => d.TargetLesson.LessonId)
                .ToDictionary(
                    g => g.Key,
                    g => g
                        .SelectMany(d => d.EntriesByKey)
                        .GroupBy(x => x.Key)
                        .ToDictionary(x => x.Key, x => x.Last().Value));

            var expectedLessonsByKey = new Dictionary<string, HashSet<int>>();
            foreach (var definition in definitions)
            {
                foreach (var key in definition.EntriesByKey.Keys)
                {
                    if (!expectedLessonsByKey.TryGetValue(key, out var lessonIds))
                    {
                        lessonIds = new HashSet<int>();
                        expectedLessonsByKey[key] = lessonIds;
                    }
                    lessonIds.Add(definition.TargetLesson.LessonId);
                }
            }

            var existingGrammars = await _context.Grammars
                .Where(v => desiredLessonIds.Contains(v.LessonId))
                .ToListAsync();

            var fulfilledKeysByLesson = existingGrammars
                .GroupBy(v => v.LessonId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(v => BuildKey(v.GrammarName)).ToHashSet());

            var recycledRows = new HashSet<int>();
            var addedCount = 0;
            var movedCount = 0;
            var updatedCount = 0;

            // 1. Thực hiện Thêm, Sửa, và Di chuyển
            foreach (var (lessonId, desiredEntries) in desiredByLesson)
            {
                fulfilledKeysByLesson.TryAdd(lessonId, new HashSet<string>());

                foreach (var (key, desired) in desiredEntries)
                {
                    var inLesson = existingGrammars
                        .FirstOrDefault(v => v.LessonId == lessonId && BuildKey(v.GrammarName) == key);

                    if (inLesson != null)
                    {
                        ApplyGrammarValues(inLesson, desired);
                        fulfilledKeysByLesson[lessonId].Add(key);
                        updatedCount++;
                        continue;
                    }

                    var donor = existingGrammars.FirstOrDefault(v =>
                        !recycledRows.Contains(v.GrammarId) &&
                        BuildKey(v.GrammarName) == key &&
                        expectedLessonsByKey.TryGetValue(key, out var expectedLessons) &&
                        !expectedLessons.Contains(v.LessonId));

                    if (donor != null)
                    {
                        donor.LessonId = lessonId;
                        ApplyGrammarValues(donor, desired);
                        fulfilledKeysByLesson.TryAdd(donor.LessonId, new HashSet<string>());
                        fulfilledKeysByLesson[lessonId].Add(key);
                        recycledRows.Add(donor.GrammarId);
                        movedCount++;
                        continue;
                    }

                    var newGrammar = new Grammar
                    {
                        GrammarName = desired.GrammarName,
                        Structure = desired.Structure,
                        Meaning = desired.Meaning,
                        Example = desired.Example,
                        LessonId = lessonId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Grammars.Add(newGrammar);
                    existingGrammars.Add(newGrammar);
                    fulfilledKeysByLesson[lessonId].Add(key);
                    addedCount++;
                }
            }

            // 2. Thực hiện Xóa các bản ghi thừa
            var rowsToDelete = new List<Grammar>();
            foreach (var lessonGroup in existingGrammars.GroupBy(v => v.LessonId))
            {
                if (!desiredByLesson.TryGetValue(lessonGroup.Key, out var desiredEntries))
                {
                    continue;
                }

                var seenKeys = new HashSet<string>();
                foreach (var grammar in lessonGroup.OrderBy(v => v.GrammarId))
                {
                    var key = BuildKey(grammar.GrammarName);
                    var isDesiredInLesson = desiredEntries.ContainsKey(key);

                    if (isDesiredInLesson && seenKeys.Add(key))
                    {
                        continue;
                    }

                    if (!expectedLessonsByKey.ContainsKey(key))
                    {
                        rowsToDelete.Add(grammar);
                    }
                }
            }

            if (rowsToDelete.Count > 0)
            {
                _context.Grammars.RemoveRange(rowsToDelete);
            }

            await _context.SaveChangesAsync();

            Console.WriteLine(
                $"[Grammar] Đối soát hoàn tất. Files={definitions.Count}, Added={addedCount}, Moved={movedCount}, Updated={updatedCount}, Deleted={rowsToDelete.Count}");
        }
    }
}