using System.Text.Json;
using Data; 
using Models;
using Microsoft.EntityFrameworkCore;

namespace Services
{
    public class ReadImportService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public ReadImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Duyệt tất cả file .json trong thư mục wwwroot/data/Readings và import vào DB
        /// </summary>
        public async Task ImportAllFromFolderAsync()
        {
            // Trỏ vào folder wwwroot/data/Readings
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Readings");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Reading] Thư mục không tồn tại: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json");
            Console.WriteLine($"[Reading] Tìm thấy {files.Length} file JSON.");

            foreach (var file in files)
            {
                try 
                {
                    var (imported, updated) = await ImportReadingFromJsonAsync(file);
                    if (imported > 0 || updated > 0)
                    {
                        Console.WriteLine($"[Reading] File: {Path.GetFileName(file)} -> Thêm mới: {imported}, Cập nhật: {updated}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Reading] Lỗi khi xử lý file {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }

        /// <summary>
        /// Đọc nội dung từ một file JSON cụ thể
        /// </summary>
        public async Task<(int imported, int updated)> ImportReadingFromJsonAsync(string filePath)
        {
            if (!File.Exists(filePath)) return (0, 0);

            var jsonString = await File.ReadAllTextAsync(filePath);
            
            // Cấu hình để không phân biệt hoa thường trong key JSON
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            var readingList = JsonSerializer.Deserialize<List<Reading>>(jsonString, options);

            if (readingList == null || !readingList.Any()) return (0, 0);

            int imported = 0;
            int updated = 0;

            foreach (var reading in readingList)
            {
                // Kiểm tra xem bài đọc này đã tồn tại trong Lesson này chưa (dựa trên nội dung)
                var existingReading = await _context.Readings
                    .FirstOrDefaultAsync(r => r.Content == reading.Content && r.LessonId == reading.LessonId);

                if (existingReading == null)
                {
                    // Thiết lập ngày tạo
                    reading.CreatedAt = DateTime.UtcNow;
                    
                    _context.Readings.Add(reading);
                    imported++;
                }
                else
                {
                    // Cập nhật các trường dữ liệu nếu đã tồn tại
                    existingReading.Question = reading.Question ?? existingReading.Question;
                    existingReading.Option1 = reading.Option1 ?? existingReading.Option1;
                    existingReading.Option2 = reading.Option2 ?? existingReading.Option2;
                    existingReading.Option3 = reading.Option3 ?? existingReading.Option3;
                    existingReading.Option4 = reading.Option4 ?? existingReading.Option4;
                    existingReading.CorrectOption = reading.CorrectOption;
                    existingReading.ImageUrl = reading.ImageUrl ?? existingReading.ImageUrl;
                    
                    updated++;
                }
            }

            // Lưu thay đổi sau khi duyệt hết một file
            if (imported > 0 || updated > 0)
            {
                await _context.SaveChangesAsync();
            }
            
            return (imported, updated);
        }
    }
}