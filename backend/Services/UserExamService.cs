using Data;
using Microsoft.EntityFrameworkCore;
using Models;
using DTOs;

namespace Services
{
    public class UserExamService : IUserExamService
    {
        private readonly AppDbContext _context;

        public UserExamService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, UserExamResponseDto? Data)> CreateAsync(UserExamCreateDto dto)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == dto.UserId);
            if (!userExists) return (false, "User không tồn tại", null);

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == dto.ExamId);
            if (!examExists) return (false, "Exam không tồn tại", null);

            var model = new UserExam
            {
                UserId = dto.UserId,
                ExamId = dto.ExamId,
                PurchaseDate = dto.PurchaseDate ?? DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.UserExams.Add(model);
            await _context.SaveChangesAsync();

            return (true, "Thành công", new UserExamResponseDto(model));
        }

        public async Task<(List<UserExamResponseDto> Data, int Total)> GetAllAsync(int? userId, int? examId, int page, int pageSize)
        {
            var query = _context.UserExams.AsNoTracking().AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            var userExams = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new UserExamResponseDto
                {
                    UserExamId = x.UserExamId,
                    UserId = x.UserId,
                    UserName = x.User.UserName,
                    ExamId = x.ExamId,
                    ExamName = x.Exam.ExamName,
                    PurchaseDate = x.PurchaseDate,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            var totalRecords = await query.CountAsync();

            return (userExams, totalRecords);
        }

        public async Task<UserExamResponseDto?> GetByIdAsync(int id)
        {
            var userExam = await _context.UserExams
                .AsNoTracking()
                .Where(x => x.UserExamId == id)
                .Select(x => new UserExamResponseDto
                {
                    UserExamId = x.UserExamId,
                    UserId = x.UserId,
                    UserName = x.User.UserName,
                    ExamId = x.ExamId,
                    ExamName = x.Exam.ExamName,
                    PurchaseDate = x.PurchaseDate,
                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();

            return userExam;
        }

        public async Task<(bool Success, string Message, UserExamResponseDto? Data)> UpdateAsync(int id, UserExamUpdateDto dto)
        {
            var userExam = await _context.UserExams.FindAsync(id);
            if (userExam == null)
                return (false, "Không tìm thấy quyền truy cập đề thi", null);

            userExam.UserId = dto.UserId;
            userExam.ExamId = dto.ExamId;
            userExam.PurchaseDate = dto.PurchaseDate;

            await _context.SaveChangesAsync();
            return (true, "Thành công", new UserExamResponseDto(userExam));
        }

        public async Task<(bool Success, string Message)> DeleteAsync(int id)
        {
            var rowsAffected = await _context.UserExams
                .Where(x => x.UserExamId == id)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0)
                return (false, "Không tìm thấy quyền truy cập đề thi");

            return (true, "Đã xoá user exam thành công");
        }
    }
}
