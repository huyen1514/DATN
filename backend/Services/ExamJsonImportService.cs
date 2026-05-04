using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Data; // Thay bằng namespace chứa AppDbContext của bạn
using Models; // Thay bằng namespace chứa các Entity (Exam, Question...) của bạn
using backend.DTOs.Exam; // Thay bằng namespace chứa DTO của bạn

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
            // 1. Kiểm tra dữ liệu đầu vào cơ bản
            if (request.TestInfo == null || string.IsNullOrWhiteSpace(request.TestInfo.Title))
                return (false, "TestInfo.Title là bắt buộc.", 0);

            // 2. Kiểm tra xem đề thi đã tồn tại chưa (tránh import trùng)
            var existingExam = await _context.Exams
                .AnyAsync(e => e.ExamName == request.TestInfo.Title);
            if (existingExam)
                return (false, $"Đề thi '{request.TestInfo.Title}' đã tồn tại trong hệ thống.", 0);

            // 3. Kiểm tra Level (N1, N2, N3, N4, N5)
            var level = await _context.Levels
                .FirstOrDefaultAsync(l => l.LevelName == request.TestInfo.Level);
            if (level == null)
                return (false, $"Level '{request.TestInfo.Level}' không tồn tại trong DB. Vui lòng tạo Level trước.", 0);

            // BẮT ĐẦU TRANSACTION: Đảm bảo nếu lỗi giữa chừng thì không bị lưu dữ liệu rác
            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                // 4. Tạo thông tin Đề thi (Exam)
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
                await _context.SaveChangesAsync(); // Cần Save ngay để lấy được exam.ExamId

                int totalQuestions = 0;

                // 5. Duyệt qua từng Section (Từ vựng, Ngữ pháp, Đọc, Nghe)
                foreach (var section in request.Sections)
                {
                    // Map chuỗi JSON sang Enum của C#
                    var sectionType = MapSectionType(section.SectionName);

                    // Duyệt qua từng Mondai (Bài lớn)
                    foreach (var mondai in section.MondaiList)
                    {
                        // 6. XỬ LÝ ĐỌC HIỂU (Tạo QuestionGroup)
                        // Nếu Mondai có đoạn văn ReadingPassage, ta tạo Group để gom các câu hỏi lại
                        QuestionGroup? group = null;
                        if (!string.IsNullOrWhiteSpace(mondai.ReadingPassage))
                        {
                            group = new QuestionGroup
                            {
                                ExamId = exam.ExamId,
                                Passage = mondai.ReadingPassage
                            };
                            _context.QuestionGroups.Add(group);
                            await _context.SaveChangesAsync(); // Cần Save ngay để lấy group.QuestionGroupId
                        }

                        // 7. XỬ LÝ CÂU HỎI CHI TIẾT
                        foreach (var q in mondai.Questions)
                        {
                            // Map ID Đáp án đúng (1, 2, 3, 4) sang Enum (A, B, C, D)
                            var correctAnswer = q.CorrectOptionId switch
                            {
                                1 => AnswerOption.A,
                                2 => AnswerOption.B,
                                3 => AnswerOption.C,
                                4 => AnswerOption.D,
                                _ => AnswerOption.A // Mặc định để tránh lỗi
                            };

                            // Lấy Text của 4 đáp án (Kiểm tra an toàn tránh lỗi OutOfRange)
                            var optionA = q.Options != null && q.Options.Count > 0 ? q.Options[0].Text : "";
                            var optionB = q.Options != null && q.Options.Count > 1 ? q.Options[1].Text : "";
                            var optionC = q.Options != null && q.Options.Count > 2 ? q.Options[2].Text : null;
                            var optionD = q.Options != null && q.Options.Count > 3 ? q.Options[3].Text : null;

                            // XỬ LÝ HÌNH ẢNH: Nếu có nhiều ảnh, nối thành 1 chuỗi cách nhau bởi dấu phẩy
                            string? mergedImages = (q.Attachments != null && q.Attachments.Any()) 
                                                   ? string.Join(",", q.Attachments) 
                                                   : null;

                            // Khởi tạo Câu hỏi
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
                                
                                // Gán đường dẫn File Media
                                ImageUrl = mergedImages, 
                                AudioUrl = q.AudioUrl,
                                
                                // Gắn ID Group (nếu là bài Đọc hiểu)
                                QuestionGroupId = group?.QuestionGroupId,
                                
                                CreatedByUserId = createdByUserId,
                                CreatedAt = DateTime.UtcNow
                            };

                            _context.ExamQuestions.Add(examQuestion);
                            totalQuestions++;
                        }
                    }
                }

                // 8. Lưu HÀNG LOẠT câu hỏi vào DB (Chỉ gọi Save 1 lần cho hàng trăm câu -> Tốc độ rất nhanh)
                await _context.SaveChangesAsync();

                // 9. Cam kết ghi dữ liệu xuống Database
                await transaction.CommitAsync();

                return (true, $"Import thành công đề thi '{exam.ExamName}' với {totalQuestions} câu hỏi.", exam.ExamId);
            }
            catch (Exception ex)
            {
                // Nếu xảy ra bất kỳ lỗi gì (VD: lỗi SQL, thiếu trường), Rollback toàn bộ, DB sẽ sạch sẽ không bị rác
                await transaction.RollbackAsync();
                return (false, $"Có lỗi nghiêm trọng khi lưu vào Database: {ex.Message} - Inner: {ex.InnerException?.Message}", 0);
            }
        }

        /// <summary>
        /// Hàm phụ trợ: Chuyển đổi tên Section từ file JSON sang Enum trong hệ thống
        /// </summary>
        private static ExamSectionType MapSectionType(string sectionName)
        {
            if (string.IsNullOrWhiteSpace(sectionName))
                return ExamSectionType.Vocabulary;

            var name = sectionName.ToLowerInvariant();

            if (name.Contains("listening") || name.Contains("nghe") || name.Contains("聴解"))
                return ExamSectionType.Listening;
            
            if (name.Contains("reading") || name.Contains("đọc") || name.Contains("読解"))
                return ExamSectionType.Reading;
            
            if (name.Contains("grammar") || name.Contains("ngữ pháp") || name.Contains("文法"))
                return ExamSectionType.Grammar;
            
            if (name.Contains("vocab") || name.Contains("từ vựng") || name.Contains("文字") || name.Contains("語彙"))
                return ExamSectionType.Vocabulary;

            if (name.Contains("kanji") || name.Contains("漢字"))
                return ExamSectionType.Vocabulary; // Gom chung Kanji vào nhóm Vocabulary

            // Mặc định
            return ExamSectionType.Vocabulary;
        }
    }
}