using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data;
using Models;
using DTOs;
using Services;
using Microsoft.Extensions.Caching.Memory;

namespace Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly JwtService _jwt;
        private readonly IMemoryCache _cache;
        private readonly EmailService _emailService;

        public AuthController(AppDbContext context, JwtService jwt, IMemoryCache cache, EmailService emailService)
        {
            _context = context;
            _jwt = jwt;
            _cache = cache;
            _emailService = emailService;
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
                    user.FullName,
                    user.Email,
                    user.Role
                }
            });
        }

        // 1. Gửi OTP quên mật khẩu
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest dto)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
            if (user == null)
                return NotFound("Email không tồn tại trong hệ thống");

            // Sinh mã OTP 6 số
            Random rand = new Random();
            string otp = rand.Next(100000, 999999).ToString();

            // Lưu vào Cache với thời gian sống 5 phút
            _cache.Set($"OTP_{dto.Email}", otp, TimeSpan.FromMinutes(5));

            // Gửi email
            string subject = "Khôi phục mật khẩu - Japanese Learning";
            string body = $"<h3>Mã xác thực OTP của bạn là: <span style='color:blue'>{otp}</span></h3><p>Mã này có hiệu lực trong 5 phút.</p>";
            await _emailService.SendEmailAsync(dto.Email, subject, body);

            return Ok("Mã xác thực đã được gửi đến email của bạn");
        }

        // 2. Xác nhận OTP
        [HttpPost("verify-otp")]
        public IActionResult VerifyOtp(VerifyOtpRequest dto)
        {
            if (_cache.TryGetValue($"OTP_{dto.Email}", out string cachedOtp))
            {
                if (cachedOtp == dto.Otp)
                    return Ok("Mã OTP hợp lệ");
                return BadRequest("Mã OTP không chính xác");
            }
            return BadRequest("Mã OTP đã hết hạn hoặc không tồn tại");
        }

        // 3. Đổi mật khẩu
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordRequest dto)
        {
            if (_cache.TryGetValue($"OTP_{dto.Email}", out string cachedOtp))
            {
                if (cachedOtp == dto.Otp)
                {
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.Email);
                    if (user == null) return NotFound("Không tìm thấy user");

                    user.PassWord = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
                    await _context.SaveChangesAsync();

                    // Xóa cache
                    _cache.Remove($"OTP_{dto.Email}");

                    return Ok("Đổi mật khẩu thành công");
                }
                return BadRequest("Mã OTP không chính xác");
            }
            return BadRequest("Mã OTP đã hết hạn");
        }
    }
}