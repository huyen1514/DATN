using Data;
using Microsoft.EntityFrameworkCore;
using backend.DTOs.Exam;
using Models;

namespace Services
{
    public class ExamQuestionService : IExamQuestionService
    {
        private readonly AppDbContext _context;

        public ExamQuestionService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ExamQuestionAdminDto>> GetAllQuestionsAsync()
        {
            return await _context.ExamQuestions
                .AsNoTracking()
                .Include(q => q.Exam)
                .Include(q => q.QuestionGroup)
                .Select(q => new ExamQuestionAdminDto
                {
                    ExamQuestionId = q.ExamQuestionId,
                    Question = q.Question,
                    OptionA = q.OptionA,
                    OptionB = q.OptionB,
                    OptionC = q.OptionC,
                    OptionD = q.OptionD,
                    CorrectAnswer = (int)q.CorrectAnswer,
                    Section = (int)q.Section,
                    MondaiNumber = q.MondaiNumber,
                    Passage = q.QuestionGroup != null ? q.QuestionGroup.Passage : null,
                    Instruction = q.Instruction,
                    Explanation = q.Explanation,
                    AudioUrl = q.QuestionGroup != null ? q.QuestionGroup.AudioUrl : null,
                    ExamId = q.ExamId,
                    UserId = q.CreatedByUserId,
                    Exam = q.Exam != null ? new ExamSimpleDto { ExamId = q.Exam.ExamId, ExamName = q.Exam.ExamName } : null
                })
                .ToListAsync();
        }

        public async Task<ExamQuestionAdminDto?> CreateQuestionAsync(ExamQuestionCreateDto dto)
        {
            var exam = await _context.Exams.FindAsync(dto.ExamId);
            if (exam == null) return null;

            QuestionGroup? group = null;
            if (!string.IsNullOrEmpty(dto.Passage) || !string.IsNullOrEmpty(dto.AudioUrl))
            {
                group = await _context.QuestionGroups.FirstOrDefaultAsync(g => 
                    g.ExamId == dto.ExamId && 
                    g.Passage == dto.Passage && 
                    g.AudioUrl == dto.AudioUrl);

                if (group == null)
                {
                    group = new QuestionGroup
                    {
                        ExamId = dto.ExamId,
                        Passage = dto.Passage,
                        AudioUrl = dto.AudioUrl
                    };
                    _context.QuestionGroups.Add(group);
                    await _context.SaveChangesAsync();
                }
            }

            var question = new ExamQuestion
            {
                Question = dto.Question,
                OptionA = dto.OptionA,
                OptionB = dto.OptionB,
                OptionC = dto.OptionC,
                OptionD = dto.OptionD,
                CorrectAnswer = dto.CorrectAnswer,
                Section = dto.Section,
                MondaiNumber = dto.MondaiNumber,
                Instruction = dto.Instruction,
                Explanation = dto.Explanation,
                ExamId = dto.ExamId,
                CreatedByUserId = dto.UserId,
                QuestionGroupId = group?.QuestionGroupId,
                CreatedAt = DateTime.UtcNow
            };

            _context.ExamQuestions.Add(question);
            await _context.SaveChangesAsync();

            return new ExamQuestionAdminDto
            {
                ExamQuestionId = question.ExamQuestionId,
                Question = question.Question,
                OptionA = question.OptionA,
                OptionB = question.OptionB,
                OptionC = question.OptionC,
                OptionD = question.OptionD,
                CorrectAnswer = (int)question.CorrectAnswer,
                Section = (int)question.Section,
                MondaiNumber = question.MondaiNumber,
                Passage = dto.Passage,
                Instruction = question.Instruction,
                Explanation = question.Explanation,
                AudioUrl = dto.AudioUrl,
                ExamId = question.ExamId,
                UserId = question.CreatedByUserId
            };
        }

        public async Task<ExamDetailDto?> GetExamContentAsync(int examId)
        {
            var exam = await _context.Exams
                .AsNoTracking()
                .Include(e => e.Questions)
                    .ThenInclude(q => q.QuestionGroup)
                .FirstOrDefaultAsync(e => e.ExamId == examId);

            if (exam == null) return null;

            var groups = exam.Questions
                .GroupBy(q => q.QuestionGroupId)
                .Select(g => new QuestionGroupDto {
                    QuestionGroupId = g.Key ?? 0,
                    Passage = g.First().QuestionGroup?.Passage,
                    AudioUrl = g.First().QuestionGroup?.AudioUrl,
                    Questions = g.Select(q => new QuestionDto {
                        ExamQuestionId = q.ExamQuestionId,
                        Question = q.Question,
                        OptionA = q.OptionA,
                        OptionB = q.OptionB,
                        OptionC = q.OptionC,
                        OptionD = q.OptionD,
                        MondaiNumber = q.MondaiNumber,
                        ImageUrl = q.ImageUrl,
                        Instruction = q.Instruction
                    }).ToList()
                }).ToList();

            return new ExamDetailDto {
                ExamId = exam.ExamId,
                ExamName = exam.ExamName,
                DurationSeconds = exam.Duration * 60,
                QuestionGroups = groups
            };
        }

        public async Task<bool> UpdateQuestionAsync(int id, ExamQuestionUpdateDto dto)
        {
            var existing = await _context.ExamQuestions
                .Include(q => q.QuestionGroup)
                .FirstOrDefaultAsync(q => q.ExamQuestionId == id);
                
            if (existing == null) return false;

            existing.Question = dto.Question;
            existing.OptionA = dto.OptionA;
            existing.OptionB = dto.OptionB;
            existing.OptionC = dto.OptionC;
            existing.OptionD = dto.OptionD;
            existing.CorrectAnswer = dto.CorrectAnswer;
            existing.Section = dto.Section;
            existing.MondaiNumber = dto.MondaiNumber;
            existing.Instruction = dto.Instruction;
            existing.Explanation = dto.Explanation;
            existing.ExamId = dto.ExamId;
            existing.CreatedByUserId = dto.UserId;
            
            // Cập nhật hoặc tạo QuestionGroup mới nếu passage/audioUrl thay đổi
            if (!string.IsNullOrEmpty(dto.Passage) || !string.IsNullOrEmpty(dto.AudioUrl))
            {
                if (existing.QuestionGroup == null || 
                    existing.QuestionGroup.Passage != dto.Passage || 
                    existing.QuestionGroup.AudioUrl != dto.AudioUrl)
                {
                    var group = await _context.QuestionGroups.FirstOrDefaultAsync(g => 
                        g.ExamId == dto.ExamId && 
                        g.Passage == dto.Passage && 
                        g.AudioUrl == dto.AudioUrl);

                    if (group == null)
                    {
                        group = new QuestionGroup
                        {
                            ExamId = dto.ExamId,
                            Passage = dto.Passage,
                            AudioUrl = dto.AudioUrl
                        };
                        _context.QuestionGroups.Add(group);
                        await _context.SaveChangesAsync();
                    }
                    existing.QuestionGroupId = group.QuestionGroupId;
                }
            }
            else
            {
                existing.QuestionGroupId = null; // Xóa group nếu không còn passage/audio
            }
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteQuestionAsync(int id)
        {
            var rowsAffected = await _context.ExamQuestions
                .Where(q => q.ExamQuestionId == id)
                .ExecuteDeleteAsync();

            return rowsAffected > 0;
        }
    }
}
