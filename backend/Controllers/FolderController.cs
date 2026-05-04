using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using System.Security.Claims;
using DTOs.Folder;

namespace Controllers
{
    [ApiController]
    [Route("api/folders")]
    [Authorize]
    public class FolderController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FolderController(AppDbContext context)
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
        public async Task<IActionResult> Create(CreateFolderRequest dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Name))
                return BadRequest("Tên folder không được để trống");

            var folder = new Folder
            {
                Name = dto.Name,
                Description = dto.Description,
                UserId = GetUserId(),
                CreatedAt = DateTime.UtcNow
            };

            _context.Folders.Add(folder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Tạo folder thành công",
                data = folder
            });
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var userId = GetUserId();

            var folders = await _context.Folders
                .Where(x => x.UserId == userId)
                .Include(x => x.Decks)
                .Select(f => new
                {
                    f.FolderId,
                    f.Name,
                    f.Description,
                    f.CreatedAt,
                    Decks = f.Decks.Select(d => new
                    {
                        d.DeckId,
                        d.Title
                    }).ToList()
                })
                .ToListAsync();

            return Ok(folders);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var userId = GetUserId();

            var folder = await _context.Folders
                .Where(x => x.FolderId == id && x.UserId == userId)
                .Include(x => x.Decks)
                .Select(f => new
                {
                    f.FolderId,
                    f.Name,
                    f.Description,
                    f.CreatedAt,
                    Decks = f.Decks.Select(d => new
                    {
                        d.DeckId,
                        d.Title
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (folder == null)
                return NotFound("Không tìm thấy folder");

            return Ok(folder);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, UpdateFolderRequest dto)
        {
            var userId = GetUserId();

            var folder = await _context.Folders
                .FirstOrDefaultAsync(x => x.FolderId == id && x.UserId == userId);

            if (folder == null)
                return NotFound("Không tìm thấy folder");

            folder.Name = dto.Name ?? folder.Name;
            folder.Description = dto.Description ?? folder.Description;
            folder.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Cập nhật thành công",
                data = folder
            });
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userId = GetUserId();

            var folder = await _context.Folders
                .FirstOrDefaultAsync(x => x.FolderId == id && x.UserId == userId);

            if (folder == null)
                return NotFound("Không tìm thấy folder");

            var decks = await _context.Decks.Where(d => d.FolderId == id).ToListAsync();
            if (decks.Any())
            {
                _context.Decks.RemoveRange(decks);
            }

            _context.Folders.Remove(folder);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Đã xoá folder"
            });
        }
    }
}
