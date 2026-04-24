namespace DTOs.TestHistory
{
    public class TestHistoryResponse
    {
        public int TestHistoryId { get; set; }
        public int UserId { get; set; }
        public decimal Score { get; set; }
        public DateTime Date { get; set; }
        public string Detail { get; set; } = string.Empty;
    }
}
