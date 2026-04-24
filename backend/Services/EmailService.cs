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
            var host = smtpConfig["Host"]
                ?? throw new InvalidOperationException("SmtpSettings:Host is missing.");
            var portValue = smtpConfig["Port"]
                ?? throw new InvalidOperationException("SmtpSettings:Port is missing.");
            if (!int.TryParse(portValue, out var port))
                throw new InvalidOperationException("SmtpSettings:Port is invalid.");

            var senderEmail = smtpConfig["SenderEmail"]
                ?? throw new InvalidOperationException("SmtpSettings:SenderEmail is missing.");
            var senderName = smtpConfig["SenderName"]
                ?? throw new InvalidOperationException("SmtpSettings:SenderName is missing.");

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
