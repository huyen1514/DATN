using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using System.Security.Claims;
using DTOs.Deck;
using DTOs.FlashCard;

namespace Controllers
{
    [ApiController]
    [Route("api/decks")]
    [Authorize]
    public class DeckController : ControllerBase
    {
        private readonly AppDbContext _context;

        public DeckController(AppDbContext context)
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

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create(CreateDeckRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
                return BadRequest("Tên deck không được để trống");

            var deck = new Deck
            {
                Title = dto.Title,
                Description = dto.Description,
                IsPublic = dto.IsPublic,
                FolderId = dto.FolderId,
                UserId = GetUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Decks.Add(deck);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo deck thành công",
                data = deck
            });
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var decks = await _context.Decks
                .Where(x => x.UserId == userId)
                .Include(x => x.FlashCards)
                .Select(d => new DeckResponse
                {
                    DeckId = d.DeckId,
                    Title = d.Title,
                    Description = d.Description,
                    IsPublic = d.IsPublic,
                    CreatedAt = d.CreatedAt,
                    FlashCardCount = d.FlashCards.Count
                })
                .ToListAsync();

            return Ok(decks);
        }

        // GET DETAIL
        [HttpGet("{id}")]
        public async Task<IActionResult> GetDetail(int id)
        {
            var userId = GetUserId();

            var deck = await _context.Decks
                .Where(x => x.DeckId == id && x.UserId == userId)
                .Include(x => x.FlashCards)
                .Select(d => new DeckDetailResponse
                {
                    DeckId = d.DeckId,
                    Title = d.Title,
                    Description = d.Description,
                    IsPublic = d.IsPublic,
                    CreatedAt = d.CreatedAt,
                    FlashCards = d.FlashCards.Select(f => new FlashCardResponse
                    {
                        FlashCardId = f.FlashCardId,
                        FrontText = f.FrontText,
                        HiraganaText = f.HiraganaText,
                        BackText = f.BackText,
                        Example = f.Example,
                        AudioUrl = f.AudioUrl,
                        Status = f.Status.ToString(),
                        NextReviewDate = f.NextReviewDate,
                        ReviewCount = f.ReviewCount
                    }).ToList()
    })
    .FirstOrDefaultAsync();

            if (deck == null)
                return NotFound("Không tìm thấy deck");

            return Ok(deck);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateDeckRequest dto)
        {
            var userId = GetUserId();

            var deck = await _context.Decks
                .FirstOrDefaultAsync(x => x.DeckId == id && x.UserId == userId);

            if (deck == null)
                return NotFound("Không tìm thấy deck");

            deck.Title = dto.Title ?? deck.Title;
            deck.Description = dto.Description ?? deck.Description;
            deck.IsPublic = dto.IsPublic;
            deck.FolderId = dto.FolderId;
            deck.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thành công",
                data = deck
            });
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var deck = await _context.Decks
                .FirstOrDefaultAsync(x => x.DeckId == id && x.UserId == userId);

            if (deck == null)
                return NotFound("Không tìm thấy deck");

            _context.Decks.Remove(deck);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã xoá deck"
            });
        }
    }
}
