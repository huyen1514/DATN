using System.Text.Json;
using Data; 
using Models;
using Microsoft.EntityFrameworkCore;

namespace Services
{
    public class GrammarImportService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public GrammarImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task ImportAllFromFolderAsync()
        {
            // Trỏ vào folder wwwroot/data/Grammars
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Grammars");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Grammar] Folder không tồn tại: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json");
            Console.WriteLine($"[Grammar] Tìm thấy {files.Length} file JSON.");

            foreach (var file in files)
            {
                try 
                {
                    var (imported, skipped) = await ImportGrammarFromJsonAsync(file);
                    if (imported > 0)
                    {
                        Console.WriteLine($"[Grammar] Đã import {imported} mẫu từ file: {Path.GetFileName(file)}");
                    }
                }
                catch (Exception ex)
                {
                    // Nếu 1 file bị lỗi định dạng JSON, nó sẽ báo lỗi ở đây và tiếp tục file tiếp theo
                    Console.WriteLine($"[Grammar] Lỗi khi xử lý file {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }

        public async Task<(int imported, int skipped)> ImportGrammarFromJsonAsync(string filePath)
        {
            if (!File.Exists(filePath)) return (0, 0);

            var jsonString = await File.ReadAllTextAsync(filePath);
            
            // Cấu hình để chấp nhận các thuộc tính JSON không phân biệt hoa thường
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            var grammarList = JsonSerializer.Deserialize<List<Grammar>>(jsonString, options);

            if (grammarList == null || !grammarList.Any()) return (0, 0);

            var fileName = Path.GetFileNameWithoutExtension(filePath);
            var match = System.Text.RegularExpressions.Regex.Match(fileName, @"\d+");
            int lessonNumber = 0;
            if (match.Success) lessonNumber = int.Parse(match.Value);

            var targetLesson = await _context.Lessons.FirstOrDefaultAsync(l => l.LessonName == $"Bài {lessonNumber}" && l.SkillType == "Ngữ pháp");
            if (targetLesson == null)
            {
                Console.WriteLine($"[Grammar Error] Target lesson not found for file {fileName}. Skipping.");
                return (0, 0);
            }

            int imported = 0;
            int skipped = 0;

            foreach (var grammar in grammarList)
            {
                grammar.LessonId = targetLesson.LessonId;

                var existingGrammar = await _context.Grammars
                    .FirstOrDefaultAsync(g => g.GrammarName == grammar.GrammarName && g.LessonId == grammar.LessonId);

                if (existingGrammar == null)
                {
                    // Gán thời gian tạo nếu model yêu cầu
                    grammar.CreatedAt = DateTime.UtcNow;
                    
                    _context.Grammars.Add(grammar);
                    imported++;
                }
                else
                {
                    // Update instead of skip
                    existingGrammar.Structure = grammar.Structure ?? existingGrammar.Structure;
                    existingGrammar.Meaning = grammar.Meaning ?? existingGrammar.Meaning;
                    existingGrammar.Example = grammar.Example ?? existingGrammar.Example;
                    skipped++;
                }
            }

            if (imported > 0)
            {
                await _context.SaveChangesAsync();
            }
            
            return (imported, skipped);
        }
    }
}