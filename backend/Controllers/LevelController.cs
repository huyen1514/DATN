using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;

namespace Controllers
{
    [ApiController]
    [Route("api/levels")]
    public class LevelController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LevelController(AppDbContext context)
        {
            _context = context;
        }

        // CREATE
        [HttpPost]
        public async Task<IActionResult> Create(Level model)
        {
            // check trùng tên
            var exists = await _context.Levels
                .AnyAsync(x => x.LevelName == model.LevelName);

            if (exists)
                return BadRequest("Level đã tồn tại");

            model.CreatedAt = DateTime.UtcNow;

            _context.Levels.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        // GET ALL
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var levels = await _context.Levels
                .OrderBy(x => x.LevelId)
                .ToListAsync();

            return Ok(levels);
        }

        // GET BY ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var level = await _context.Levels.FindAsync(id);

            if (level == null)
                return NotFound("Không tìm thấy level");

            return Ok(level);
        }

        // UPDATE
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Level model)
        {
            var level = await _context.Levels.FindAsync(id);

            if (level == null)
                return NotFound("Không tìm thấy level");

            // check trùng tên (trừ chính nó)
            var exists = await _context.Levels
                .AnyAsync(x => x.LevelName == model.LevelName && x.LevelId != id);

            if (exists)
                return BadRequest("Level đã tồn tại");

            level.LevelName = model.LevelName;

            await _context.SaveChangesAsync();

            return Ok(level);
        }

        // DELETE
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var level = await _context.Levels.FindAsync(id);

            if (level == null)
                return NotFound("Không tìm thấy level");

            _context.Levels.Remove(level);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá level");
        }
    }
}