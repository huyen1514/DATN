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

        private int GetUserId()
        {
            var nameClaim = User.FindFirst(ClaimTypes.NameIdentifier);
            if (nameClaim?.Value == null)
                throw new UnauthorizedAccessException("User ID not found in token");
            return int.Parse(nameClaim.Value);
        }

        // ================= GET LESSONS WITH CARD COUNTS =================
        /// <summary>
        /// Returns all lessons that have vocab or kanji data, grouped with card counts
        /// </summary>
        [HttpGet("lessons")]
        public async Task<IActionResult> GetLessons()
        {
            // Get vocab counts per lesson
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

            // Get user's decks to show progress
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
                
                var vocabDeck = userDecks.FirstOrDefault(d => d.Title == $"[Từ vựng] {l.LessonName}");
                var kanjiDeck = userDecks.FirstOrDefault(d => d.Title == $"[Kanji] {l.LessonName}");

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

        // ================= START / GET DECK FOR A LESSON =================
        /// <summary>
        /// Creates a Deck + FlashCards from vocab/kanji data for the user.
        /// If already created, returns the existing deck ID.
        /// type: "vocab" or "kanji"
        /// </summary>
        [HttpPost("start/{type}/{lessonId}")]
        [Authorize]
        public async Task<IActionResult> StartLesson(string type, int lessonId)
        {
            var userId = GetUserId();

            // Check if lesson exists
            var lesson = await _context.Lessons
                .Include(l => l.Level)
                .FirstOrDefaultAsync(l => l.LessonId == lessonId);

            if (lesson == null)
                return NotFound("Không tìm thấy bài học");

            // Generate a unique deck title based on type and lesson
            var deckTitle = type.ToLower() == "kanji"
                ? $"[Kanji] {lesson.LessonName}"
                : $"[Từ vựng] {lesson.LessonName}";

            // Check if user already has this deck
            var existingDeck = await _context.Decks
                .Include(d => d.FlashCards)
                .FirstOrDefaultAsync(d => d.UserId == userId && d.Title == deckTitle);

            if (existingDeck != null)
            {
                // If the deck exists but has no flashcards, regenerate them
                if (existingDeck.FlashCards == null || existingDeck.FlashCards.Count == 0)
                {
                    await GenerateFlashCards(existingDeck.DeckId, type, lessonId);
                    existingDeck.TotalCards = await _context.FlashCards.CountAsync(f => f.DeckId == existingDeck.DeckId);
                    await _context.SaveChangesAsync();
                }

                return Ok(new
                {
                    deckId = existingDeck.DeckId,
                    title = existingDeck.Title,
                    isNew = false
                });
            }

            // Create new deck
            var deck = new Deck
            {
                Title = deckTitle,
                Description = $"{lesson.Level?.LevelName ?? ""} - {lesson.LessonName}",
                IsPublic = false,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();

            // Generate flashcards
            await GenerateFlashCards(deck.DeckId, type, lessonId);

            // Calculate total cards AFTER saving flashcards
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
            if (type.ToLower() == "kanji")
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
            else // vocab
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
