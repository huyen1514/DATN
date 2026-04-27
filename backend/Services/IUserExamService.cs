using DTOs;

namespace Services
{
    public interface IUserExamService
    {
        Task<(bool Success, string Message, UserExamResponseDto? Data)> CreateAsync(UserExamCreateDto dto);
        Task<(List<UserExamResponseDto> Data, int Total)> GetAllAsync(int? userId, int? examId, int page, int pageSize);
        Task<UserExamResponseDto?> GetByIdAsync(int id);
        Task<(bool Success, string Message, UserExamResponseDto? Data)> UpdateAsync(int id, UserExamUpdateDto dto);
        Task<(bool Success, string Message)> DeleteAsync(int id);
    }
}
