namespace DTOs
{
    public class RegisterRequest
    {
        public required string UserName { get; set; }
        public required string Email { get; set; }
        public required string PassWord { get; set; }
        public required string FullName { get; set; }
    }
}