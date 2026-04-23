using System.Net.Mail;
using Microsoft.Extensions.Configuration;

namespace Services
{
    public class EmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            var smtpConfig = _config.GetSection("SmtpSettings");
            string host = smtpConfig["Host"];
            int port = int.Parse(smtpConfig["Port"]);
            string senderEmail = smtpConfig["SenderEmail"];
            string senderName = smtpConfig["SenderName"];

            using var client = new SmtpClient(host, port)
            {
                // Đối với Mailpit, không cần tài khoản mật khẩu
                UseDefaultCredentials = true
            };

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(senderEmail, senderName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };
            
            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
        }
    }
}
