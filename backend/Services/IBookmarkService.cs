using DTOs.Bookmark;

namespace Services
{
    public interface IBookmarkService
    {
        Task<bool> ToggleAsync(CreateBookmarkRequest request); // Trả về trạng thái đã Lưu hay Bỏ lưu
        Task DeleteAsync(DeleteBookmarkRequest request);
        Task<List<BookmarkResponse>> GetByUserAsync(int userId);
    }
}
