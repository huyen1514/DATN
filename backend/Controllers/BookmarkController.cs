using DTOs.Bookmark;
using Microsoft.AspNetCore.Mvc;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/bookmark")]
    public class BookmarkController : ControllerBase
    {
        private readonly IBookmarkService _bookmarkService;

        public BookmarkController(IBookmarkService bookmarkService)
        {
            _bookmarkService = bookmarkService;
        }

        [HttpPost]
        public async Task<IActionResult> Toggle([FromBody] CreateBookmarkRequest request)
        {
            try
            {
                // Hàm Toggle sẽ xử lý cả 2 việc: Lưu nếu chưa có, Xóa nếu đã có
                var isAdded = await _bookmarkService.ToggleAsync(request);
                return Ok(new { 
                    isAdded = isAdded, 
                    message = isAdded ? "Đã thêm vào danh sách yêu thích" : "Đã bỏ khỏi danh sách yêu thích" 
                });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        // Dùng [FromQuery] để chuẩn HTTP request và tránh lỗi khi gọi API bằng thư viện Next.js
        [HttpDelete]
        public async Task<IActionResult> Delete([FromQuery] DeleteBookmarkRequest request)
        {
            try
            {
                await _bookmarkService.DeleteAsync(request);
                return Ok(new { message = "Bookmark deleted successfully." });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpGet("{userId:int}")]
        public async Task<IActionResult> GetByUser(int userId)
        {
            try
            {
                var result = await _bookmarkService.GetByUserAsync(userId);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ex.Message);
            }
        }
    }
}