using Models;

namespace DTOs.Payment
{
    public class PaymentResponseDto
    {
        public int PaymentId { get; set; }
        
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty; 
        
        public int ExamId { get; set; }
        public string ExamTitle { get; set; } = string.Empty; 
        
        public decimal Amount { get; set; }
        public PaymentMethodType PaymentMethod { get; set; }
        public PaymentStatus PaymentStatus { get; set; }
        
        public string? TransactionId { get; set; }
        
        // Lưu ý: Trường GatewayResponse chứa chuỗi JSON nhạy cảm từ VNPay/Momo.
        // Bạn có thể cân nhắc chỉ trả về trường này nếu user đang có Role là Admin.
        public string? GatewayResponse { get; set; }
        
        public DateTime CreatedAt { get; set; }
        public DateTime? PaymentDate { get; set; }
    }
}