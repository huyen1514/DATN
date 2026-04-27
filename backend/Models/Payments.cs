using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    public enum PaymentStatus { Pending, Success, Failed }
    public enum PaymentMethodType { Momo, VNPay, Paypal }

    [Table("Payments")]
    public class Payment
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int PaymentId { get; set; }
        
        [Required]
        [Column(TypeName = "decimal(18,2)")]
        public decimal Amount { get; set; }
        
        [Required]
        public PaymentMethodType PaymentMethod { get; set; }

        [Required]
        public PaymentStatus PaymentStatus { get; set; }

        // [CẬP NHẬT] Giới hạn độ dài để tối ưu database
        [StringLength(255)]
        public string? TransactionId { get; set; }

        // [CẬP NHẬT] Lưu toàn bộ chuỗi JSON trả về từ VNPay/Momo để đối soát khi có lỗi
        [Column(TypeName = "nvarchar(max)")]
        public string? GatewayResponse { get; set; }
        
        [Required]
        [ForeignKey("UserId")]
        public int UserId { get; set; }
        public User User { get; set; } = null!;

        [Required]
        [ForeignKey("ExamId")]
        public int ExamId { get; set; }
        public Exam Exam { get; set; } = null!;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? PaymentDate { get; set; }
    }
}