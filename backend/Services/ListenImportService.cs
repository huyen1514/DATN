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
    public class ListenImportService
    {
        private sealed class ListeningFileDefinition
        {
            public required string FileName { get; init; }
            public required Lesson TargetLesson { get; init; }
            public required Dictionary<string, Listening> EntriesByKey { get; init; }
        }

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ListenImportService(AppDbContext context, IWebHostEnvironment env)
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

        private static bool IsListeningSkillType(string? skillType)
        {
            var ascii = NormalizeAscii(skillType);
            return ascii == "nghe hieu" || ascii == "listening";
        }

        private static int? ExtractLessonNumber(string? lessonName)
        {
            if (string.IsNullOrWhiteSpace(lessonName)) return null;
            var match = Regex.Match(lessonName, @"(\d+)");
            return match.Success ? int.Parse(match.Value) : null;
        }

        private static (int? LessonNumber, string? LevelName) ParseFileMetadata(string fileName)
        {
            // Hỗ trợ "Lesson_1.json", "Lesson_1_n4.json", "Lesson_1_N3.json"
            var match = Regex.Match(
                fileName,
                @"^lesson_(?<lesson>\d+)(?:_(?<level>n\d+))?$",
                RegexOptions.IgnoreCase);

            if (!match.Success) return (null, null);

            var lessonNumber = int.Parse(match.Groups["lesson"].Value);
            
            // Nếu regex tìm thấy nhóm level (ví dụ _n4), thì lấy level đó. 
            // Nếu không có, MẶC ĐỊNH LÀ N5 để tránh nhảy nhầm sang N4/N3.
            var levelName = match.Groups["level"].Success
                ? JlptLevels.Normalize(match.Groups["level"].Value)
                : JlptLevels.N5; 

            return (lessonNumber, levelName);
        }

        // Tạo Key đối soát bằng cách ghép Câu hỏi và AudioUrl để tránh trùng lặp
        private static string BuildKey(Listening item) =>
            $"{item.Question?.Trim() ?? string.Empty}||{item.AudioUrl?.Trim() ?? string.Empty}";

        private static void ApplyListeningValues(Listening target, Listening source)
        {
            target.AudioUrl = source.AudioUrl;
            target.ImageUrl = source.ImageUrl;
            target.Transcript = source.Transcript;
            target.Question = source.Question;
            target.OptionA = source.OptionA;
            target.OptionB = source.OptionB;
            target.OptionC = source.OptionC;
            target.OptionD = source.OptionD;
            target.CorrectAnswer = source.CorrectAnswer;
        }
        #endregion

        private async Task<List<ListeningFileDefinition>> LoadDefinitionsAsync(IEnumerable<string> jsonFiles)
        {
            var definitions = new List<ListeningFileDefinition>();

            foreach (var filePath in jsonFiles)
            {
                try
                {
                    var jsonData = await File.ReadAllTextAsync(filePath);
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var listeningList = JsonSerializer.Deserialize<List<Listening>>(jsonData, options);

                    if (listeningList == null || listeningList.Count == 0) continue;

                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                    var (lessonNumberFromFile, levelNameFromFile) = ParseFileMetadata(fileName);
                    Lesson? targetLesson = null;

                    // 1. ƯU TIÊN SỐ 1: Tìm theo LessonId có sẵn trong JSON
                    var jsonLessonId = listeningList.FirstOrDefault()?.LessonId ?? 0;
                    if (jsonLessonId > 0)
                    {
                        var lessonById = await _context.Lessons
                            .Include(l => l.Level)
                            .FirstOrDefaultAsync(l => l.LessonId == jsonLessonId);

                        if (lessonById != null && IsListeningSkillType(lessonById.SkillType))
                        {
                            targetLesson = lessonById;
                        }
                    }

                    // 2. NẾU KHÔNG CÓ LESSON ID TRONG JSON: Tìm bằng số bài và LevelName từ tên file
                    if (targetLesson == null && lessonNumberFromFile.HasValue)
                    {
                        var lessonCandidates = await _context.Lessons
                            .Include(l => l.Level)
                            .Where(l => string.IsNullOrWhiteSpace(levelNameFromFile) ||
                                        (l.Level != null && l.Level.LevelName == levelNameFromFile))
                            .ToListAsync();

                        targetLesson = lessonCandidates.FirstOrDefault(l =>
                            IsListeningSkillType(l.SkillType) &&
                            ExtractLessonNumber(l.LessonName) == lessonNumberFromFile);
                    }

                    // 3. NẾU TÊN FILE CHỈ LÀ SỐ (Fallback cổ điển)
                    if (targetLesson == null)
                    {
                        var match = Regex.Match(fileName, @"\d+");
                        if (match.Success)
                        {
                            int fallbackLessonNumber = int.Parse(match.Value);
                            var fallbackCandidates = await _context.Lessons.Include(l => l.Level).ToListAsync();
                            
                            targetLesson = fallbackCandidates.FirstOrDefault(l => 
                                ExtractLessonNumber(l.LessonName) == fallbackLessonNumber && 
                                IsListeningSkillType(l.SkillType) &&
                                // Bắt buộc ưu tiên vào N5 nếu không xác định được
                                (l.Level != null && l.Level.LevelName == JlptLevels.N5));
                        }
                    }

                    if (targetLesson == null)
                    {
                        Console.WriteLine($"[Listening Error] Target lesson not found for file {fileName}. Skipping.");
                        continue;
                    }

                    var entriesByKey = new Dictionary<string, Listening>();
                    foreach (var item in listeningList)
                    {
                        var key = BuildKey(item);
                        // Bỏ qua nếu cả câu hỏi và Audio đều trống
                        if (string.IsNullOrWhiteSpace(key) || key == "||") continue;

                        item.LessonId = targetLesson.LessonId;
                        entriesByKey[key] = item;
                    }

                    definitions.Add(new ListeningFileDefinition
                    {
                        FileName = fileName,
                        TargetLesson = targetLesson,
                        EntriesByKey = entriesByKey
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Listening Error] Lỗi xử lý file {Path.GetFileName(filePath)}: {ex.Message}");
                }
            }

            return definitions;
        }

        public async Task ImportAllFromFolderAsync()
        {
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Listenings");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Listening] Folder không tồn tại: {folderPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(folderPath, "*.json");
            if (jsonFiles.Length == 0)
            {
                Console.WriteLine("[Listening] Không tìm thấy file .json nào trong wwwroot/data/Listenings.");
                return;
            }

            var definitions = await LoadDefinitionsAsync(jsonFiles);
            if (definitions.Count == 0)
            {
                Console.WriteLine("[Listening] Không có định dạng Listening hợp lệ nào được tải.");
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

            var existingListenings = await _context.Listenings
                .Where(v => desiredLessonIds.Contains(v.LessonId))
                .ToListAsync();

            var fulfilledKeysByLesson = existingListenings
                .GroupBy(v => v.LessonId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(BuildKey).ToHashSet());

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
                    var inLesson = existingListenings
                        .FirstOrDefault(v => v.LessonId == lessonId && BuildKey(v) == key);

                    if (inLesson != null)
                    {
                        ApplyListeningValues(inLesson, desired);
                        fulfilledKeysByLesson[lessonId].Add(key);
                        updatedCount++;
                        continue;
                    }

                    // Lưu ý: Khóa chính giả định là ListeningId
                    var donor = existingListenings.FirstOrDefault(v =>
                        !recycledRows.Contains(v.ListeningId) &&
                        BuildKey(v) == key &&
                        expectedLessonsByKey.TryGetValue(key, out var expectedLessons) &&
                        !expectedLessons.Contains(v.LessonId));

                    if (donor != null)
                    {
                        donor.LessonId = lessonId;
                        ApplyListeningValues(donor, desired);
                        fulfilledKeysByLesson.TryAdd(donor.LessonId, new HashSet<string>());
                        fulfilledKeysByLesson[lessonId].Add(key);
                        recycledRows.Add(donor.ListeningId);
                        movedCount++;
                        continue;
                    }

                    var newListening = new Listening
                    {
                        AudioUrl = desired.AudioUrl,
                        ImageUrl = desired.ImageUrl,
                        Transcript = desired.Transcript,
                        Question = desired.Question,
                        OptionA = desired.OptionA,
                        OptionB = desired.OptionB,
                        OptionC = desired.OptionC,
                        OptionD = desired.OptionD,
                        CorrectAnswer = desired.CorrectAnswer,
                        LessonId = lessonId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Listenings.Add(newListening);
                    existingListenings.Add(newListening);
                    fulfilledKeysByLesson[lessonId].Add(key);
                    addedCount++;
                }
            }

            // 2. Thực hiện Xóa các bản ghi thừa
            var rowsToDelete = new List<Listening>();
            foreach (var lessonGroup in existingListenings.GroupBy(v => v.LessonId))
            {
                if (!desiredByLesson.TryGetValue(lessonGroup.Key, out var desiredEntries))
                {
                    continue;
                }

                var seenKeys = new HashSet<string>();
                foreach (var listening in lessonGroup.OrderBy(v => v.ListeningId)) 
                {
                    var key = BuildKey(listening);
                    var isDesiredInLesson = desiredEntries.ContainsKey(key);

                    if (isDesiredInLesson && seenKeys.Add(key))
                    {
                        continue;
                    }

                    if (!expectedLessonsByKey.ContainsKey(key))
                    {
                        rowsToDelete.Add(listening);
                    }
                }
            }

            if (rowsToDelete.Count > 0)
            {
                _context.Listenings.RemoveRange(rowsToDelete);
            }

            await _context.SaveChangesAsync();

            Console.WriteLine(
                $"[Listening] Đối soát hoàn tất. Files={definitions.Count}, Added={addedCount}, Moved={movedCount}, Updated={updatedCount}, Deleted={rowsToDelete.Count}");
        }
    }
}