using System.Security.Claims;
using System.Text;
using Constants;
using Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.FileProviders;
using Microsoft.IdentityModel.Tokens;
using Models;
using Repositories;
using Services;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "wwwroot"
});

var shouldSeed = args.Contains("--seed", StringComparer.OrdinalIgnoreCase);
//var shouldSeed = true;

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<VocabImportService>();
builder.Services.AddScoped<GrammarImportService>();
builder.Services.AddScoped<KanjiImportService>();
builder.Services.AddScoped<ReadImportService>();
builder.Services.AddScoped<ListenImportService>();
builder.Services.AddScoped<ExamJsonImportService>();
builder.Services.AddScoped<EmailService>();

builder.Services.AddScoped<IProgressRepository, ProgressRepository>();
builder.Services.AddScoped<IExamSessionRepository, ExamSessionRepository>();
builder.Services.AddScoped<IUserProgressRepository, UserProgressRepository>();
builder.Services.AddScoped<ILessonRepository, LessonRepository>();
builder.Services.AddScoped<IBookmarkRepository, BookmarkRepository>();
builder.Services.AddScoped<IExamRepository, ExamRepository>();
builder.Services.AddScoped<IExamQuestionRepository, ExamQuestionRepository>();
builder.Services.AddScoped<IQuestionGroupRepository, QuestionGroupRepository>();
builder.Services.AddScoped<IExamResultRepository, ExamResultRepository>();
builder.Services.AddScoped<IUserExamRepository, UserExamRepository>();
builder.Services.AddScoped<IExamSessionAnswerRepository, ExamSessionAnswerRepository>();

builder.Services.AddScoped<IProgressService, ProgressService>();
builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IRecommendationService, RecommendationService>();

// =====================================================================
// [THÊM MỚI] Đăng ký Gemini AI Service có sử dụng HttpClient
// =====================================================================
builder.Services.AddHttpClient<GeminiRecommendationService>();

builder.Services.AddScoped<IBookmarkService, BookmarkService>();
builder.Services.AddScoped<IExamService, ExamService>();
builder.Services.AddScoped<IExamQuestionService, ExamQuestionService>();
builder.Services.AddScoped<IExamResultService, ExamResultService>();
builder.Services.AddScoped<IExamSessionService, ExamSessionService>();
builder.Services.AddScoped<IUserExamService, UserExamService>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

var jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("Jwt:Key is missing from configuration.");

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.RequireHttpsMetadata = false;
        options.SaveToken = true;

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            RoleClaimType = ClaimTypes.Role
        };

        options.Events = new JwtBearerEvents
        {
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine("Token failed: " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = _ =>
            {
                Console.WriteLine("Token valid");
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                context.HandleResponse();
                context.Response.StatusCode = 401;
                context.Response.ContentType = "application/json";
                return context.Response.WriteAsync("{\"message\":\"Unauthorized\"}");
            }
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:3000", "http://127.0.0.1:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
});

builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 52428800;
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
    {
        Title = "My API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Nhap token theo dinh dang: Bearer {token}"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseStaticFiles();

var webRootPath = app.Environment.WebRootPath
    ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
var uploadsPath = Path.Combine(webRootPath, "uploads");

if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads",
    ServeUnknownFileTypes = false,
    ContentTypeProvider = new Microsoft.AspNetCore.StaticFiles.FileExtensionContentTypeProvider(
        new Dictionary<string, string>
        {
            { ".mp3", "audio/mpeg" },
            { ".wav", "audio/wav" },
            { ".m4a", "audio/mp4" },
            { ".ogg", "audio/ogg" },
            { ".jpg", "image/jpeg" },
            { ".jpeg", "image/jpeg" },
            { ".png", "image/png" },
            { ".webp", "image/webp" },
            { ".gif", "image/gif" }
        })
});

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting();
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    if (shouldSeed)
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var env = scope.ServiceProvider.GetRequiredService<IWebHostEnvironment>();
        var seedWebRootPath = env.WebRootPath ?? Path.Combine(env.ContentRootPath, "wwwroot");

        string[] requiredDirectories =
        [
            Path.Combine(seedWebRootPath, "data", "Listenings"),
            Path.Combine(seedWebRootPath, "uploads", "audio"),
            Path.Combine(seedWebRootPath, "uploads", "images")
        ];

        foreach (var directory in requiredDirectories)
        {
            if (!Directory.Exists(directory))
            {
                Directory.CreateDirectory(directory);
            }
        }

        const int maxRetries = 10;
        for (var attempt = 0; attempt < maxRetries; attempt++)
        {
            try
            {
                context.Database.Migrate();
                Console.WriteLine("Database migration completed.");
                break;
            }
            catch (Exception ex)
            {
                if (attempt == maxRetries - 1)
                {
                    Console.WriteLine($"Database migration failed after {maxRetries} retries: {ex.Message}");
                    throw;
                }

                Console.WriteLine($"Database not ready (attempt {attempt + 1}/{maxRetries}). Retrying in 5 seconds.");
                await Task.Delay(5000);
            }
        }

        var existingLevels = await context.Levels.ToListAsync();
        foreach (var levelName in JlptLevels.SeedOrder)
        {
            if (existingLevels.All(level => level.LevelName != levelName))
            {
                var level = new Level { LevelName = levelName };
                context.Levels.Add(level);
                existingLevels.Add(level);
            }
        }

        await context.SaveChangesAsync();

        var levelsByName = await context.Levels
            .Where(level => JlptLevels.SeedOrder.Contains(level.LevelName))
            .ToDictionaryAsync(level => level.LevelName, level => level);

        // --- BẮT ĐẦU PHẦN ĐÃ SỬA ---
        var lessonSeeds = new[]
        {
            new 
            { 
                LevelName = JlptLevels.N5, 
                SkillConfigs = new[] 
                {
                    new { SkillName = "Từ vựng", Start = 1, End = 25 },
                    new { SkillName = "Ngữ pháp", Start = 1, End = 25 },
                    new { SkillName = "Kanji", Start = 1, End = 24 },
                    new { SkillName = "Đọc hiểu", Start = 1, End = 10 }, 
                    new { SkillName = "Nghe hiểu", Start = 1, End = 15 }  
                }
            },
            new 
            { 
                LevelName = JlptLevels.N4, 
                SkillConfigs = new[] 
                {
                    new { SkillName = "Từ vựng", Start = 26, End = 50 },
                    new { SkillName = "Ngữ pháp", Start = 26, End = 50 },
                    new { SkillName = "Kanji", Start = 1, End = 9 },
                    new { SkillName = "Đọc hiểu", Start = 1, End = 10 }, 
                    new { SkillName = "Nghe hiểu", Start = 1, End = 15 }  
                }
            },
            new 
            { 
                LevelName = JlptLevels.N3, 
                SkillConfigs = new[] 
                {
                    new { SkillName = "Từ vựng", Start = 1, End = 12 },
                    new { SkillName = "Ngữ pháp", Start = 1, End = 11 },
                    new { SkillName = "Kanji", Start = 1, End = 20 },
                    new { SkillName = "Đọc hiểu", Start = 1, End = 10 }, 
                    new { SkillName = "Nghe hiểu", Start = 1, End = 15 }  
                }
            }
        };

        var existingLessonKeys = await context.Lessons
            .Select(lesson => new { lesson.LevelId, lesson.LessonName, lesson.SkillType })
            .ToListAsync();

        foreach (var levelSeed in lessonSeeds)
        {
            var level = levelsByName[levelSeed.LevelName];

            foreach (var skillConfig in levelSeed.SkillConfigs)
            {
                for (var lessonNumber = skillConfig.Start; lessonNumber <= skillConfig.End; lessonNumber++)
                {
                    var lessonName = $"Bài {lessonNumber}";

                    var lessonExists = existingLessonKeys.Any(existing =>
                        existing.LevelId == level.LevelId &&
                        existing.LessonName == lessonName &&
                        existing.SkillType == skillConfig.SkillName);

                    if (lessonExists)
                    {
                        continue;
                    }

                    context.Lessons.Add(new Lesson
                    {
                        LessonName = lessonName,
                        SkillType = skillConfig.SkillName,
                        LevelId = level.LevelId,
                    });

                    existingLessonKeys.Add(new
                    {
                        level.LevelId,
                        LessonName = lessonName,
                        SkillType = skillConfig.SkillName
                    });
                }
            }
        }

        await context.SaveChangesAsync();
        // --- KẾT THÚC PHẦN ĐÃ SỬA ---

        if (!context.Users.Any(u => u.Role == "Admin"))
        {
            var admin = new User
            {
                UserName = "admin",
                Email = "admin@gmail.com",
                PassWord = BCrypt.Net.BCrypt.HashPassword("123456"),
                FullName = "Admin",
                Role = "Admin",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            context.Users.Add(admin);
            context.SaveChanges();
        }

        var vocabImporter = scope.ServiceProvider.GetRequiredService<VocabImportService>();
        try
        {
            await vocabImporter.ImportAllFromFolderAsync();
            Console.WriteLine("Vocab import completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Vocab import failed: " + ex.Message);
        }

        var grammarImporter = scope.ServiceProvider.GetRequiredService<GrammarImportService>();
        try
        {
            await grammarImporter.ImportAllFromFolderAsync();
            Console.WriteLine("Grammar import completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Grammar import failed: " + ex.Message);
        }

        var kanjiImporter = scope.ServiceProvider.GetRequiredService<KanjiImportService>();
        try
        {
            await kanjiImporter.ImportAllFromFolderAsync();
            Console.WriteLine("Kanji import completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Kanji import failed: " + ex.Message);
        }

        var readingImporter = scope.ServiceProvider.GetRequiredService<ReadImportService>();
        try
        {
            await readingImporter.ImportAllFromFolderAsync();
            Console.WriteLine("Reading import completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Reading import failed: " + ex.Message);
        }

        var listeningImporter = scope.ServiceProvider.GetRequiredService<ListenImportService>();
        try
        {
            await listeningImporter.ImportAllFromFolderAsync();
            Console.WriteLine("Listening import completed.");
        }
        catch (Exception ex)
        {
            Console.WriteLine("Listening import failed: " + ex.Message);
        }
    }
}

app.Run();