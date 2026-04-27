using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using DTOs.Payment; // Import thư mục DTOs mới

namespace Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PaymentController(AppDbContext context)
        {
            _context = context;
        }

        // 1. Tạo giao dịch (Khi User bấm "Thanh toán")
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PaymentCreateDto dto)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == dto.UserId);
            if (!userExists) return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == dto.ExamId);
            if (!examExists) return BadRequest("Exam không tồn tại");

            var payment = new Payment
            {
                UserId = dto.UserId,
                ExamId = dto.ExamId,
                Amount = dto.Amount,
                PaymentMethod = dto.PaymentMethod,
                PaymentStatus = PaymentStatus.Pending, // Bắt buộc là Pending
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Tạo mã thanh toán thành công", PaymentId = payment.PaymentId });
        }

        // 2. Lấy danh sách giao dịch (Có phân trang và DTO)
        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? userId, 
            [FromQuery] int? examId,
            [FromQuery] int page = 1, 
            [FromQuery] int pageSize = 20)
        {
            var query = _context.Payments.AsNoTracking().AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            var payments = await query
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new PaymentResponseDto
                {
                    PaymentId = x.PaymentId,
                    UserId = x.UserId,
                    UserName = x.User.UserName,
                    ExamId = x.ExamId,
                    ExamTitle = x.Exam.ExamName,
                    Amount = x.Amount,
                    PaymentMethod = x.PaymentMethod,
                    PaymentStatus = x.PaymentStatus,
                    TransactionId = x.TransactionId,
                    GatewayResponse = x.GatewayResponse, // Map thêm trường mới
                    PaymentDate = x.PaymentDate,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            var totalRecords = await query.CountAsync();

            return Ok(new { Data = payments, Total = totalRecords, Page = page, PageSize = pageSize });
        }

        // 3. Lấy chi tiết giao dịch theo ID
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var payment = await _context.Payments
                .AsNoTracking()
                .Where(x => x.PaymentId == id)
                .Select(x => new PaymentResponseDto
                {
                    PaymentId = x.PaymentId,
                    UserId = x.UserId,
                    UserName = x.User.UserName,
                    ExamId = x.ExamId,
                    ExamTitle = x.Exam.ExamName,
                    Amount = x.Amount,
                    PaymentMethod = x.PaymentMethod,
                    PaymentStatus = x.PaymentStatus,
                    TransactionId = x.TransactionId,
                    GatewayResponse = x.GatewayResponse, // Map thêm trường mới
                    PaymentDate = x.PaymentDate,
                    CreatedAt = x.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            return Ok(payment);
        }

        // 4. Cập nhật giao dịch (Dành cho Admin đối soát)
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PaymentUpdateDto dto)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            payment.PaymentStatus = dto.PaymentStatus;
            payment.TransactionId = dto.TransactionId;
            payment.GatewayResponse = dto.GatewayResponse; // Lưu log từ Gateway nếu có

            // Nếu admin update trạng thái thành công, cập nhật ngày thanh toán
            if (dto.PaymentStatus == PaymentStatus.Success && payment.PaymentDate == null)
            {
                payment.PaymentDate = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            return Ok(new { Message = "Cập nhật thanh toán thành công" });
        }

        // 5. Xóa giao dịch
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var rowsAffected = await _context.Payments
                .Where(x => x.PaymentId == id)
                .ExecuteDeleteAsync();

            if (rowsAffected == 0)
                return NotFound("Không tìm thấy thanh toán");

            return Ok(new { Message = "Đã xoá payment" });
        }

        // 6. Webhook / IPN xử lý kết quả trả về từ Gateway
        [HttpPost("confirm-and-unlock")]
        public async Task<IActionResult> ConfirmAndUnlock([FromBody] ConfirmPaymentRequestDto request)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == request.UserId);
            if (!userExists) return BadRequest("User không tồn tại");

            var exam = await _context.Exams.FirstOrDefaultAsync(x => x.ExamId == request.ExamId);
            if (exam == null) return BadRequest("Exam không tồn tại");

            // TÌM GIAO DỊCH PENDING (Thực tế hệ thống nên tìm theo PaymentId được truyền qua TransactionRef)
            // Ở đây tôi viết logic tạo mới theo luồng cũ của bạn, nhưng lưu thêm các trường mới.
            var payment = new Payment
            {
                UserId = request.UserId,
                ExamId = request.ExamId,
                Amount = exam.Price,
                PaymentMethod = PaymentMethodType.VNPay, // Cân nhắc truyền PaymentMethod từ request nếu hỗ trợ cả Momo
                TransactionId = request.TransactionRef,
                GatewayResponse = request.GatewayResponse, // Lưu toàn bộ JSON trả về để dễ debug
                PaymentStatus = PaymentStatus.Success,
                PaymentDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            // Cập nhật UserExam (Mở khóa đề)
            var userExam = await _context.UserExams
                .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.ExamId == request.ExamId);

            if (userExam == null)
            {
                userExam = new UserExam // Dùng Entity số ít như đã thống nhất
                {
                    UserId = request.UserId,
                    ExamId = request.ExamId,
                    PurchaseDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserExams.Add(userExam);
            }
            
            // EF Core tự động gộp 2 lệnh Add (Payment và UserExam) vào 1 transaction
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Thanh toán thành công và đã mở khoá đề thi" });
        }
    }
}