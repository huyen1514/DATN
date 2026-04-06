using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using DTOs;
using System.Linq;
using System.Security.Claims;

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

        //Lấy userId từ token
        private int GetUserId()
        {
            return int.Parse(User.FindFirst(ClaimTypes.NameIdentifier).Value);
        }

        // CREATE FLASHCARD
        
        [HttpPost]
        public async Task<IActionResult> Create(CreateFlashCardRequest dto)
        {
            var userId = GetUserId();

            var exists = await _context.Set<FlashCard>().AnyAsync(x =>
                x.UserId == userId &&
                x.ItemType == dto.ItemType &&
                x.ItemId == dto.ItemId
            );

            if (exists)
                return BadRequest("Flashcard đã tồn tại");

            var flashcard = new FlashCard
            {
                UserId = userId,
                ItemType = dto.ItemType,
                ItemId = dto.ItemId,
                Status = FlashCardStatus.New,
                NextReviewDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Set<FlashCard>().Add(flashcard);
            await _context.SaveChangesAsync();

            return Ok(flashcard);
        }

        // GET ALL (user)
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var list = await _context.Set<FlashCard>()
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.NextReviewDate)
                .ToListAsync();

            return Ok(list);
        }

        // GET TODAY (để học)
        [HttpGet("today")]
        public async Task<IActionResult> GetToday()
        {
            var userId = GetUserId();

            var now = DateTime.UtcNow;

            var list = await _context.Set<FlashCard>()
                .Where(x => x.UserId == userId && x.NextReviewDate <= now)
                .OrderBy(x => x.NextReviewDate)
                .Take(20)
                .ToListAsync();

            return Ok(list);
        }

        //  REVIEW
        [HttpPost("review")]
        public async Task<IActionResult> Review(ReviewFlashCardRequest dto)
        {
            var userId = GetUserId();

            var card = await _context.Set<FlashCard>()
                .FirstOrDefaultAsync(x => x.FlashCardId == dto.FlashCardId && x.UserId == userId);

            if (card == null)
                return NotFound();

            //  update trạng thái
            card.ReviewCount++;
            card.LastReviewedAt = DateTime.UtcNow;

            // thuật toán đơn giản (giống Anki lite)
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

            return Ok(card);
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var card = await _context.Set<FlashCard>()
                .FirstOrDefaultAsync(x => x.FlashCardId == id && x.UserId == userId);

            if (card == null)
                return NotFound();

            _context.Set<FlashCard>().Remove(card);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá");
        }
    }

    public class ReviewFlashCardRequest
    {
        public int FlashCardId { get; set; }
        public int Score { get; set; }
    }

    public class CreateFlashCardRequest
    {
        public string ItemType { get; set; }
        public int ItemId { get; set; }
    }
}