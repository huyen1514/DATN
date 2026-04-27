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
            // Trỏ thẳng vào wwwroot/data/Readings
            var webRoot = _env.WebRootPath ?? Path.Combine(_env.ContentRootPath, "wwwroot");
            var folderPath = Path.Combine(webRoot, "data", "Readings"); 
            
            if (!Directory.Exists(folderPath)) 
            {
                Console.WriteLine($"Không tìm thấy thư mục: {folderPath}");
                return;
            }

            var files = Directory.GetFiles(folderPath, "*.json");
            var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

            foreach (var file in files)
            {
                try
                {
                    var json = await File.ReadAllTextAsync(file);
                    
                    var dtos = JsonSerializer.Deserialize<List<ReadingImportDto>>(json, options);

                    if (dtos == null) continue;

                    foreach (var dto in dtos)
                    {
                        Lesson? lesson = null;
                        if (dto.LessonId > 0)
                        {
                            lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.LessonId == dto.LessonId);
                        }
                        
                        // Fallback: Nếu không tìm thấy bằng LessonId (do ID có thể khác biệt giữa JSON và DB thực tế), tìm theo Tên
                        if (lesson == null && !string.IsNullOrEmpty(dto.LessonName))
                        {
                            lesson = await _context.Lessons.FirstOrDefaultAsync(l => l.LessonName == dto.LessonName && l.SkillType == "Đọc hiểu");
                        }

                        if (lesson == null) 
                        {
                            Console.WriteLine($"Bỏ qua: Không tìm thấy Lesson ID '{dto.LessonId}' (Tên: {dto.LessonName}).");
                            continue;
                        }

                        // 2. Tránh import trùng lặp đoạn văn
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