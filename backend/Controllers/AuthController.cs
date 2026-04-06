using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using DTOs;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwt;

        public AuthController(AppDbContext context, JwtService jwt)
        {
            _context = context;
            _jwt = jwt;
        }

        // Đăng ký
        [HttpPost("register")]
        public async Task<IActionResult> Register(RegisterRequest dto)
        {
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                return BadRequest("Email đã tồn tại");

            var user = new User
            {
                UserName = dto.UserName,
                Email = dto.Email,
                FullName = dto.FullName,
                PassWord = BCrypt.Net.BCrypt.HashPassword(dto.PassWord),
                Role = "Student",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok("Đăng ký thành công");
        }

        // Đăng nhập
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginRequest dto)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(x => x.Email == dto.Email);

            if (user == null)
                return Unauthorized("Email không tồn tại");

            bool isValid = BCrypt.Net.BCrypt.Verify(dto.PassWord, user.PassWord);

            if (!isValid)
                return Unauthorized("Sai mật khẩu");

            var token = _jwt.GenerateToken(user);

            return Ok(new
            {
                message = "Đăng nhập thành công",
                token = token,
                user = new
                {
                    user.UserId,
                    user.UserName,
                    user.Email,
                    user.Role
                }
            });
        }
    }
}