using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using System.Text.Json;
using System.Security.Claims;
using Data;
using Services;
using Models;
using Repositories;

var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    WebRootPath = "wwwroot" // Cấu hình WebRootPath ngay từ đầu
});

// Add DbContext
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection"))
);

builder.Services.AddScoped<JwtService>();

builder.Services.AddScoped<VocabImportService>();
builder.Services.AddScoped<GrammarImportService>();
builder.Services.AddScoped<KanjiImportService>();
builder.Services.AddScoped<ReadImportService>();
builder.Services.AddScoped<ListenImportService>();
builder.Services.AddScoped<ExamPdfImportService>();
builder.Services.AddScoped<EmailService>();

// Register Repositories
builder.Services.AddScoped<IProgressRepository, ProgressRepository>();
builder.Services.AddScoped<IExamSessionRepository, ExamSessionRepository>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpContextAccessor();

// Add Authentication with JWT Bearer
var jwtKey = builder.Configuration["Jwt:Key"];

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
                Console.WriteLine("❌ Token failed: " + context.Exception.Message);
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("✅ Token valid");
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

// Add Authorization (🔑 BẮT BUỘC khi dùng app.UseAuthorization)
builder.Services.AddAuthorization();

// Add CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials()
    );
});

// Add Controllers
builder.Services.AddControllers();

// Add Swagger
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
        Description = "Nhập token theo định dạng: Bearer {token}"
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

// Use static files
app.UseStaticFiles();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Use CORS
app.UseCors("AllowFrontend");

// Middleware pipeline
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    // Retry logic: đợi SQL Server sẵn sàng (đặc biệt quan trọng trong Docker)
    var maxRetries = 10;
    for (int i = 0; i < maxRetries; i++)
    {
        try
        {
            context.Database.Migrate();
            Console.WriteLine("✅ Database migration completed successfully.");
            break;
        }
        catch (Exception ex)
        {
            if (i == maxRetries - 1)
            {
                Console.WriteLine($"❌ Database migration failed after {maxRetries} retries: {ex.Message}");
                throw; // Crash nếu không kết nối được sau tất cả retries
            }
            Console.WriteLine($"⏳ Database not ready (attempt {i + 1}/{maxRetries}), retrying in 5s... ({ex.Message})");
            await Task.Delay(5000);
        }
    }

    // Seed Levels và Lessons nếu chưa có
    if (!context.Levels.Any())
    {
        context.Levels.AddRange(
            new Level { LevelName = "N5" },
            new Level { LevelName = "N4" },
            new Level { LevelName = "N3" }
        );
        context.SaveChanges();
    }

    if (!context.Lessons.Any())
    {
        var levelN5 = context.Levels.FirstOrDefault(l => l.LevelName == "N5");
        var levelN4 = context.Levels.FirstOrDefault(l => l.LevelName == "N4");
        
        string[] skills = { "Từ vựng", "Ngữ pháp", "Nghe hiểu", "Đọc hiểu", "Hán tự" };

        for (int i = 1; i <= 25; i++)
        {
            foreach (var skill in skills)
            {
                context.Lessons.Add(new Lesson { LessonName = $"Bài {i}", SkillType = skill, LevelId = levelN5?.LevelId ?? 1 });
            }
        }
        for (int i = 26; i <= 50; i++)
        {
            foreach (var skill in skills)
            {
                context.Lessons.Add(new Lesson { LessonName = $"Bài {i}", SkillType = skill, LevelId = levelN4?.LevelId ?? 2 });
            }
        }
        context.SaveChanges();
        Console.WriteLine("Seeded Levels and Lessons successfully.");
    }

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

    var importer = scope.ServiceProvider.GetRequiredService<VocabImportService>();
    try 
    {
        // Bạn có thể await vì Program.cs của .NET 8 hỗ trợ Top-level statements
        await importer.ImportAllFromFolderAsync();
        Console.WriteLine("Vocab Import check completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Vocab Import failed: " + ex.Message);
    }

    var grammarImporter = scope.ServiceProvider.GetRequiredService<GrammarImportService>();
    try 
    {
        await grammarImporter.ImportAllFromFolderAsync(); 
        Console.WriteLine("Grammar Import check completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Grammar Import failed: " + ex.Message);
    }

    var kanjiImporter = scope.ServiceProvider.GetRequiredService<KanjiImportService>();
    try 
    {
        await kanjiImporter.ImportAllFromFolderAsync(); 
        Console.WriteLine("Kanji Import check completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Kanji Import failed: " + ex.Message);
    }

    var readImporter = scope.ServiceProvider.GetRequiredService<ReadImportService>();
    try 
    {
        await readImporter.ImportAllFromFolderAsync(); 
        Console.WriteLine("Reading Import check completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Reading Import failed: " + ex.Message);
    }

    var listenImporter = scope.ServiceProvider.GetRequiredService<ListenImportService>();
    try 
    {
        await listenImporter.ImportAllFromFolderAsync(); 
        Console.WriteLine("Listening Import check completed.");
    }
    catch (Exception ex)
    {
        Console.WriteLine("Listening Import failed: " + ex.Message);
    }
}

app.Run();