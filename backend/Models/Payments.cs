using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum PaymentStatus
    {
        Pending,
        Success,
        Failed
    }
    public enum PaymentMethodType
    {
        Momo,
        VNPay,
        Paypal
    }
    [Table("Payments")]
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }
        
        [Required]
        public decimal Amount { get; set; }
        
        [Required]
        public PaymentMethodType PaymentMethod { get; set; }

        [Required]
        public PaymentStatus PaymentStatus { get; set; }

        public string? TransactionId { get; set; }
        
        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User User { get; set; }

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam Exam { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaymentDate { get; set; }
    }
}