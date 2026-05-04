using System.Text;
using System.Text.Json;
using DTOs.Recommendation;

public class GeminiRecommendationService
{
    private readonly string _apiKey;
    private readonly HttpClient _httpClient;

    public GeminiRecommendationService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _apiKey = configuration["Gemini:ApiKey"] ?? throw new ArgumentNullException("Gemini:ApiKey is missing in appsettings.json");
    }

    public async Task<List<RecommendedLessonResponse>> GetAiRecommendations(
        decimal averageScore, string weakSkill, string unseenLessonsJson)
    {
        // Prompt được thiết kế chuyên sâu cho giáo dục
        string prompt = $@"
        Bạn là một chuyên gia giáo dục tiếng Nhật (JLPT). Hãy chọn ra tối đa 3 bài học phù hợp nhất từ danh sách 'Bài học chưa học' để giúp học viên khắc phục điểm yếu.

        [Thông tin học viên]
        - Điểm trung bình hiện tại: {averageScore}/100
        - Kỹ năng cần cải thiện nhất: {weakSkill}

        [Danh sách Bài học chưa học (JSON)]
        {unseenLessonsJson}

        [Yêu cầu Output]
        Trả về kết quả dưới dạng DUY NHẤT một mảng JSON chuẩn.
        Mỗi object trong mảng phải có các trường: LessonId, LessonName, SkillType, LevelName, RecommendationReason.
        Trong đó 'RecommendationReason' là lời khuyên bằng tiếng Việt, xưng 'bạn', giải thích tại sao bài này giúp ích cho kỹ năng {weakSkill}.";

        var payload = new 
        { 
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { responseMimeType = "application/json" }
        };
        
        string url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={_apiKey}";

        var response = await _httpClient.PostAsync(url, new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json"));
        if (!response.IsSuccessStatusCode) return new List<RecommendedLessonResponse>();

        var result = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(result);
        var text = doc.RootElement.GetProperty("candidates")[0].GetProperty("content").GetProperty("parts")[0].GetProperty("text").GetString();

        if (string.IsNullOrWhiteSpace(text)) return new List<RecommendedLessonResponse>();

        return JsonSerializer.Deserialize<List<RecommendedLessonResponse>>(text, new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) 
               ?? new List<RecommendedLessonResponse>();
    }
}