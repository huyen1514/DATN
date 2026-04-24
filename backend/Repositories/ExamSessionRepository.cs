using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Data;
using Microsoft.EntityFrameworkCore;
using Models;

namespace Repositories
{
    public class ExamSessionRepository : IExamSessionRepository
    {
        private readonly AppDbContext _context;

        public ExamSessionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<ExamSession> StartSessionAsync(int userId, int examId, int durationSeconds)
        {
            var session = new ExamSession
            {
                UserId = userId,
                ExamId = examId,
                StartTime = DateTime.UtcNow,
                Status = "InProgress",
                TimeRemainingSeconds = durationSeconds
            };

            _context.ExamSessions.Add(session);
            await _context.SaveChangesAsync();
            return session;
        }

        public async Task<ExamSession?> GetSessionAsync(int sessionId)
        {
            return await _context.ExamSessions.FindAsync(sessionId);
        }

        public async Task<ExamSessionAnswer> SaveAnswerAsync(int sessionId, int questionId, string selectedOption)
        {
            var answer = await _context.ExamSessionAnswers
                .FirstOrDefaultAsync(a => a.SessionId == sessionId && a.QuestionId == questionId);

            if (answer == null)
            {
                answer = new ExamSessionAnswer
                {
                    SessionId = sessionId,
                    QuestionId = questionId,
                    SelectedOption = selectedOption
                };
                _context.ExamSessionAnswers.Add(answer);
            }
            else
            {
                answer.SelectedOption = selectedOption;
            }

            await _context.SaveChangesAsync();
            return answer;
        }

        public async Task<IEnumerable<ExamSessionAnswer>> GetSessionAnswersAsync(int sessionId)
        {
            return await _context.ExamSessionAnswers
                .Where(a => a.SessionId == sessionId)
                .ToListAsync();
        }

        public async Task<ExamSession?> SubmitSessionAsync(int sessionId)
        {
            var session = await _context.ExamSessions.FindAsync(sessionId);
            if (session != null)
            {
                session.Status = "Submitted";
                await _context.SaveChangesAsync();
            }
            return session;
        }
    }
}
