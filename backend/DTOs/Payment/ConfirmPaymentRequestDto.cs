using System.ComponentModel.DataAnnotations;

namespace DTOs.Payment
{
    public class ConfirmPaymentRequestDto
    {
        [Required]
        public int UserId { get; set; }
        
        [Required]
        public int ExamId { get; set; }
        
        [Required]
        public string TransactionRef { get; set; } = string.Empty;

        // Bổ sung thêm trường này để Webhook có thể đẩy thẳng chuỗi JSON kết quả vào DB
        public string? GatewayResponse { get; set; } 
    }
}