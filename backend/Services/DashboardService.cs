using Data;
using DTOs.Dashboard;
using Microsoft.EntityFrameworkCore;
using Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services
{
    public class DashboardService : IDashboardService
    {
        private readonly IUserProgressRepository _userProgressRepository;
        private readonly AppDbContext _context;

        public DashboardService(IUserProgressRepository userProgressRepository, AppDbContext context)
        {
            _userProgressRepository = userProgressRepository;
            _context = context;
        }

        public async Task<DashboardResponse> GetDashboardAsync(int userId)
        {
            // 1. Kiểm tra User tồn tại
            if (!await _userProgressRepository.UserExistsAsync(userId))
            {
                throw new KeyNotFoundException("User was not found.");
            }

            // 2. Lấy dữ liệu từ Repository
            var progresses = await _userProgressRepository.GetByUserIdAsync(userId);

            // BẢO VỆ 1: Tránh lỗi NullReferenceException nếu chưa có tiến độ nào
            if (progresses == null || !progresses.Any())
            {
                return new DashboardResponse
                {
                    UserId = userId,
                    TotalLessonsLearned = 0,
                    CompletedLessons = 0,
                    AverageScore = 0
                };
            }

            // BẢO VỆ 2: Ép kiểu về List (RAM) để tránh lỗi biên dịch SQL của Entity Framework
            var progressList = progresses.ToList();

            // 3. Tính toán an toàn
            var totalLessons = progressList.Count;
            var completedLessons = progressList.Count(x => x.Completed);

            // BẢO VỆ 3: Lọc riêng các điểm số hợp lệ để tính trung bình, tránh lỗi Null hoặc chia cho 0
            var validScores = progressList
                .Where(x => x.Score > 0) // Chỉ lấy các bài đã có điểm (> 0)
                .Select(x => (decimal)x.Score)
                .ToList();

            decimal averageScore = validScores.Any() 
                ? Math.Round((decimal)validScores.Average(), 2) 
                : 0m;

            return new DashboardResponse
            {
                UserId = userId,
                TotalLessonsLearned = totalLessons,
                CompletedLessons = completedLessons,
                AverageScore = averageScore
            };
        }

        public async Task<AdminDashboardStats> GetAdminDashboardStatsAsync()
        {
            return new AdminDashboardStats
            {
                Levels = await _context.Levels.CountAsync(),
                Lessons = await _context.Lessons.CountAsync(),
                Kanjis = await _context.Kanjis.CountAsync(),
                Grammars = await _context.Grammars.CountAsync(),
                Vocabularies = await _context.Vocabularies.CountAsync(),
                Listenings = await _context.Listenings.CountAsync(),
                Readings = await _context.ReadingPassages.CountAsync(),
                Exams = await _context.Exams.CountAsync(),
                Users = await _context.Users.CountAsync(),
                Folders = await _context.Folders.CountAsync(),
                Decks = await _context.Decks.CountAsync()
            };
        }
    }
}