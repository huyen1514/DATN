using Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models;
using backend.DTOs.Exam;
using Services;

namespace Controllers
{
    [ApiController]
    [Route("api/exams")]
    public class ExamController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly ExamPdfImportService _pdfImportService;
        private readonly Repositories.IExamSessionRepository _sessionRepo;

        public ExamController(AppDbContext context, ExamPdfImportService pdfImportService, Repositories.IExamSessionRepository sessionRepo)
        {
            _context = context;
            _pdfImportService = pdfImportService;
            _sessionRepo = sessionRepo;
        }

        [HttpPost]
        public async Task<IActionResult> Create(Exam model)
        {
            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            model.CreatedAt = DateTime.UtcNow;
            _context.Exams.Add(model);
            await _context.SaveChangesAsync();

            return Ok(model);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? levelId)
        {
            var query = _context.Exams
                .Include(x => x.Level)
                .AsQueryable();

            if (levelId.HasValue)
                query = query.Where(x => x.LevelId == levelId.Value);

            var exams = await query
                .OrderBy(x => x.ExamId)
                .ToListAsync();

            return Ok(exams);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var exam = await _context.Exams
                .Include(x => x.Level)
                .FirstOrDefaultAsync(x => x.ExamId == id);

            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            return Ok(exam);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, Exam model)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            var levelExists = await _context.Levels.AnyAsync(x => x.LevelId == model.LevelId);
            if (!levelExists)
                return BadRequest("Level không tồn tại");

            exam.ExamName = model.ExamName;
            exam.Duration = model.Duration;
            exam.LevelId = model.LevelId;
            exam.PassScaledTotal = model.PassScaledTotal;
            exam.PassScaledVocabularyGrammar = model.PassScaledVocabularyGrammar;
            exam.PassScaledReading = model.PassScaledReading;
            exam.PassScaledListening = model.PassScaledListening;
            exam.PassScaledVocabularyGrammarReading = model.PassScaledVocabularyGrammarReading;
            exam.Price = model.Price;

            await _context.SaveChangesAsync();
            return Ok(exam);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var exam = await _context.Exams.FindAsync(id);
            if (exam == null)
                return NotFound("Không tìm thấy đề thi");

            _context.Exams.Remove(exam);
            await _context.SaveChangesAsync();

            return Ok("Đã xoá exam");
        }

        [HttpPost("seed")]
        public async Task<IActionResult> SeedExams()
        {
            var user = await _context.Users.FirstOrDefaultAsync();
            if (user == null)
            {
                user = new User { UserName = "admin_seed", Email = "admin@seed.com", PassWord = "hash", FullName = "Admin", Role = "Admin", IsActive = true, CreatedAt = DateTime.UtcNow };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
            }

            var level = await _context.Levels.FirstOrDefaultAsync();
            if (level == null)
            {
                level = new Level { LevelName = "N5" };
                _context.Levels.Add(level);
                await _context.SaveChangesAsync();
            }

            var exam1 = new Exam
            {
                ExamName = "JLPT N5 - Đề thi thử (Có Nghe)",
                Duration = 45,
                LevelId = level.LevelId,
                CreatedAt = DateTime.UtcNow,
                PassScaledTotal = 90,
                PassScaledVocabularyGrammar = 19,
                PassScaledReading = 19,
                PassScaledListening = 19
            };
            _context.Exams.Add(exam1);
            await _context.SaveChangesAsync();

            var questions = new List<ExamQuestion>
            {
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Từ 「学生」đọc là gì?", OptionA = "がくせい", OptionB = "がくせ", OptionC = "がっしょう", OptionD = "がくしょう", CorrectAnswer = AnswerOption.A, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Hãy nghe đoạn băng sau và chọn câu đúng.", OptionA = "Cô gái đi mua sắm.", OptionB = "Cậu bé đi thư viện.", OptionC = "Cô gái đi học.", OptionD = "Cả hai đi xem phim.", CorrectAnswer = AnswerOption.B, AudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Điền vào chỗ trống: わたし＿＿ベトナム人です。", OptionA = "が", OptionB = "は", OptionC = "の", OptionD = "を", CorrectAnswer = AnswerOption.B, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Hôm nay là thứ mấy? (Theo đoạn nghe)", OptionA = "Thứ hai", OptionB = "Thứ ba", OptionC = "Thứ sáu", OptionD = "Chủ nhật", CorrectAnswer = AnswerOption.C, AudioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Từ 「先生」nghĩa là gì?", OptionA = "Học sinh", OptionB = "Giáo viên", OptionC = "Bác sĩ", OptionD = "Kỹ sư", CorrectAnswer = AnswerOption.B, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Chọn cách đọc đúng của từ 「食べる」", OptionA = "のむ", OptionB = "みる", OptionC = "たべる", OptionD = "かく", CorrectAnswer = AnswerOption.C, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Điền từ thích hợp: これ＿＿ほんです。", OptionA = "は", OptionB = "が", OptionC = "を", OptionD = "に", CorrectAnswer = AnswerOption.A, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Ý nghĩa của từ 「ありがとう」là gì?", OptionA = "Xin lỗi", OptionB = "Cảm ơn", OptionC = "Chào buổi sáng", OptionD = "Tạm biệt", CorrectAnswer = AnswerOption.B, AudioUrl = "" },
                new ExamQuestion { ExamId = exam1.ExamId, UserId = user.UserId, Question = "Đâu là chữ Hiragana của từ 'watashi'?", OptionA = "たしわ", OptionB = "わした", OptionC = "わたし", OptionD = "しわ", CorrectAnswer = AnswerOption.C, AudioUrl = "" }
            };

            _context.ExamQuestions.AddRange(questions);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã tạo dữ liệu mẫu thành công!", ExamId = exam1.ExamId });
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportExam([FromBody] ImportExamRequest request)
            => await ImportExamInternal(request);

        [HttpPost("import-pdf")]
        public async Task<IActionResult> ImportExamFromPdf(IFormFile file, [FromQuery] bool dryRun = false)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Không có file PDF.");

            if (!Path.GetExtension(file.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("Chỉ hỗ trợ file .pdf");

            using var stream = file.OpenReadStream();
            var (request, warnings) = _pdfImportService.Parse(stream, file.FileName);

            if (request == null)
            {
                return BadRequest(new
                {
                    Message = "Không thể parse PDF thành đề thi.",
                    Warnings = warnings
                });
            }

            if (dryRun)
            {
                return Ok(new
                {
                    Message = "Đã parse PDF (dry-run), chưa tạo Exam.",
                    Warnings = warnings,
                    Draft = request
                });
            }

            var importResult = await ImportExamInternal(request);
            if (importResult is OkObjectResult ok)
            {
                return Ok(new
                {
                    ok.Value,
                    Source = "pdf",
                    Warnings = warnings
                });
            }

            return importResult;
        }

        [HttpPost("import-pdf-with-answer-key")]
        public async Task<IActionResult> ImportExamFromPdfWithAnswerKey(
            IFormFile questionFile,
            IFormFile? answerKeyFile,
            [FromQuery] bool dryRun = false)
        {
            if (questionFile == null || questionFile.Length == 0)
                return BadRequest("Không có file đề PDF.");

            if (!Path.GetExtension(questionFile.FileName).Equals(".pdf", StringComparison.OrdinalIgnoreCase))
                return BadRequest("File đề phải là .pdf");

            using var questionStream = questionFile.OpenReadStream();
            var (request, warnings) = _pdfImportService.Parse(questionStream, questionFile.FileName);

            if (request == null)
            {
                return BadRequest(new
                {
                    Message = "Không thể parse đề từ PDF.",
                    Warnings = warnings
                });
            }

            if (answerKeyFile != null && answerKeyFile.Length > 0)
            {
                Dictionary<int, int> answerMap;
                var ext = Path.GetExtension(answerKeyFile.FileName).ToLowerInvariant();
                using var keyStream = answerKeyFile.OpenReadStream();

                if (ext == ".pdf")
                {
                    answerMap = _pdfImportService.ParseAnswerKeyFromPdf(keyStream);
                }
                else
                {
                    using var reader = new StreamReader(keyStream);
                    var text = await reader.ReadToEndAsync();
                    answerMap = _pdfImportService.ParseAnswerKeyFromText(text);
                }

                if (answerMap.Count == 0)
                {
                    warnings.Add("Không đọc được answer key từ file kèm theo.");
                }
                else
                {
                    var applied = _pdfImportService.ApplyAnswerKey(request, answerMap, warnings);
                    warnings.Add($"Đã áp dụng answer key cho {applied} câu.");
                }
            }
            else
            {
                warnings.Add("Chưa có answer key file, đáp án có thể chưa chính xác.");
            }

            if (dryRun)
            {
                return Ok(new
                {
                    Message = "Đã parse đề + answer key (dry-run), chưa tạo Exam.",
                    Warnings = warnings,
                    Draft = request
                });
            }

            var importResult = await ImportExamInternal(request);
            if (importResult is OkObjectResult ok)
            {
                return Ok(new
                {
                    ok.Value,
                    Source = "pdf+answer-key",
                    Warnings = warnings
                });
            }

            return importResult;
        }

        private async Task<IActionResult> ImportExamInternal(ImportExamRequest request)
        {
            if (request?.TestInfo == null || request.Sections == null || !request.Sections.Any())
                return BadRequest("Invalid JSON data.");

            var levelName = request.TestInfo.Level;
            var level = await _context.Levels.FirstOrDefaultAsync(l => l.LevelName == levelName);
            if (level == null)
            {
                level = new Level { LevelName = levelName };
                _context.Levels.Add(level);
                await _context.SaveChangesAsync();
            }

            var user = await _context.Users.FirstOrDefaultAsync();
            if (user == null)
            {
                return BadRequest("No users found in system to assign questions to. Please create a user first.");
            }

            var exam = new Exam
            {
                ExamName = request.TestInfo.Title,
                Duration = request.TestInfo.TotalDurationMinutes,
                LevelId = level.LevelId,
                CreatedAt = DateTime.UtcNow,
                PassScaledTotal = request.TestInfo.PassMarks.Total > 0 ? request.TestInfo.PassMarks.Total : null,
                PassScaledVocabularyGrammar = request.TestInfo.PassMarks.VocabularyGrammar > 0 ? request.TestInfo.PassMarks.VocabularyGrammar : null,
                PassScaledReading = request.TestInfo.PassMarks.Reading > 0 ? request.TestInfo.PassMarks.Reading : null,
                PassScaledListening = request.TestInfo.PassMarks.Listening > 0 ? request.TestInfo.PassMarks.Listening : null,
                PassScaledVocabularyGrammarReading = request.TestInfo.PassMarks.VocabularyGrammarReading > 0 ? request.TestInfo.PassMarks.VocabularyGrammarReading : null
            };

            _context.Exams.Add(exam);
            await _context.SaveChangesAsync();

            var examQuestions = new List<ExamQuestion>();

            foreach (var section in request.Sections)
            {
                var sectionType = MapSectionToType(section);

                foreach (var mondai in section.MondaiList)
                {
                    string questionGroupId = Guid.NewGuid().ToString();

                    foreach (var question in mondai.Questions)
                    {
                        var qa = new ExamQuestion
                        {
                            ExamId = exam.ExamId,
                            UserId = user.UserId,
                            Section = sectionType,
                            MondaiNumber = mondai.MondaiNumber,
                            QuestionGroupId = questionGroupId,
                            Passage = mondai.ReadingPassage,
                            Instruction = mondai.Instruction + (!string.IsNullOrEmpty(mondai.VnInstruction) ? "\n" + mondai.VnInstruction : ""),
                            AudioUrl = mondai.AudioUrl,
                            ImageUrl = question.Attachment,
                            Question = question.Content,
                            CreatedAt = DateTime.UtcNow,
                            Explanation = question.Explanation
                        };

                        qa.OptionA = question.Options.Count > 0 ? question.Options[0].Text : "";
                        qa.OptionB = question.Options.Count > 1 ? question.Options[1].Text : "";
                        qa.OptionC = question.Options.Count > 2 ? question.Options[2].Text : null;
                        qa.OptionD = question.Options.Count > 3 ? question.Options[3].Text : null;

                        int correctIndex = question.CorrectOptionId - 1;
                        if (correctIndex >= 0 && correctIndex <= 3)
                        {
                            qa.CorrectAnswer = (AnswerOption)correctIndex;
                        }
                        else
                        {
                            qa.CorrectAnswer = AnswerOption.A; // fallback
                        }

                        examQuestions.Add(qa);
                    }
                }
            }

            _context.ExamQuestions.AddRange(examQuestions);
            await _context.SaveChangesAsync();

            return Ok(new { Message = "Đã import đề thi thành công!", ExamId = exam.ExamId });
        }

        private static ExamSectionType MapSectionToType(SectionDto section)
        {
            var id = (section.SectionId ?? "").ToLowerInvariant();
            var blob = $"{id} {section.SectionName} {section.JpName}".ToLowerInvariant();

            if (blob.Contains("listen") || id.Contains("03") || id.Contains("sec_03"))
                return ExamSectionType.Listening;

            if (blob.Contains("読解") || blob.Contains("reading") || blob.Contains("read") || blob.Contains("đọc"))
                return ExamSectionType.Reading;

            if (blob.Contains("文法") || blob.Contains("grammar") || blob.Contains("gram"))
                return ExamSectionType.Grammar;

            if (blob.Contains("語彙") || blob.Contains("文字") || blob.Contains("vocab") || blob.Contains("kanji") || id.Contains("01") || id.Contains("sec_01"))
                return ExamSectionType.Vocabulary;

            if (id.Contains("02") || id.Contains("sec_02"))
                return ExamSectionType.Grammar;

            return ExamSectionType.Vocabulary;
        }

        // --- EXAM SESSION ENDPOINTS ---

        public class StartSessionRequest
        {
            public int UserId { get; set; }
            public int ExamId { get; set; }
            public int DurationSeconds { get; set; }
        }

        [HttpPost("start-session")]
        public async Task<IActionResult> StartSession([FromBody] StartSessionRequest request)
        {
            var session = await _sessionRepo.StartSessionAsync(request.UserId, request.ExamId, request.DurationSeconds);
            return Ok(session);
        }

        public class AutoSaveAnswerRequest
        {
            public int SessionId { get; set; }
            public int QuestionId { get; set; }
            public string SelectedOption { get; set; } = string.Empty;
        }

        [HttpPost("auto-save-answer")]
        public async Task<IActionResult> AutoSaveAnswer([FromBody] AutoSaveAnswerRequest request)
        {
            var answer = await _sessionRepo.SaveAnswerAsync(request.SessionId, request.QuestionId, request.SelectedOption);
            return Ok(answer);
        }

        public class SubmitSessionRequest
        {
            public int SessionId { get; set; }
        }

        [HttpPost("submit")]
        public async Task<IActionResult> SubmitSession([FromBody] SubmitSessionRequest request)
        {
            var session = await _sessionRepo.SubmitSessionAsync(request.SessionId);
            if (session == null) return NotFound("Session not found");
            return Ok(session);
        }
    }
}
