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
        private readonly IConfiguration _configuration;

        public PaymentController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
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

            var payment = new Payment
            {
                UserId = request.UserId,
                ExamId = request.ExamId,
                Amount = exam.Price,
                PaymentMethod = PaymentMethodType.VNPay, 
                TransactionId = request.TransactionRef,
                GatewayResponse = request.GatewayResponse, 
                PaymentStatus = PaymentStatus.Success,
                PaymentDate = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            var userExam = await _context.UserExams
                .FirstOrDefaultAsync(x => x.UserId == request.UserId && x.ExamId == request.ExamId);

            if (userExam == null)
            {
                userExam = new UserExam
                {
                    UserId = request.UserId,
                    ExamId = request.ExamId,
                    PurchaseDate = DateTime.UtcNow,
                    CreatedAt = DateTime.UtcNow
                };
                _context.UserExams.Add(userExam);
            }
            
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Thanh toán thành công và đã mở khoá đề thi" });
        }

        // 7. VNPay: Tạo URL thanh toán
        [HttpPost("create-payment-url")]
        public async Task<IActionResult> CreatePaymentUrl([FromBody] PaymentCreateDto dto)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == dto.UserId);
            if (!userExists) return BadRequest("User không tồn tại");

            var exam = await _context.Exams.FirstOrDefaultAsync(x => x.ExamId == dto.ExamId);
            if (exam == null) return BadRequest("Exam không tồn tại");

            var payment = new Payment
            {
                UserId = dto.UserId,
                ExamId = dto.ExamId,
                Amount = exam.Price,
                PaymentMethod = PaymentMethodType.VNPay,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            string vnp_Returnurl = _configuration["VNPay:ReturnUrl"]!;
            string vnp_Url = _configuration["VNPay:BaseUrl"]!;
            string vnp_TmnCode = _configuration["VNPay:TmnCode"]!;
            string vnp_HashSecret = _configuration["VNPay:HashSecret"]!;

            var vnpay = new Services.VnPayLibrary();
            vnpay.AddRequestData("vnp_Version", _configuration["VNPay:Version"]!);
            vnpay.AddRequestData("vnp_Command", _configuration["VNPay:Command"]!);
            vnpay.AddRequestData("vnp_TmnCode", vnp_TmnCode);
            vnpay.AddRequestData("vnp_Amount", (exam.Price * 100).ToString("0")); 
            
            vnpay.AddRequestData("vnp_CreateDate", payment.CreatedAt.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", _configuration["VNPay:CurrCode"]!);
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
            vnpay.AddRequestData("vnp_IpAddr", ipAddress);
            vnpay.AddRequestData("vnp_Locale", _configuration["VNPay:Locale"]!);

            vnpay.AddRequestData("vnp_OrderInfo", $"Thanh toan de thi {exam.ExamId} - KH {dto.UserId}");
            vnpay.AddRequestData("vnp_OrderType", "other");
            vnpay.AddRequestData("vnp_ReturnUrl", vnp_Returnurl);
            vnpay.AddRequestData("vnp_TxnRef", payment.PaymentId.ToString());

            string paymentUrl = vnpay.CreateRequestUrl(vnp_Url, vnp_HashSecret);

            return Ok(new { PaymentUrl = paymentUrl });
        }

        // 8. VNPay: Return URL (Nhận kết quả và chuyển hướng Frontend)
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnpayReturn()
        {
            var vnpayData = Request.Query;
            var vnpay = new Services.VnPayLibrary();

            foreach (var s in vnpayData)
            {
                if (!string.IsNullOrEmpty(s.Key) && s.Key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(s.Key, s.Value);
                }
            }

            if (!long.TryParse(vnpay.GetResponseData("vnp_TxnRef"), out var vnp_TxnRef))
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&error=invalid_txnref");
            }

            var vnp_SecureHash = Request.Query["vnp_SecureHash"].ToString();
            var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
            var vnp_TransactionStatus = vnpay.GetResponseData("vnp_TransactionStatus");
            var vnp_HashSecret = _configuration["VNPay:HashSecret"]!;

            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, vnp_HashSecret);

            if (checkSignature)
            {
                var payment = await _context.Payments.FirstOrDefaultAsync(x => x.PaymentId == vnp_TxnRef);
                if (payment != null && payment.PaymentStatus == PaymentStatus.Pending)
                {
                    if (vnp_ResponseCode == "00" && vnp_TransactionStatus == "00")
                    {
                        payment.PaymentStatus = PaymentStatus.Success;
                        payment.TransactionId = vnpay.GetResponseData("vnp_TransactionNo");
                        payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(vnpayData);
                        payment.PaymentDate = DateTime.UtcNow;

                        var userExam = await _context.UserExams
                            .FirstOrDefaultAsync(x => x.UserId == payment.UserId && x.ExamId == payment.ExamId);
                        if (userExam == null)
                        {
                            userExam = new UserExam
                            {
                                UserId = payment.UserId,
                                ExamId = payment.ExamId,
                                PurchaseDate = DateTime.UtcNow,
                                CreatedAt = DateTime.UtcNow
                            };
                            _context.UserExams.Add(userExam);
                        }
                    }
                    else
                    {
                        payment.PaymentStatus = PaymentStatus.Failed;
                        payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(vnpayData);
                    }

                    await _context.SaveChangesAsync();
                }
                
                if (vnp_ResponseCode == "00" && vnp_TransactionStatus == "00")
                {
                    return Redirect($"http://localhost:3000/checkout/vnpay-return?success=true&examId={payment?.ExamId}");
                }
                else
                {
                    return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&examId={payment?.ExamId}");
                }
            }
            else
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&error=invalid_signature");
            }
        }

        // 9. VNPay: IPN (Webhook Server-to-Server)
        [HttpGet("vnpay-ipn")]
        public async Task<IActionResult> VnpayIpn()
        {
            var vnpayData = Request.Query;
            var vnpay = new Services.VnPayLibrary();

            foreach (var s in vnpayData)
            {
                if (!string.IsNullOrEmpty(s.Key) && s.Key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(s.Key, s.Value);
                }
            }

            if (!long.TryParse(vnpay.GetResponseData("vnp_TxnRef"), out var vnp_TxnRef))
            {
                return Ok(new { RspCode = "99", Message = "Invalid TxnRef" });
            }

            var vnp_SecureHash = Request.Query["vnp_SecureHash"].ToString();
            var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");
            var vnp_TransactionStatus = vnpay.GetResponseData("vnp_TransactionStatus");
            var vnp_HashSecret = _configuration["VNPay:HashSecret"]!;

            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, vnp_HashSecret);

            if (checkSignature)
            {
                var payment = await _context.Payments.FirstOrDefaultAsync(x => x.PaymentId == vnp_TxnRef);
                if (payment != null)
                {
                    if (payment.PaymentStatus == PaymentStatus.Pending)
                    {
                        if (vnp_ResponseCode == "00" && vnp_TransactionStatus == "00")
                        {
                            payment.PaymentStatus = PaymentStatus.Success;
                            payment.TransactionId = vnpay.GetResponseData("vnp_TransactionNo");
                            payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(vnpayData);
                            payment.PaymentDate = DateTime.UtcNow;

                            var userExam = await _context.UserExams
                                .FirstOrDefaultAsync(x => x.UserId == payment.UserId && x.ExamId == payment.ExamId);
                            if (userExam == null)
                            {
                                userExam = new UserExam
                                {
                                    UserId = payment.UserId,
                                    ExamId = payment.ExamId,
                                    PurchaseDate = DateTime.UtcNow,
                                    CreatedAt = DateTime.UtcNow
                                };
                                _context.UserExams.Add(userExam);
                            }
                        }
                        else
                        {
                            payment.PaymentStatus = PaymentStatus.Failed;
                            payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(vnpayData);
                        }

                        await _context.SaveChangesAsync();
                        return Ok(new { RspCode = "00", Message = "Confirm Success" });
                    }
                    else
                    {
                        return Ok(new { RspCode = "02", Message = "Order already confirmed" });
                    }
                }
                else
                {
                    return Ok(new { RspCode = "01", Message = "Order not found" });
                }
            }
            else
            {
                return Ok(new { RspCode = "97", Message = "Invalid signature" });
            }
        }

        // 10. Momo: Tạo URL thanh toán
        [HttpPost("create-momo-url")]
        public async Task<IActionResult> CreateMomoUrl([FromBody] PaymentCreateDto dto)
        {
            var userExists = await _context.Users.AnyAsync(x => x.UserId == dto.UserId);
            if (!userExists) return BadRequest("User không tồn tại");

            var exam = await _context.Exams.FirstOrDefaultAsync(x => x.ExamId == dto.ExamId);
            if (exam == null) return BadRequest("Exam không tồn tại");

            var payment = new Payment
            {
                UserId = dto.UserId,
                ExamId = dto.ExamId,
                Amount = exam.Price,
                PaymentMethod = PaymentMethodType.Momo,
                PaymentStatus = PaymentStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            string endpoint = _configuration["Momo:Endpoint"]!;
            string partnerCode = _configuration["Momo:PartnerCode"]!;
            string accessKey = _configuration["Momo:AccessKey"]!;
            string secretKey = _configuration["Momo:SecretKey"]!;
            string returnUrl = _configuration["Momo:ReturnUrl"]!;
            string ipnUrl = _configuration["Momo:IpnUrl"]!;
            string requestType = "captureWallet";

            string orderId = payment.PaymentId.ToString() + "_" + DateTime.UtcNow.Ticks.ToString();
            string requestId = Guid.NewGuid().ToString();
            string orderInfo = $"Thanh toan de thi {exam.ExamId} - KH {dto.UserId}";
            string amount = exam.Price.ToString("0");
            string extraData = payment.PaymentId.ToString(); 

            string rawHash = "accessKey=" + accessKey +
                             "&amount=" + amount +
                             "&extraData=" + extraData +
                             "&ipnUrl=" + ipnUrl +
                             "&orderId=" + orderId +
                             "&orderInfo=" + orderInfo +
                             "&partnerCode=" + partnerCode +
                             "&redirectUrl=" + returnUrl +
                             "&requestId=" + requestId +
                             "&requestType=" + requestType;

            string signature = Services.MomoLibrary.ComputeHmacSha256(rawHash, secretKey);

            var momoRequest = new MomoCreatePaymentRequest
            {
                partnerCode = partnerCode,
                partnerName = "Test",
                storeId = "MomoTestStore",
                requestId = requestId,
                amount = (long)exam.Price,
                orderId = orderId,
                orderInfo = orderInfo,
                redirectUrl = returnUrl,
                ipnUrl = ipnUrl,
                lang = "vi",
                extraData = extraData,
                requestType = requestType,
                signature = signature
            };

            using var client = new HttpClient();
            var response = await client.PostAsJsonAsync(endpoint, momoRequest);
            var result = await response.Content.ReadFromJsonAsync<MomoCreatePaymentResponse>();

            if (result != null && !string.IsNullOrEmpty(result.payUrl))
            {
                return Ok(new { PaymentUrl = result.payUrl });
            }

            return BadRequest("Lỗi khi kết nối đến Momo");
        }

        // 11. Momo: Return URL
        [HttpGet("momo-return")]
        public async Task<IActionResult> MomoReturn([FromQuery] MomoResultRequest request)
        {
            string accessKey = _configuration["Momo:AccessKey"]!;
            string secretKey = _configuration["Momo:SecretKey"]!;

            string rawHash = "accessKey=" + accessKey +
                             "&amount=" + request.amount +
                             "&extraData=" + request.extraData +
                             "&message=" + request.message +
                             "&orderId=" + request.orderId +
                             "&orderInfo=" + request.orderInfo +
                             "&orderType=" + request.orderType +
                             "&partnerCode=" + request.partnerCode +
                             "&payType=" + request.payType +
                             "&requestId=" + request.requestId +
                             "&responseTime=" + request.responseTime +
                             "&resultCode=" + request.resultCode +
                             "&transId=" + request.transId;

            string signature = Services.MomoLibrary.ComputeHmacSha256(rawHash, secretKey);

            if (signature != request.signature)
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&error=invalid_signature");
            }

            if (!int.TryParse(request.extraData, out var paymentId))
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&error=invalid_payment");
            }

            var payment = await _context.Payments.FirstOrDefaultAsync(x => x.PaymentId == paymentId);
            if (payment != null && payment.PaymentStatus == PaymentStatus.Pending)
            {
                if (request.resultCode == 0)
                {
                    payment.PaymentStatus = PaymentStatus.Success;
                    payment.TransactionId = request.transId.ToString();
                    payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(request);
                    payment.PaymentDate = DateTime.UtcNow;

                    var userExam = await _context.UserExams
                        .FirstOrDefaultAsync(x => x.UserId == payment.UserId && x.ExamId == payment.ExamId);
                    if (userExam == null)
                    {
                        userExam = new UserExam
                        {
                            UserId = payment.UserId,
                            ExamId = payment.ExamId,
                            PurchaseDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.UserExams.Add(userExam);
                    }
                }
                else
                {
                    payment.PaymentStatus = PaymentStatus.Failed;
                    payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(request);
                }

                await _context.SaveChangesAsync();
            }

            if (request.resultCode == 0)
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=true&examId={payment?.ExamId}");
            }
            else
            {
                return Redirect($"http://localhost:3000/checkout/vnpay-return?success=false&examId={payment?.ExamId}");
            }
        }

        // 12. Momo: IPN
        [HttpPost("momo-ipn")]
        public async Task<IActionResult> MomoIpn([FromBody] MomoResultRequest request)
        {
            string accessKey = _configuration["Momo:AccessKey"]!;
            string secretKey = _configuration["Momo:SecretKey"]!;

            string rawHash = "accessKey=" + accessKey +
                             "&amount=" + request.amount +
                             "&extraData=" + request.extraData +
                             "&message=" + request.message +
                             "&orderId=" + request.orderId +
                             "&orderInfo=" + request.orderInfo +
                             "&orderType=" + request.orderType +
                             "&partnerCode=" + request.partnerCode +
                             "&payType=" + request.payType +
                             "&requestId=" + request.requestId +
                             "&responseTime=" + request.responseTime +
                             "&resultCode=" + request.resultCode +
                             "&transId=" + request.transId;

            string signature = Services.MomoLibrary.ComputeHmacSha256(rawHash, secretKey);

            if (signature != request.signature)
            {
                return BadRequest(new { message = "Invalid signature" });
            }

            if (!int.TryParse(request.extraData, out var paymentId))
            {
                return BadRequest(new { message = "Invalid payment" });
            }

            var payment = await _context.Payments.FirstOrDefaultAsync(x => x.PaymentId == paymentId);
            if (payment != null && payment.PaymentStatus == PaymentStatus.Pending)
            {
                if (request.resultCode == 0)
                {
                    payment.PaymentStatus = PaymentStatus.Success;
                    payment.TransactionId = request.transId.ToString();
                    payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(request);
                    payment.PaymentDate = DateTime.UtcNow;

                    var userExam = await _context.UserExams
                        .FirstOrDefaultAsync(x => x.UserId == payment.UserId && x.ExamId == payment.ExamId);
                    if (userExam == null)
                    {
                        userExam = new UserExam
                        {
                            UserId = payment.UserId,
                            ExamId = payment.ExamId,
                            PurchaseDate = DateTime.UtcNow,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.UserExams.Add(userExam);
                    }
                }
                else
                {
                    payment.PaymentStatus = PaymentStatus.Failed;
                    payment.GatewayResponse = System.Text.Json.JsonSerializer.Serialize(request);
                }

                await _context.SaveChangesAsync();
            }

            return NoContent();
        }
    }
}