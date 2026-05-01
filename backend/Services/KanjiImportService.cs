using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Constants; // Chứa JlptLevels (giống các service trước)
using Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Services
{
    public class KanjiImportService
    {
        private sealed class KanjiFileDefinition
        {
            public required string FileName { get; init; }
            public required Lesson TargetLesson { get; init; }
            public required Dictionary<string, Kanji> EntriesByKey { get; init; }
        }

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public KanjiImportService(AppDbContext context, IWebHostEnvironment env)
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

        private static bool IsKanjiSkillType(string? skillType)
        {
            var ascii = NormalizeAscii(skillType);
            return ascii == "kanji" || ascii == "chu han";
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
                @"^kanji_(?<lesson>\d+)(?:_(?<level>n\d+))?$",
                RegexOptions.IgnoreCase);

            if (!match.Success) return (null, null);

            var lessonNumber = int.Parse(match.Groups["lesson"].Value);
            var levelName = match.Groups["level"].Success
                ? JlptLevels.Normalize(match.Groups["level"].Value)
                : null;

            return (lessonNumber, levelName);
        }

        // Với Kanji, dùng Character (Chữ Hán) làm Key đối soát chính
        private static string BuildKey(string? character) => character?.Trim() ?? string.Empty;

        private static void ApplyKanjiValues(Kanji target, Kanji source)
        {
            target.Character = source.Character;
            target.Meaning = source.Meaning;
            target.Onyomi = source.Onyomi;
            target.Kunyomi = source.Kunyomi;
            target.Example = source.Example;
            // Không gán UpdatedAt vì Model Kanji không có trường này
        }
        #endregion

        private async Task<List<KanjiFileDefinition>> LoadDefinitionsAsync(IEnumerable<string> jsonFiles)
        {
            var definitions = new List<KanjiFileDefinition>();

            foreach (var filePath in jsonFiles)
            {
                try
                {
                    var jsonData = await File.ReadAllTextAsync(filePath);
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var kanjiList = JsonSerializer.Deserialize<List<Kanji>>(jsonData, options);

                    if (kanjiList == null || kanjiList.Count == 0) continue;

                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                    var (lessonNumberFromFile, levelNameFromFile) = ParseFileMetadata(fileName);
                    Lesson? targetLesson = null;

                    var jsonLessonId = kanjiList.FirstOrDefault()?.LessonId ?? 0;
                    if (jsonLessonId > 0)
                    {
                        var lessonById = await _context.Lessons
                            .Include(l => l.Level)
                            .FirstOrDefaultAsync(l => l.LessonId == jsonLessonId);

                        if (lessonById != null &&
                            IsKanjiSkillType(lessonById.SkillType) &&
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
                            IsKanjiSkillType(l.SkillType) &&
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
                                IsKanjiSkillType(l.SkillType));
                        }
                    }

                    if (targetLesson == null)
                    {
                        Console.WriteLine($"[Kanji Error] Target lesson not found for file {fileName}. Skipping.");
                        continue;
                    }

                    var entriesByKey = new Dictionary<string, Kanji>();
                    foreach (var item in kanjiList)
                    {
                        var key = BuildKey(item.Character);
                        if (string.IsNullOrWhiteSpace(key)) continue;

                        item.LessonId = targetLesson.LessonId;
                        entriesByKey[key] = item;
                    }

                    definitions.Add(new KanjiFileDefinition
                    {
                        FileName = fileName,
                        TargetLesson = targetLesson,
                        EntriesByKey = entriesByKey
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Kanji Error] Lỗi xử lý file {Path.GetFileName(filePath)}: {ex.Message}");
                }
            }

            return definitions;
        }

        public async Task ImportAllFromFolderAsync()
        {
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Kanjis");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Kanji] Folder không tồn tại: {folderPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(folderPath, "*.json");
            if (jsonFiles.Length == 0)
            {
                Console.WriteLine("[Kanji] Không tìm thấy file .json nào trong wwwroot/data/Kanjis.");
                return;
            }

            var definitions = await LoadDefinitionsAsync(jsonFiles);
            if (definitions.Count == 0)
            {
                Console.WriteLine("[Kanji] Không có định dạng Kanji hợp lệ nào được tải.");
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

            var existingKanjis = await _context.Kanjis
                .Where(v => desiredLessonIds.Contains(v.LessonId))
                .ToListAsync();

            var fulfilledKeysByLesson = existingKanjis
                .GroupBy(v => v.LessonId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(v => BuildKey(v.Character)).ToHashSet());

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
                    var inLesson = existingKanjis
                        .FirstOrDefault(v => v.LessonId == lessonId && BuildKey(v.Character) == key);

                    if (inLesson != null)
                    {
                        ApplyKanjiValues(inLesson, desired);
                        fulfilledKeysByLesson[lessonId].Add(key);
                        updatedCount++;
                        continue;
                    }

                    var donor = existingKanjis.FirstOrDefault(v =>
                        !recycledRows.Contains(v.KanjiId) &&
                        BuildKey(v.Character) == key &&
                        expectedLessonsByKey.TryGetValue(key, out var expectedLessons) &&
                        !expectedLessons.Contains(v.LessonId));

                    if (donor != null)
                    {
                        donor.LessonId = lessonId;
                        ApplyKanjiValues(donor, desired);
                        fulfilledKeysByLesson.TryAdd(donor.LessonId, new HashSet<string>());
                        fulfilledKeysByLesson[lessonId].Add(key);
                        recycledRows.Add(donor.KanjiId);
                        movedCount++;
                        continue;
                    }

                    var newKanji = new Kanji
                    {
                        Character = desired.Character,
                        Meaning = desired.Meaning,
                        Onyomi = desired.Onyomi,
                        Kunyomi = desired.Kunyomi,
                        Example = desired.Example,
                        LessonId = lessonId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Kanjis.Add(newKanji);
                    existingKanjis.Add(newKanji);
                    fulfilledKeysByLesson[lessonId].Add(key);
                    addedCount++;
                }
            }

            // 2. Thực hiện Xóa các bản ghi thừa
            var rowsToDelete = new List<Kanji>();
            foreach (var lessonGroup in existingKanjis.GroupBy(v => v.LessonId))
            {
                if (!desiredByLesson.TryGetValue(lessonGroup.Key, out var desiredEntries))
                {
                    continue;
                }

                var seenKeys = new HashSet<string>();
                foreach (var kanji in lessonGroup.OrderBy(v => v.KanjiId))
                {
                    var key = BuildKey(kanji.Character);
                    var isDesiredInLesson = desiredEntries.ContainsKey(key);

                    if (isDesiredInLesson && seenKeys.Add(key))
                    {
                        continue;
                    }

                    if (!expectedLessonsByKey.ContainsKey(key))
                    {
                        rowsToDelete.Add(kanji);
                    }
                }
            }

            if (rowsToDelete.Count > 0)
            {
                _context.Kanjis.RemoveRange(rowsToDelete);
            }

            await _context.SaveChangesAsync();

            Console.WriteLine(
                $"[Kanji] Đối soát hoàn tất. Files={definitions.Count}, Added={addedCount}, Moved={movedCount}, Updated={updatedCount}, Deleted={rowsToDelete.Count}");
        }
    }
}