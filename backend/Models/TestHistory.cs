using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("TestHistories")]
    public class TestHistory
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int TestHistoryId { get; set; }

        [Required]
        [ForeignKey(nameof(User))]
        public int UserId { get; set; }

        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; }

        public DateTime Date { get; set; } = DateTime.UtcNow;

        [Required]
        [Column(TypeName = "nvarchar(max)")]
        public string Detail { get; set; } = string.Empty;

        public User? User { get; set; }
    }
}
