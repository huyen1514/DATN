using System.Text.Json;
using Data;
using Microsoft.EntityFrameworkCore;
using Models;
using backend.DTOs.Exam;

namespace Services
{
    public class ExamResultService : IExamResultService
    {
        private readonly AppDbContext _context;

        public ExamResultService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<(bool Success, string Message, ExamResultDto? Data)> SubmitAsync(int sessionId)
        {
            var session = await _context.ExamSessions
                .Include(s => s.Exam)
                    .ThenInclude(e => e.Questions)
                .Include(s => s.Answers)
                .FirstOrDefaultAsync(s => s.SessionId == sessionId);

            if (session == null) return (false, "Không tìm thấy phiên làm bài", null);

            if (session.Status == SessionStatus.Submitted) 
                return (false, "Bài thi này đã được nộp trước đó", null);

            int vocabGrammarScore = 0;
            int readingScore = 0;
            int listeningScore = 0;
            int correctCount = 0;
            
            var details = new List<QuestionResultDto>();

            foreach (var q in session.Exam.Questions)
            {
                var ans = session.Answers.FirstOrDefault(a => a.QuestionId == q.ExamQuestionId);
                bool isCorrect = ans != null && ans.SelectedOption != null && ans.SelectedOption == q.CorrectAnswer;

                if (isCorrect)
                {
                    correctCount++;
                    if (q.Section == ExamSectionType.Vocabulary || q.Section == ExamSectionType.Grammar) 
                        vocabGrammarScore++;
                    else if (q.Section == ExamSectionType.Reading) 
                        readingScore++;
                    else if (q.Section == ExamSectionType.Listening) 
                        listeningScore++;
                }

                details.Add(new QuestionResultDto 
                {
                    QuestionId = q.ExamQuestionId,
                    SelectedOption = ans?.SelectedOption?.ToString(),
                    CorrectOption = q.CorrectAnswer.ToString(),
                    IsCorrect = isCorrect,
                    Explanation = q.Explanation 
                });
            }

            int minScore = session.Exam.MinimumSectionScore ?? 19;
            bool hasParalysis = vocabGrammarScore < minScore || readingScore < minScore || listeningScore < minScore;
            
            bool isPassed = !hasParalysis && correctCount >= (session.Exam.PassScaledTotal ?? 0);

            string snapshotJson = JsonSerializer.Serialize(details);
            var durationUsed = (int)(DateTime.UtcNow - session.StartTime).TotalSeconds;

            var result = new ExamResult 
            {
                ExamId = session.ExamId,
                UserId = session.UserId,
                Score = correctCount,
                VocabularyGrammarScore = vocabGrammarScore,
                ReadingScore = readingScore,
                ListeningScore = listeningScore,
                HasParalysisScore = hasParalysis,
                AmountCorrectAnswers = correctCount,
                TotalQuestion = session.Exam.Questions.Count,
                IsPassed = isPassed,
                Duration = durationUsed,
                CompletedAt = DateTime.UtcNow,
                ExamSnapshotJson = snapshotJson,
                CreatedAt = DateTime.UtcNow
            };

            session.Status = SessionStatus.Submitted;
            
            _context.ExamResults.Add(result);
            await _context.SaveChangesAsync();

            var resultDto = new ExamResultDto 
            {
                ExamResultId = result.ExamResultId,
                TotalScore = result.Score,
                VocabGrammarScore = result.VocabularyGrammarScore,
                ReadingScore = result.ReadingScore,
                ListeningScore = result.ListeningScore,
                AmountCorrectAnswers = correctCount,
                TotalQuestion = result.TotalQuestion,
                Duration = result.Duration,
                IsPassed = result.IsPassed,
                HasParalysisScore = result.HasParalysisScore,
                CompletedAt = result.CompletedAt,
                Exam = new ExamInfoDto {
                    ExamName = session.Exam.ExamName,
                    PassScaledTotal = session.Exam.PassScaledTotal,
                    PassScaledVocabularyGrammar = session.Exam.PassScaledVocabularyGrammar,
                    PassScaledReading = session.Exam.PassScaledReading,
                    PassScaledListening = session.Exam.PassScaledListening,
                    PassScaledVocabularyGrammarReading = session.Exam.PassScaledVocabularyGrammarReading
                },
                Questions = session.Exam.Questions.Select(q => new ExamQuestionAdminDto {
                    ExamQuestionId = q.ExamQuestionId,
                    Question = q.Question,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = (int)q.CorrectAnswer,
                    Section = (int)q.Section,
                    MondaiNumber = q.MondaiNumber,
                    Instruction = q.Instruction,
                    Explanation = q.Explanation,
                    AudioUrl = q.AudioUrl,
                    ImageUrl = q.ImageUrl
                }).ToList(),
                Answers = details.ToDictionary(d => d.QuestionId, d => d.SelectedOption),
                Details = details
            };

            return (true, "Thành công", resultDto);
        }

        public async Task<List<ExamResultDto>> GetUserHistoryAsync(int userId)
        {
            var results = await _context.ExamResults
                .AsNoTracking()
                .Where(r => r.UserId == userId)
                .OrderByDescending(r => r.CompletedAt)
                .Select(r => new ExamResultDto 
                {
                    ExamResultId = r.ExamResultId,
                    TotalScore = r.Score,
                    VocabGrammarScore = r.VocabularyGrammarScore,
                    ReadingScore = r.ReadingScore,
                    ListeningScore = r.ListeningScore,
                    IsPassed = r.IsPassed,
                    HasParalysisScore = r.HasParalysisScore,
                    AmountCorrectAnswers = r.AmountCorrectAnswers,
                    TotalQuestion = r.TotalQuestion,
                    Duration = r.Duration,
                    CompletedAt = r.CompletedAt
                })
                .ToListAsync();
                
            return results;
        }

        public async Task<ExamResultDto?> ReviewExamAsync(int examResultId)
        {
            var result = await _context.ExamResults
                .Include(r => r.Exam)
                    .ThenInclude(e => e.Questions)
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.ExamResultId == examResultId);

            if (result == null) return null;

            var details = string.IsNullOrEmpty(result.ExamSnapshotJson) 
                ? new List<QuestionResultDto>() 
                : JsonSerializer.Deserialize<List<QuestionResultDto>>(result.ExamSnapshotJson);

            var dto = new ExamResultDto 
            {
                ExamResultId = result.ExamResultId,
                TotalScore = result.Score,
                VocabGrammarScore = result.VocabularyGrammarScore,
                ReadingScore = result.ReadingScore,
                ListeningScore = result.ListeningScore,
                IsPassed = result.IsPassed,
                HasParalysisScore = result.HasParalysisScore,
                AmountCorrectAnswers = result.AmountCorrectAnswers,
                TotalQuestion = result.TotalQuestion,
                Duration = result.Duration,
                CompletedAt = result.CompletedAt,
                Exam = result.Exam == null ? null : new ExamInfoDto {
                    ExamName = result.Exam.ExamName,
                    PassScaledTotal = result.Exam.PassScaledTotal,
                    PassScaledVocabularyGrammar = result.Exam.PassScaledVocabularyGrammar,
                    PassScaledReading = result.Exam.PassScaledReading,
                    PassScaledListening = result.Exam.PassScaledListening,
                    PassScaledVocabularyGrammarReading = result.Exam.PassScaledVocabularyGrammarReading
                },
                Answers = (details ?? new List<QuestionResultDto>()).ToDictionary(d => d.QuestionId, d => d.SelectedOption),
                Details = details ?? new List<QuestionResultDto>()
            };

            if (result.Exam != null)
            {
                dto.Questions = result.Exam.Questions.Select(q => new ExamQuestionAdminDto {
                    ExamQuestionId = q.ExamQuestionId,
                    Question = q.Question,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = (int)q.CorrectAnswer,
                    Section = (int)q.Section,
                    MondaiNumber = q.MondaiNumber,
                    Instruction = q.Instruction,
                    Explanation = q.Explanation,
                    AudioUrl = q.AudioUrl,
                    ImageUrl = q.ImageUrl
                }).ToList();
            }

            return dto;
        }
    }
}
