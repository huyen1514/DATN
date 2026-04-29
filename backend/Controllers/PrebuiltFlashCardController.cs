using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using System.Security.Claims;

namespace Controllers
{
    [ApiController]
    [Route("api/prebuilt-flashcards")]
    public class PrebuiltFlashCardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PrebuiltFlashCardController(AppDbContext context)
        {
            _context = context;
        }

        private static string NormalizeDeckType(string type) =>
            string.Equals(type, "kanji", StringComparison.OrdinalIgnoreCase) ? "kanji" : "vocab";

        private static string BuildDeckTitle(string type, Lesson lesson)
        {
            var normalizedType = NormalizeDeckType(type);
            var levelName = lesson.Level?.LevelName ?? "unknown";
            return $"[{normalizedType}][{levelName}][{lesson.LessonId}] {lesson.LessonName}";
        }

        private static string BuildLegacyDeckTitle(string type, Lesson lesson) =>
            NormalizeDeckType(type) == "kanji"
                ? $"[Kanji] {lesson.LessonName}"
                : $"[legacy-vocab] {lesson.LessonName}";

        private static string BuildDeckDescription(Lesson lesson) =>
            $"{lesson.Level?.LevelName ?? string.Empty} - {lesson.LessonName}";

        private static bool IsMatchingDeck(Deck deck, string type, Lesson lesson)
        {
            if (deck.Title == BuildDeckTitle(type, lesson))
            {
                return true;
            }

            if (deck.Description != BuildDeckDescription(lesson))
            {
                return false;
            }

            var legacyKanjiTitle = BuildLegacyDeckTitle("kanji", lesson);
            var newKanjiTitle = BuildDeckTitle("kanji", lesson);

            return NormalizeDeckType(type) == "kanji"
                ? deck.Title == legacyKanjiTitle
                : deck.Title != legacyKanjiTitle && deck.Title != newKanjiTitle;
        }

        private int GetUserId()
        {
            var nameClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (nameClaim?.Value == null)
            {
                throw new UnauthorizedAccessException("User ID not found in token");
            }

            return int.Parse(nameClaim.Value);
        }

        [HttpGet("lessons")]
        public async Task<IActionResult> GetLessons()
        {
            var lessonData = await _context.Vocabularies
                .GroupBy(v => v.LessonId)
                .Select(g => new
                {
                    LessonId = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var kanjiData = await _context.Kanjis
                .GroupBy(k => k.LessonId)
                .Select(g => new
                {
                    LessonId = g.Key,
                    Count = g.Count()
                })
                .ToListAsync();

            var allLessonIds = lessonData.Select(v => v.LessonId)
                .Union(kanjiData.Select(k => k.LessonId))
                .Distinct()
                .ToList();

            var lessons = await _context.Lessons
                .Where(l => allLessonIds.Contains(l.LessonId))
                .Include(l => l.Level)
                .OrderBy(l => l.LevelId)
                .ThenBy(l => l.LessonId)
                .ToListAsync();

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            var userDecks = new List<Deck>();
            if (userIdStr != null)
            {
                var userId = int.Parse(userIdStr);
                userDecks = await _context.Decks
                    .Where(d => d.UserId == userId)
                    .Include(d => d.FlashCards)
                    .ToListAsync();
            }

            var result = lessons.Select(l =>
            {
                var vocabCount = lessonData.FirstOrDefault(d => d.LessonId == l.LessonId)?.Count ?? 0;
                var kanjiCount = kanjiData.FirstOrDefault(d => d.LessonId == l.LessonId)?.Count ?? 0;
                var vocabDeck = userDecks.FirstOrDefault(d => IsMatchingDeck(d, "vocab", l));
                var kanjiDeck = userDecks.FirstOrDefault(d => IsMatchingDeck(d, "kanji", l));

                return new
                {
                    l.LessonId,
                    l.LessonName,
                    LevelName = l.Level?.LevelName,
                    VocabCount = vocabCount,
                    KanjiCount = kanjiCount,
                    VocabMastered = vocabDeck?.FlashCards.Count(f => f.Status == FlashCardStatus.Mastered) ?? 0,
                    KanjiMastered = kanjiDeck?.FlashCards.Count(f => f.Status == FlashCardStatus.Mastered) ?? 0,
                    VocabDeckId = vocabDeck?.DeckId,
                    KanjiDeckId = kanjiDeck?.DeckId,
                    LastStudiedAt = vocabDeck?.LastStudiedAt ?? kanjiDeck?.LastStudiedAt
                };
            });

            return Ok(result);
        }

        [HttpPost("start/{type}/{lessonId}")]
        [Authorize]
        public async Task<IActionResult> StartLesson(string type, int lessonId)
        {
            var userId = GetUserId();

            var lesson = await _context.Lessons
                .Include(l => l.Level)
                .FirstOrDefaultAsync(l => l.LessonId == lessonId);

            if (lesson == null)
            {
                return NotFound("KhÃ´ng tÃ¬m tháº¥y bÃ i há»c");
            }

            var deckTitle = BuildDeckTitle(type, lesson);
            var deckDescription = BuildDeckDescription(lesson);

            var candidateDecks = await _context.Decks
                .Include(d => d.FlashCards)
                .Where(d =>
                    d.UserId == userId &&
                    (d.Title == deckTitle || d.Description == deckDescription))
                .ToListAsync();

            var existingDeck = candidateDecks.FirstOrDefault(d => IsMatchingDeck(d, type, lesson));

            if (existingDeck != null)
            {
                if (existingDeck.Title != deckTitle || existingDeck.Description != deckDescription)
                {
                    existingDeck.Title = deckTitle;
                    existingDeck.Description = deckDescription;
                }

                if (existingDeck.FlashCards == null || existingDeck.FlashCards.Count == 0)
                {
                    await GenerateFlashCards(existingDeck.DeckId, type, lessonId);
                    existingDeck.TotalCards = await _context.FlashCards.CountAsync(f => f.DeckId == existingDeck.DeckId);
                }

                await _context.SaveChangesAsync();

                return Ok(new
                {
                    deckId = existingDeck.DeckId,
                    title = existingDeck.Title,
                    isNew = false
                });
            }

            var deck = new Deck
            {
                Title = deckTitle,
                Description = deckDescription,
                IsPublic = false,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();

            await GenerateFlashCards(deck.DeckId, type, lessonId);

            deck.TotalCards = await _context.FlashCards.CountAsync(f => f.DeckId == deck.DeckId);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                deckId = deck.DeckId,
                title = deck.Title,
                isNew = true
            });
        }

        private async Task GenerateFlashCards(int deckId, string type, int lessonId)
        {
            if (NormalizeDeckType(type) == "kanji")
            {
                var kanjis = await _context.Kanjis
                    .Where(k => k.LessonId == lessonId)
                    .OrderBy(k => k.KanjiId)
                    .ToListAsync();

                var flashCards = kanjis.Select(k => new FlashCard
                {
                    DeckId = deckId,
                    FrontText = k.Character,
                    HiraganaText = string.IsNullOrEmpty(k.Kunyomi)
                        ? k.Onyomi
                        : $"{k.Onyomi} / {k.Kunyomi}",
                    BackText = k.Meaning,
                    Example = k.Example,
                    Status = FlashCardStatus.New,
                    CreatedAt = DateTime.UtcNow,
                    NextReviewDate = DateTime.UtcNow
                }).ToList();

                _context.FlashCards.AddRange(flashCards);
            }
            else
            {
                var vocabs = await _context.Vocabularies
                    .Where(v => v.LessonId == lessonId)
                    .OrderBy(v => v.VocabularyId)
                    .ToListAsync();

                var flashCards = vocabs.Select(v => new FlashCard
                {
                    DeckId = deckId,
                    FrontText = v.Word,
                    HiraganaText = v.Reading,
                    BackText = v.Meaning,
                    Example = v.Example,
                    AudioUrl = v.AudioUrl,
                    Status = FlashCardStatus.New,
                    CreatedAt = DateTime.UtcNow,
                    NextReviewDate = DateTime.UtcNow
                }).ToList();

                _context.FlashCards.AddRange(flashCards);
            }

            await _context.SaveChangesAsync();
        }
    }
}
