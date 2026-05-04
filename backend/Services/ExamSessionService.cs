using Data;
using Microsoft.EntityFrameworkCore;
using Models;
using backend.DTOs.Exam;

namespace Services
{
    public class ExamSessionService : IExamSessionService
    {
        private readonly AppDbContext _context;

        public ExamSessionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, SessionResponseDto? Data, int StatusCode)> StartSessionAsync(StartSessionRequest request, int userId, bool isAdmin = false)
        {
            var exam = await _context.Exams.FindAsync(request.ExamId);
            if (exam == null || !exam.IsActive) 
                return (false, "Đề thi không tồn tại hoặc đã bị ẩn", null, 404);

            if (!isAdmin)
            {
                var hasAccess = await _context.UserExams
                    .AnyAsync(ue => ue.UserId == userId && ue.ExamId == request.ExamId);
                
                if (!hasAccess) 
                    return (false, "Bạn chưa thanh toán/mở khóa đề thi này", null, 403);
            }

            var session = new ExamSession {
                UserId = userId,
                ExamId = request.ExamId,
                StartTime = DateTime.UtcNow,
                Status = SessionStatus.InProgress,
                TimeRemainingSeconds = exam.Duration * 60
            };

            _context.ExamSessions.Add(session);
            await _context.SaveChangesAsync();

            var dto = new SessionResponseDto {
                SessionId = session.SessionId,
                ExamId = session.ExamId,
                StartTime = session.StartTime,
                TimeRemainingSeconds = session.TimeRemainingSeconds
            };

            return (true, "Thành công", dto, 200);
        }

        public async Task<(bool Success, string Message)> AutoSaveAnswerAsync(SubmitAnswerRequest request, int userId)
        {
            var session = await _context.ExamSessions.FindAsync(request.SessionId);
            
            if (session == null || session.UserId != userId || session.Status != SessionStatus.InProgress) 
                return (false, "Phiên làm bài không hợp lệ hoặc đã kết thúc");

            var answer = await _context.ExamSessionAnswers
                .FirstOrDefaultAsync(a => a.SessionId == request.SessionId && a.QuestionId == request.QuestionId);

            if (answer != null) {
                answer.SelectedOption = request.SelectedOption; 
            } else {
                _context.ExamSessionAnswers.Add(new ExamSessionAnswer {
                    SessionId = request.SessionId,
                    QuestionId = request.QuestionId,
                    SelectedOption = request.SelectedOption
                });
            }

            await _context.SaveChangesAsync();
            return (true, "Đã lưu đáp án");
        }
    }
}
