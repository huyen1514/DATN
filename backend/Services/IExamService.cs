using backend.DTOs.Exam;

namespace Services
{
    public interface IExamService
    {
        Task<(List<ExamResponseDto> Data, int Total)> GetExamsAsync(int? levelId, int page, int pageSize);
        Task<ExamResponseDto?> GetExamByIdAsync(int id);
        Task<bool> UpdateExamAsync(int id, ExamUpdateDto updateData);
        Task<bool> DeleteExamAsync(int id);
        Task<ExamResponseDto?> CreateExamAsync(ExamCreateDto createData);
    }
}
