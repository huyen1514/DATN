using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Models;
using Data;
using DTOs.Reading;

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

        public async Task ImportAllFromFolderAsync()
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var folderPath = Path.Combine(webRoot, "data", "Readings"); 
            
            if (!Directory.Exists(folderPath)) 
            {
                Console.WriteLine($"Không tìm thấy thư mục: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json", SearchOption.AllDirectories);
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var file in files)
            {
                try
                {
                    var json = await File.ReadAllTextAsync(file);
                    var dtos = JsonSerializer.Deserialize<List<ReadingImportDto>>(json, options);

                    if (dtos == null) continue;

                    // Chuẩn bị sẵn dữ liệu fallback từ tên file (Chỉ xử lý chuỗi, chưa gọi DB)
                    var fileNameWithoutExt = Path.GetFileNameWithoutExtension(file).ToLower();
                    var parts = fileNameWithoutExt.Split('_');
                    
                    string targetLevelName = "N5"; 
                    string targetLessonName = fileNameWithoutExt;

                    if (parts.Length >= 2 && parts[0] == "read" && int.TryParse(parts[1], out int lessonNum))
                    {
                        targetLessonName = $"Bài {lessonNum}"; 
                        if (parts.Length >= 3)
                        {
                            if (parts[2] == "n4") targetLevelName = "N4";
                            else if (parts[2] == "n3") targetLevelName = "N3";
                        }
                    }

                    foreach (var dto in dtos)
                    {
                        Lesson? lesson = null;

                        // --- CÁCH 1: Tìm bằng LessonId từ file JSON ---
                        if (dto.LessonId > 0)
                        {
                            lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.LessonId == dto.LessonId);
                        }
                        
                        // --- CÁCH 2: CHỈ DÙNG KHI CÁCH 1 THẤT BẠI ---
                        // (Tức là trong JSON không có ID, hoặc ID truyền vào không tồn tại trong DB hiện tại)
                        if (lesson == null)
                        {
                            lesson = await _context.Lessons
                                .Include(l => l.Level)
                                .FirstOrDefaultAsync(l => 
                                    l.Level.LevelName == targetLevelName && 
                                    l.LessonName == targetLessonName && 
                                    l.SkillType == "Đọc hiểu");
                        }

                        // Nếu cả 2 cách đều không tìm thấy bài học tương ứng thì bỏ qua
                        if (lesson == null) 
                        {
                            Console.WriteLine($"Bỏ qua: Không tìm thấy Lesson cho file '{Path.GetFileName(file)}'. ID trong JSON: {dto.LessonId} - Fallback dự kiến: {targetLevelName} - {targetLessonName}.");
                            continue;
                        }

                        // Tránh import trùng lặp đoạn văn
                        var exists = await _context.ReadingPassages
                            .AnyAsync(p => p.LessonId == lesson.LessonId && p.Content == dto.Content);

                        if (!exists)
                        {
                            var passage = new ReadingPassage
                            {
                                LessonId = lesson.LessonId,
                                Content = dto.Content,
                                ImageUrl = dto.ImageUrl,
                                CreatedAt = DateTime.UtcNow,
                                
                                ReadingQuestions = dto.Questions.Select(q => new ReadingQuestion
                                {
                                    QuestionText = q.QuestionText,
                                    Option1 = q.Option1,
                                    Option2 = q.Option2,
                                    Option3 = q.Option3,
                                    Option4 = q.Option4,
                                    CorrectOption = q.CorrectOption,
                                    CreatedAt = DateTime.UtcNow
                                }).ToList()
                            };

                            _context.ReadingPassages.Add(passage);
                        }
                    }
                    
                    await _context.SaveChangesAsync();
                    Console.WriteLine($"Đã import thành công file: {Path.GetFileName(file)}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Lỗi khi import file {Path.GetFileName(file)}: {ex.Message}");
                }
            }
        }
    }
}