using Models;
using System.ComponentModel.DataAnnotations;

namespace DTOs.Payment
{
    public class PaymentCreateDto
    {
        [Required(ErrorMessage = "UserId là bắt buộc")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "ExamId là bắt buộc")]
        public int ExamId { get; set; }

        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Số tiền thanh toán phải lớn hơn 0")]
        public decimal Amount { get; set; }

        [Required]
        public PaymentMethodType PaymentMethod { get; set; }
    }
}