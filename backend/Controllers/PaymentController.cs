using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;

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

        [HttpPost]
        public async Task<IActionResult> Create(Payment model)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Payments.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? userId, [FromQuery] int? examId)
        {
            var query = _context.Payments
                .Include(x => x.User)
                .Include(x => x.Exam)
                .AsQueryable();

            if (userId.HasValue)
                query = query.Where(x => x.UserId == userId.Value);

            if (examId.HasValue)
                query = query.Where(x => x.ExamId == examId.Value);

            var payments = await query
                .OrderByDescending(x => x.CreatedAt)
                .ToListAsync();

            return Ok(payments);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var payment = await _context.Payments
                .Include(x => x.User)
                .Include(x => x.Exam)
                .FirstOrDefaultAsync(x => x.PaymentId == id);

            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            return Ok(payment);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Payment model)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            var userExists = await _context.Users.AnyAsync(x => x.UserId == model.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var examExists = await _context.Exams.AnyAsync(x => x.ExamId == model.ExamId);
            if (!examExists)
                return BadRequest("Exam không tồn tại");

            payment.Amount = model.Amount;
            payment.PaymentMethod = model.PaymentMethod;
            payment.PaymentStatus = model.PaymentStatus;
            payment.TransactionId = model.TransactionId;
            payment.UserId = model.UserId;
            payment.ExamId = model.ExamId;
            payment.PaymentDate = model.PaymentDate;

            await _context.SaveChangesAsync();
            return Ok(payment);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var payment = await _context.Payments.FindAsync(id);
            if (payment == null)
                return NotFound("Không tìm thấy thanh toán");

            _context.Payments.Remove(payment);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá payment");
        }

        [HttpPost("confirm-and-unlock")]
        public async Task<IActionResult> ConfirmAndUnlock([FromBody] ConfirmPaymentRequest request)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == request.UserId);
            if (!userExists)
                return BadRequest("User không tồn tại");

            var exam = await _context.Exams.FirstOrDefaultAsync(x => x.ExamId == request.ExamId);
            if (exam == null)
                return BadRequest("Exam không tồn tại");

            // Tạo payment record với trạng thái Success
            var payment = new Payment
            {
                UserId = request.UserId,
                ExamId = request.ExamId,
                Amount = exam.Price,
                PaymentMethod = PaymentMethodType.VNPay,
                TransactionId = request.TransactionRef,
                PaymentStatus = PaymentStatus.Success,
                PaymentDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            // Cập nhật UserExams (Mở khóa đề)
            var userExam = await _context.UserExams
                .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.ExamId == request.ExamId);

            if (userExam == null)
            {
                userExam = new UserExams
                {
                    UserId = request.UserId,
                    ExamId = request.ExamId,
                    PurchaseDate = DateTime.UtcNow
                };
                _context.UserExams.Add(userExam);
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Thanh toán thành công và đã mở khoá đề thi" });
        }
    }

    public class ConfirmPaymentRequest
    {
        public int UserId { get; set; }
        public int ExamId { get; set; }
        public string TransactionRef { get; set; } = string.Empty;
    }
}
