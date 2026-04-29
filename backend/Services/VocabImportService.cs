using System.Globalization;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Services
{
    public class VocabImportService
    {
        private sealed class VocabFileDefinition
        {
            public required string FileName { get; init; }
            public required Lesson TargetLesson { get; init; }
            public required Dictionary<string, Vocabulary> EntriesByKey { get; init; }
        }

        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public VocabImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        private static string NormalizeAscii(string? input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return string.Empty;
            }

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

        private static bool IsVocabularySkillType(string? skillType)
        {
            var ascii = NormalizeAscii(skillType);
            return ascii == "tu vung" || ascii == "vocabulary";
        }

        private static int? ExtractLessonNumber(string? lessonName)
        {
            if (string.IsNullOrWhiteSpace(lessonName))
            {
                return null;
            }

            var match = Regex.Match(lessonName, @"(\d+)");
            return match.Success ? int.Parse(match.Value) : null;
        }

        private static (int? LessonNumber, string? LevelName) ParseFileMetadata(string fileName)
        {
            var match = Regex.Match(
                fileName,
                @"^vocab_(?<lesson>\d+)(?:_(?<level>n\d+))?$",
                RegexOptions.IgnoreCase);

            if (!match.Success)
            {
                return (null, null);
            }

            var lessonNumber = int.Parse(match.Groups["lesson"].Value);
            var levelName = match.Groups["level"].Success
                ? match.Groups["level"].Value.ToUpperInvariant()
                : null;

            return (lessonNumber, levelName);
        }

        private static string BuildKey(string? word, string? reading) =>
            $"{word?.Trim() ?? string.Empty}||{reading?.Trim() ?? string.Empty}";

        private static void ApplyVocabularyValues(Vocabulary target, Vocabulary source)
        {
            target.Word = source.Word;
            target.Reading = source.Reading;
            target.Meaning = source.Meaning;
            target.Example = source.Example;
            target.PartOfSpeech = source.PartOfSpeech;
            target.AudioUrl = source.AudioUrl;
            target.UpdatedAt = DateTime.UtcNow;
        }

        private async Task<List<VocabFileDefinition>> LoadDefinitionsAsync(IEnumerable<string> jsonFiles)
        {
            var definitions = new List<VocabFileDefinition>();

            foreach (var filePath in jsonFiles)
            {
                try
                {
                    var jsonData = await File.ReadAllTextAsync(filePath);
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var vocabList = JsonSerializer.Deserialize<List<Vocabulary>>(jsonData, options);

                    if (vocabList == null || vocabList.Count == 0)
                    {
                        continue;
                    }

                    var fileName = Path.GetFileNameWithoutExtension(filePath);
                    var (lessonNumberFromFile, levelNameFromFile) = ParseFileMetadata(fileName);
                    Lesson? targetLesson = null;

                    var jsonLessonId = vocabList.FirstOrDefault()?.LessonId ?? 0;
                    if (jsonLessonId > 0)
                    {
                        var lessonById = await _context.Lessons
                            .Include(l => l.Level)
                            .FirstOrDefaultAsync(l => l.LessonId == jsonLessonId);

                        if (lessonById != null &&
                            IsVocabularySkillType(lessonById.SkillType) &&
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
                            IsVocabularySkillType(l.SkillType) &&
                            ExtractLessonNumber(l.LessonName) == lessonNumberFromFile);
                    }

                    if (targetLesson == null)
                    {
                        Console.WriteLine($"Error: Target lesson not found for file {fileName}. Skipping.");
                        continue;
                    }

                    var entriesByKey = new Dictionary<string, Vocabulary>();
                    foreach (var item in vocabList)
                    {
                        var key = BuildKey(item.Word, item.Reading);
                        if (string.IsNullOrWhiteSpace(item.Word) || string.IsNullOrWhiteSpace(item.Reading))
                        {
                            continue;
                        }

                        item.LessonId = targetLesson.LessonId;
                        entriesByKey[key] = item;
                    }

                    definitions.Add(new VocabFileDefinition
                    {
                        FileName = fileName,
                        TargetLesson = targetLesson,
                        EntriesByKey = entriesByKey
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error processing {Path.GetFileName(filePath)}: {ex.Message}");
                }
            }

            return definitions;
        }

        public async Task ImportAllFromFolderAsync()
        {
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Vocabs");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"Directory not found: {folderPath}");
                return;
            }

            var jsonFiles = Directory.GetFiles(folderPath, "*.json");
            if (jsonFiles.Length == 0)
            {
                Console.WriteLine("No .json files found in wwwroot/data/Vocabs.");
                return;
            }

            var definitions = await LoadDefinitionsAsync(jsonFiles);
            if (definitions.Count == 0)
            {
                Console.WriteLine("No valid vocab definitions were loaded.");
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

            var existingVocabs = await _context.Vocabularies
                .Where(v => desiredLessonIds.Contains(v.LessonId))
                .ToListAsync();

            var fulfilledKeysByLesson = existingVocabs
                .GroupBy(v => v.LessonId)
                .ToDictionary(
                    g => g.Key,
                    g => g.Select(v => BuildKey(v.Word, v.Reading)).ToHashSet());

            var recycledRows = new HashSet<int>();
            var addedCount = 0;
            var movedCount = 0;
            var updatedCount = 0;

            foreach (var (lessonId, desiredEntries) in desiredByLesson)
            {
                fulfilledKeysByLesson.TryAdd(lessonId, new HashSet<string>());

                foreach (var (key, desired) in desiredEntries)
                {
                    var inLesson = existingVocabs
                        .FirstOrDefault(v => v.LessonId == lessonId && BuildKey(v.Word, v.Reading) == key);

                    if (inLesson != null)
                    {
                        ApplyVocabularyValues(inLesson, desired);
                        fulfilledKeysByLesson[lessonId].Add(key);
                        updatedCount++;
                        continue;
                    }

                    var donor = existingVocabs.FirstOrDefault(v =>
                        !recycledRows.Contains(v.VocabularyId) &&
                        BuildKey(v.Word, v.Reading) == key &&
                        expectedLessonsByKey.TryGetValue(key, out var expectedLessons) &&
                        !expectedLessons.Contains(v.LessonId));

                    if (donor != null)
                    {
                        donor.LessonId = lessonId;
                        ApplyVocabularyValues(donor, desired);
                        fulfilledKeysByLesson.TryAdd(donor.LessonId, new HashSet<string>());
                        fulfilledKeysByLesson[lessonId].Add(key);
                        recycledRows.Add(donor.VocabularyId);
                        movedCount++;
                        continue;
                    }

                    var newVocab = new Vocabulary
                    {
                        Word = desired.Word,
                        Reading = desired.Reading,
                        Meaning = desired.Meaning,
                        Example = desired.Example,
                        PartOfSpeech = desired.PartOfSpeech,
                        AudioUrl = desired.AudioUrl,
                        LessonId = lessonId,
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.Vocabularies.Add(newVocab);
                    existingVocabs.Add(newVocab);
                    fulfilledKeysByLesson[lessonId].Add(key);
                    addedCount++;
                }
            }

            var rowsToDelete = new List<Vocabulary>();
            foreach (var lessonGroup in existingVocabs.GroupBy(v => v.LessonId))
            {
                if (!desiredByLesson.TryGetValue(lessonGroup.Key, out var desiredEntries))
                {
                    continue;
                }

                var seenKeys = new HashSet<string>();
                foreach (var vocab in lessonGroup.OrderBy(v => v.VocabularyId))
                {
                    var key = BuildKey(vocab.Word, vocab.Reading);
                    var isDesiredInLesson = desiredEntries.ContainsKey(key);

                    if (isDesiredInLesson && seenKeys.Add(key))
                    {
                        continue;
                    }

                    if (expectedLessonsByKey.ContainsKey(key))
                    {
                        rowsToDelete.Add(vocab);
                    }
                }
            }

            if (rowsToDelete.Count > 0)
            {
                _context.Vocabularies.RemoveRange(rowsToDelete);
            }

            await _context.SaveChangesAsync();

            Console.WriteLine(
                $"Vocabulary reconcile completed. Files={definitions.Count}, Added={addedCount}, Moved={movedCount}, Updated={updatedCount}, Deleted={rowsToDelete.Count}");
        }
    }
}
