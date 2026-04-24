using DTOs.TestHistory;

namespace Services
{
    public interface ITestHistoryService
    {
        Task<TestHistoryResponse> SaveAsync(CreateTestHistoryRequest request);
        Task<List<TestHistoryResponse>> GetByUserAsync(int userId);
    }
}
