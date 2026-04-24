using System.Text.Json;
using DTOs.TestHistory;
using Models;
using Repositories;

namespace Services
{
    public class TestHistoryService : ITestHistoryService
    {
        private readonly ITestHistoryRepository _testHistoryRepository;

        public TestHistoryService(ITestHistoryRepository testHistoryRepository)
        {
            _testHistoryRepository = testHistoryRepository;
        }

        public async Task<TestHistoryResponse> SaveAsync(CreateTestHistoryRequest request)
        {
            if (!await _testHistoryRepository.UserExistsAsync(request.UserId))
            {
                throw new KeyNotFoundException("User was not found.");
            }

            ValidateJson(request.Detail);

            var testHistory = new TestHistory
            {
                UserId = request.UserId,
                Score = request.Score,
                Date = DateTime.UtcNow,
                Detail = request.Detail
            };

            await _testHistoryRepository.AddAsync(testHistory);

            return MapToResponse(testHistory);
        }

        public async Task<List<TestHistoryResponse>> GetByUserAsync(int userId)
        {
            if (!await _testHistoryRepository.UserExistsAsync(userId))
            {
                throw new KeyNotFoundException("User was not found.");
            }

            var histories = await _testHistoryRepository.GetByUserIdAsync(userId);
            return histories.Select(MapToResponse).ToList();
        }

        private static void ValidateJson(string detail)
        {
            try
            {
                using var _ = JsonDocument.Parse(detail);
            }
            catch (JsonException)
            {
                throw new ArgumentException("Detail must be a valid JSON string.");
            }
        }

        private static TestHistoryResponse MapToResponse(TestHistory testHistory)
        {
            return new TestHistoryResponse
            {
                TestHistoryId = testHistory.TestHistoryId,
                UserId = testHistory.UserId,
                Score = testHistory.Score,
                Date = testHistory.Date,
                Detail = testHistory.Detail
            };
        }
    }
}
