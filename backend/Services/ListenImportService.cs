using System.Text.Json;
using Data; 
using Models;
using Microsoft.EntityFrameworkCore;

namespace Services
{
    public class ListenImportService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ListenImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Duyệt tất cả file .json trong thư mục wwwroot/data/Listenings và import vào DB
        /// </summary>
        public async Task ImportAllFromFolderAsync()
        {
            // Trỏ vào folder wwwroot/data/Listenings
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Listenings");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Listening] Thư mục không tồn tại: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json");
            Console.WriteLine($"[Listening] Tìm thấy {files.Length} file JSON.");

            foreach (var file in files)
            {
                try 
                {
                    var (imported, updated) = await ImportListeningFromJsonAsync(file);
                    if (imported > 0 || updated > 0)
                    {
                        Console.WriteLine($"[Listening] File: {Path.GetFileName(file)} -> Thêm mới: {imported}, Cập nhật: {updated}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Listening] Lỗi khi xử lý file {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Đọc nội dung từ một file JSON cụ thể và xử lý AudioUrl
        /// </summary>
        public async Task<(int imported, int updated)> ImportListeningFromJsonAsync(string filePath)
        {
            if (!File.Exists(filePath)) return (0, 0);

            var jsonString = await File.ReadAllTextAsync(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            var listeningList = JsonSerializer.Deserialize<List<Listening>>(jsonString, options);

            if (listeningList == null || !listeningList.Any()) return (0, 0);

            int imported = 0;
            int updated = 0;

            foreach (var listening in listeningList)
            {
                // Kiểm tra LessonId có tồn tại trong hệ thống không
                var lessonExists = await _context.Lessons.AnyAsync(l => l.LessonId == listening.LessonId);
                if (!lessonExists) continue;

                // Kiểm tra trùng lặp dựa trên câu hỏi và bài học
                var existingListening = await _context.Listenings
                    .FirstOrDefaultAsync(l => l.Question == listening.Question && l.LessonId == listening.LessonId);

                if (existingListening == null)
                {
                    listening.CreatedAt = DateTime.UtcNow;
                    _context.Listenings.Add(listening);
                    imported++;
                }
                else
                {
                    // Cập nhật thông tin bài nghe
                    existingListening.AudioUrl = listening.AudioUrl ?? existingListening.AudioUrl;
                    existingListening.ImageUrl = listening.ImageUrl ?? existingListening.ImageUrl;
                    existingListening.Transcript = listening.Transcript ?? existingListening.Transcript;
                    existingListening.Question = listening.Question ?? existingListening.Question;
                    
                    // Cập nhật 4 đáp án
                    existingListening.OptionA = listening.OptionA ?? existingListening.OptionA;
                    existingListening.OptionB = listening.OptionB ?? existingListening.OptionB;
                    existingListening.OptionC = listening.OptionC ?? existingListening.OptionC;
                    existingListening.OptionD = listening.OptionD ?? existingListening.OptionD;
                    
                    existingListening.CorrectAnswer = listening.CorrectAnswer ?? existingListening.CorrectAnswer;
                    
                    updated++;
                }
            }

            if (imported > 0 || updated > 0)
            {
                await _context.SaveChangesAsync();
            }
            
            return (imported, updated);
        }
    }
}