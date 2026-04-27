using Models;
using System.ComponentModel.DataAnnotations;

namespace DTOs.Payment
{
    public class PaymentUpdateDto
    {
        [Required]
        public PaymentStatus PaymentStatus { get; set; }

        [StringLength(255)]
        public string? TransactionId { get; set; }

        public string? GatewayResponse { get; set; }
    }
}