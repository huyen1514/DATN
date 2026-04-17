using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Models; 
using Data;

namespace Services // Đảm bảo namespace này khớp với thư mục Services của bạn
{
    public class VocabImportService
    {
        private readonly AppDbContext _context; 
        private readonly IWebHostEnvironment _env;

        public VocabImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Tự động quét và import tất cả file .json trong wwwroot/data
        /// </summary>
        public async Task ImportAllFromFolderAsync()
        {
            // 1. Xác định đường dẫn thư mục wwwroot/data
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Vocabs");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"Directory not found: {folderPath}");
                return;
            }

            // 2. Lấy danh sách tất cả file .json trong thư mục
            var jsonFiles = Directory.GetFiles(folderPath, "*.json");

            if (jsonFiles.Length == 0)
            {
                Console.WriteLine("No .json files found in wwwroot/data.");
                return;
            }

            foreach (var filePath in jsonFiles)
            {
                Console.WriteLine($"Processing file: {Path.GetFileName(filePath)}");
                await ProcessSingleFileAsync(filePath);
            }
        }

        private async Task ProcessSingleFileAsync(string filePath)
        {
            try 
            {
                var jsonData = await File.ReadAllTextAsync(filePath);
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var vocabList = JsonSerializer.Deserialize<List<Vocabulary>>(jsonData, options);

                if (vocabList == null || vocabList.Count == 0) return;

                foreach (var item in vocabList)
                {
                    // 3. KIỂM TRA AN TOÀN: LessonId có tồn tại trong bảng Lessons không?
                    // Tránh lỗi Foreign Key nếu bạn chưa tạo Lesson 5, 6...
                    var lessonExists = await _context.Lessons.AnyAsync(l => l.LessonId == item.LessonId);
                    if (!lessonExists)
                    {
                        Console.WriteLine($"Error: LessonId {item.LessonId} not found in Database. Skipping '{item.Word}'.");
                        continue; 
                    }

                    // 4. KIỂM TRA TRÙNG LẶP: Dựa trên Word và Reading
                    var existingVocab = await _context.Vocabularies
                        .FirstOrDefaultAsync(v => v.Word == item.Word && v.Reading == item.Reading);

                    if (existingVocab == null)
                    {
                        // Thêm mới nếu chưa có
                        _context.Vocabularies.Add(item);
                    }
                    else
                    {
                        // Cập nhật nếu đã có (giữ lại logic của bạn)
                        existingVocab.Meaning = item.Meaning ?? existingVocab.Meaning;
                        existingVocab.Example = item.Example ?? existingVocab.Example;
                        existingVocab.PartOfSpeech = item.PartOfSpeech ?? existingVocab.PartOfSpeech;
                        existingVocab.LessonId = item.LessonId;
                        // Bạn có thể thêm các trường khác nếu cần
                    }
                }

                await _context.SaveChangesAsync();
                Console.WriteLine($"Finished import from: {Path.GetFileName(filePath)}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error processing {Path.GetFileName(filePath)}: {ex.Message}");
            }
        }
    }
}