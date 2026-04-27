using System.Text.Json;
using Data;
using Microsoft.EntityFrameworkCore;
using Models;
using backend.DTOs.Exam;

namespace Services
{
    public class ExamJsonImportService
    {
        private readonly AppDbContext _context;

        public ExamJsonImportService(AppDbContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Import đề thi từ một ImportExamRequest (đã được parse từ JSON).
        /// Trả về (bool Success, string Message, int ExamId).
        /// </summary>
        public async Task<(bool Success, string Message, int ExamId)> ImportAsync(ImportExamRequest request, int createdByUserId)
        {
            if (request.TestInfo == null || string.IsNullOrWhiteSpace(request.TestInfo.Title))
                return (false, "TestInfo.Title là bắt buộc.", 0);

            // Kiểm tra đề thi đã tồn tại chưa
            var existingExam = await _context.Exams
                .AnyAsync(e => e.ExamName == request.TestInfo.Title);
            if (existingExam)
                return (false, $"Đề thi '{request.TestInfo.Title}' đã tồn tại trong hệ thống.", 0);

            // Tìm Level
            var level = await _context.Levels
                .FirstOrDefaultAsync(l => l.LevelName == request.TestInfo.Level);
            if (level == null)
                return (false, $"Level '{request.TestInfo.Level}' không tồn tại. Vui lòng tạo Level trước.", 0);

            // Tạo Exam entity
            var exam = new Exam
            {
                ExamName = request.TestInfo.Title,
                Duration = request.TestInfo.TotalDurationMinutes,
                LevelId = level.LevelId,
                PassScaledTotal = request.TestInfo.PassMarks?.Total,
                PassScaledVocabularyGrammar = request.TestInfo.PassMarks?.VocabularyGrammar,
                PassScaledReading = request.TestInfo.PassMarks?.Reading,
                PassScaledListening = request.TestInfo.PassMarks?.Listening,
                PassScaledVocabularyGrammarReading = request.TestInfo.PassMarks?.VocabularyGrammarReading,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync(); // Lưu để lấy ExamId

            int totalQuestions = 0;

            foreach (var section in request.Sections)
            {
                // Map SectionName sang ExamSectionType
                var sectionType = MapSectionType(section.SectionName);

                foreach (var mondai in section.MondaiList)
                {
                    // Tạo QuestionGroup nếu có ReadingPassage hoặc AudioUrl
                    QuestionGroup? group = null;
                    if (!string.IsNullOrWhiteSpace(mondai.ReadingPassage) || !string.IsNullOrWhiteSpace(mondai.AudioUrl))
                    {
                        group = new QuestionGroup
                        {
                            ExamId = exam.ExamId,
                            Passage = mondai.ReadingPassage,
                            AudioUrl = mondai.AudioUrl
                        };
                        _context.QuestionGroups.Add(group);
                        await _context.SaveChangesAsync(); // Lưu để lấy QuestionGroupId
                    }

                    foreach (var q in mondai.Questions)
                    {
                        // Map CorrectOption (chữ cái A/B/C/D) sang AnswerOption Enum
                        if (!Enum.TryParse<AnswerOption>(q.CorrectOption, true, out var correctAnswer))
                        {
                            correctAnswer = AnswerOption.A; // Mặc định nếu không parse được
                        }

                        // Lấy text từ danh sách Options
                        var optionA = q.Options.Count > 0 ? q.Options[0].Text : "";
                        var optionB = q.Options.Count > 1 ? q.Options[1].Text : "";
                        var optionC = q.Options.Count > 2 ? q.Options[2].Text : null;
                        var optionD = q.Options.Count > 3 ? q.Options[3].Text : null;

                        var examQuestion = new ExamQuestion
                        {
                            ExamId = exam.ExamId,
                            Question = q.Content,
                            OptionA = optionA,
                            OptionB = optionB,
                            OptionC = optionC,
                            OptionD = optionD,
                            CorrectAnswer = correctAnswer,
                            Section = sectionType,
                            MondaiNumber = mondai.MondaiNumber,
                            Instruction = mondai.Instruction,
                            Explanation = q.Explanation,
                            ImageUrl = q.Attachment,
                            QuestionGroupId = group?.QuestionGroupId,
                            CreatedByUserId = createdByUserId,
                            CreatedAt = DateTime.UtcNow
                        };

                        _context.ExamQuestions.Add(examQuestion);
                        totalQuestions++;
                    }
                }
            }

            await _context.SaveChangesAsync();

            return (true, $"Import thành công đề thi '{exam.ExamName}' với {totalQuestions} câu hỏi.", exam.ExamId);
        }

        private static ExamSectionType MapSectionType(string sectionName)
        {
            var name = sectionName.ToLowerInvariant();

            if (name.Contains("listening") || name.Contains("nghe") || name.Contains("聴解"))
                return ExamSectionType.Listening;
            if (name.Contains("reading") || name.Contains("đọc") || name.Contains("読解"))
                return ExamSectionType.Reading;
            if (name.Contains("grammar") || name.Contains("ngữ pháp") || name.Contains("文法"))
                return ExamSectionType.Grammar;
            if (name.Contains("vocab") || name.Contains("từ vựng") || name.Contains("文字") || name.Contains("語彙"))
                return ExamSectionType.Vocabulary;

            // Mặc định là Vocabulary nếu không nhận diện được
            return ExamSectionType.Vocabulary;
        }
    }
}
