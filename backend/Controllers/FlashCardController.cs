using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using DTOs;
using System.Security.Claims;
using DTOs.FlashCard;

namespace Controllers
{
    [ApiController]
    [Route("api/flashcards")]
    [Authorize]
    public class FlashCardController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FlashCardController(AppDbContext context)
        {
            _context = context;
        }

        private int GetUserId() =>
            int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);

        // ================= CREATE =================
        [HttpPost]
        public async Task<IActionResult> Create(CreateFlashCardRequest dto)
        {
            var userId = GetUserId();

            var card = new FlashCard
            {
                DeckId = dto.DeckId,
                FrontText = dto.FrontText,
                BackText = dto.BackText,
                Example = dto.Example,
                AudioUrl = dto.AudioUrl,
                Status = FlashCardStatus.New,
                CreatedAt = DateTime.UtcNow,
                NextReviewDate = DateTime.UtcNow
            };

            _context.FlashCards.Add(card);
            await _context.SaveChangesAsync();

            return Ok(new FlashCardResponse
            {
                FlashCardId = card.FlashCardId,
                FrontText = card.FrontText,
                BackText = card.BackText,
                Status = card.Status.ToString()
            });
        }

        // ================= GET BY DECK =================
        [HttpGet("deck/{deckId}")]
        public async Task<IActionResult> GetByDeck(int deckId)
        {
            var userId = GetUserId();

            var cards = await _context.FlashCards
                .Where(x => x.DeckId == deckId && x.Deck.UserId == userId)
                .OrderBy(x => x.CreatedAt)
                .Select(x => new FlashCardResponse
                {
                    FlashCardId = x.FlashCardId,
                    FrontText = x.FrontText,
                    BackText = x.BackText,
                    Status = x.Status.ToString()
                })
                .ToListAsync();

            return Ok(cards);
        }

        // ================= UPDATE =================
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateFlashCardRequest dto)
        {
            var userId = GetUserId();

            var card = await _context.FlashCards
                .FirstOrDefaultAsync(x => x.FlashCardId == id && x.Deck.UserId == userId);

            if (card == null) return NotFound();

            card.FrontText = dto.FrontText;
            card.BackText = dto.BackText;
            card.Example = dto.Example;
            card.AudioUrl = dto.AudioUrl;

            await _context.SaveChangesAsync();

            return Ok(new FlashCardResponse
            {
                FlashCardId = card.FlashCardId,
                FrontText = card.FrontText,
                BackText = card.BackText,
                Status = card.Status.ToString()
            });
        }

        // ================= DELETE =================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var card = await _context.FlashCards
                .FirstOrDefaultAsync(x => x.FlashCardId == id && x.Deck.UserId == userId);

            if (card == null) return NotFound();

            _context.FlashCards.Remove(card);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá flashcard");
        }

        // ================= REVIEW =================
        [HttpPost("review")]
        public async Task<IActionResult> Review(ReviewFlashCardRequest dto)
        {
            var userId = GetUserId();

            var card = await _context.FlashCards
                .FirstOrDefaultAsync(x => x.FlashCardId == dto.FlashCardId && x.Deck.UserId == userId);

            if (card == null) return NotFound();

            card.ReviewCount++;
            card.LastReviewedAt = DateTime.UtcNow;

            if (dto.Score >= 4)
            {
                card.Status = FlashCardStatus.Mastered;
                card.NextReviewDate = DateTime.UtcNow.AddDays(card.ReviewCount * 2);
            }
            else if (dto.Score >= 2)
            {
                card.Status = FlashCardStatus.Review;
                card.NextReviewDate = DateTime.UtcNow.AddDays(1);
            }
            else
            {
                card.Status = FlashCardStatus.Learning;
                card.NextReviewDate = DateTime.UtcNow.AddHours(1);
            }

            await _context.SaveChangesAsync();

            return Ok(new FlashCardResponse
            {
                FlashCardId = card.FlashCardId,
                FrontText = card.FrontText,
                BackText = card.BackText,
                Status = card.Status.ToString()
            });
        }
    }
}