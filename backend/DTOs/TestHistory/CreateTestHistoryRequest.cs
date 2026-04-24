using System.ComponentModel.DataAnnotations;

namespace DTOs.TestHistory
{
    public class CreateTestHistoryRequest
    {
        [Required]
        public int UserId { get; set; }

        [Range(0, 100)]
        public decimal Score { get; set; }

        [Required]
        public string Detail { get; set; } = string.Empty;
    }
}
