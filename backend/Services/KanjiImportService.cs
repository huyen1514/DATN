using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Data; // Đảm bảo namespace này khớp với project của bạn
using Models; // Đảm bảo namespace này khớp với project của bạn

namespace Services
{
    public class KanjiImportService
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public KanjiImportService(AppDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        public async Task ImportAllFromFolderAsync()
        {
            // Trỏ vào folder wwwroot/data/Kanjis
            string folderPath = Path.Combine(_env.WebRootPath, "data", "Kanjis");

            if (!Directory.Exists(folderPath))
            {
                Console.WriteLine($"[Kanji] Folder không tồn tại: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json");
            Console.WriteLine($"[Kanji] Tìm thấy {files.Length} file JSON.");

            foreach (var file in files)
            {
                try 
                {
                    var (imported, skipped) = await ImportKanjiFromJsonAsync(file);
                    if (imported > 0 || skipped > 0)
                    {
                        Console.WriteLine($"[Kanji] File: {Path.GetFileName(file)} -> Nhập mới: {imported}, Cập nhật: {skipped}");
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Kanji] Lỗi khi xử lý file {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }

        public async Task<(int imported, int skipped)> ImportKanjiFromJsonAsync(string filePath)
        {
            if (!File.Exists(filePath)) return (0, 0);

            var jsonString = await File.ReadAllTextAsync(filePath);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
            
            var kanjiList = JsonSerializer.Deserialize<List<Kanji>>(jsonString, options);

            if (kanjiList == null || !kanjiList.Any()) return (0, 0);

            // TỐI ƯU HÓA & BẢO VỆ: Lấy danh sách các LessonId hiện đang tồn tại thực tế trong database
            // Điều này ngăn chặn lỗi sập app (Crash) do vi phạm Khóa ngoại (Foreign Key)
            var validLessonIds = await _context.Lessons.Select(l => l.LessonId).ToListAsync();

            int imported = 0;
            int skipped = 0;

            foreach (var kanji in kanjiList)
            {
                // KIỂM TRA AN TOÀN: Nếu LessonId trong file JSON chưa được tạo trong DB, bỏ qua chữ đó
                if (!validLessonIds.Contains(kanji.LessonId))
                {
                    Console.WriteLine($"[Kanji Cảnh báo] Bỏ qua chữ '{kanji.Character}' vì LessonId = {kanji.LessonId} chưa tồn tại trong bảng Lessons.");
                    continue; // Chuyển sang xử lý chữ Kanji tiếp theo
                }

                // Kiểm tra xem chữ Hán này đã tồn tại trong Lesson này chưa
                var existingKanji = await _context.Kanjis
                    .FirstOrDefaultAsync(k => k.Character == kanji.Character && k.LessonId == kanji.LessonId);

                if (existingKanji == null)
                {
                    // Thêm mới nếu chưa có
                    kanji.CreatedAt = DateTime.UtcNow;
                    _context.Kanjis.Add(kanji);
                    imported++;
                }
                else
                {
                    // Cập nhật thông tin nếu đã tồn tại
                    existingKanji.Meaning = kanji.Meaning ?? existingKanji.Meaning;
                    existingKanji.Onyomi = kanji.Onyomi ?? existingKanji.Onyomi;
                    existingKanji.Kunyomi = kanji.Kunyomi ?? existingKanji.Kunyomi;
                    existingKanji.Example = kanji.Example ?? existingKanji.Example;
                    skipped++;
                }
            }

            // Chỉ gọi SaveChanges khi thực sự có dữ liệu hợp lệ cần thêm hoặc cập nhật
            if (imported > 0 || skipped > 0)
            {
                await _context.SaveChangesAsync();
            }
            
            return (imported, skipped);
        }
    }
}