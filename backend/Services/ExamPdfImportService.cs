using System.Text.RegularExpressions;
using backend.DTOs.Exam;
using UglyToad.PdfPig;

namespace Services
{
    public class ExamPdfImportService
    {
        public string ExtractTextFromPdf(Stream pdfStream)
        {
            var pageTexts = new List<string>();
            using var doc = PdfDocument.Open(pdfStream);
            foreach (var page in doc.GetPages())
            {
                pageTexts.Add(page.Text ?? string.Empty);
            }
            return string.Join("\n", pageTexts).Trim();
        }

        public (ImportExamRequest? Request, List<string> Warnings) Parse(Stream pdfStream, string fileName)
        {
            var warnings = new List<string>();
            var fullText = ExtractTextFromPdf(pdfStream);
            if (string.IsNullOrWhiteSpace(fullText))
            {
                warnings.Add("PDF không có text layer (có thể là scan ảnh). Hãy OCR trước hoặc dùng JSON import.");
                return (null, warnings);
            }

            var request = BuildDraftRequest(fullText, fileName, warnings);
            return (request, warnings);
        }

        public Dictionary<int, int> ParseAnswerKeyFromText(string text)
        {
            var normalized = text.Replace("\r", "\n");
            var lines = normalized
                .Split('\n')
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            var answerMap = ExtractAnswerMap(lines);

            // Fallback pattern for compact keys like: 1A 2C 3D ...
            if (answerMap.Count == 0)
            {
                var compact = string.Join(" ", lines);
                var regex = new Regex(@"(\d{1,3})\s*([1-4A-D])", RegexOptions.IgnoreCase);
                foreach (Match m in regex.Matches(compact))
                {
                    var q = int.Parse(m.Groups[1].Value);
                    var token = m.Groups[2].Value.ToUpperInvariant();
                    var ans = token switch
                    {
                        "A" => 1,
                        "B" => 2,
                        "C" => 3,
                        "D" => 4,
                        _ => int.Parse(token)
                    };
                    answerMap[q] = ans;
                }
            }

            return answerMap;
        }

        public Dictionary<int, int> ParseAnswerKeyFromPdf(Stream answerPdfStream)
        {
            var text = ExtractTextFromPdf(answerPdfStream);
            return ParseAnswerKeyFromText(text);
        }

        public int ApplyAnswerKey(ImportExamRequest request, Dictionary<int, int> answerMap, List<string> warnings)
        {
            var updated = 0;
            var questionIndex = 0;
            foreach (var section in request.Sections)
            {
                foreach (var mondai in section.MondaiList)
                {
                    foreach (var question in mondai.Questions)
                    {
                        questionIndex++;
                        if (answerMap.TryGetValue(questionIndex, out var ans) && ans >= 1 && ans <= 4)
                        {
                            question.CorrectOptionId = ans;
                            updated++;
                        }
                        else
                        {
                            warnings.Add($"Không tìm thấy đáp án cho câu {questionIndex} trong answer key.");
                        }
                    }
                }
            }
            return updated;
        }

        private static ImportExamRequest BuildDraftRequest(string fullText, string fileName, List<string> warnings)
        {
            var normalized = fullText.Replace("\r", "\n");
            var lines = normalized
                .Split('\n')
                .Select(x => x.Trim())
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .ToList();

            var level = DetectLevel(fileName, normalized);
            var req = new ImportExamRequest
            {
                TestInfo = new TestInfoDto
                {
                    Title = $"Imported from PDF: {Path.GetFileNameWithoutExtension(fileName)}",
                    Level = level,
                    TotalDurationMinutes = 105,
                    PassMarks = new PassMarksDto
                    {
                        Total = level == "N5" ? 80 : 90,
                        VocabularyGrammarReading = level == "N5" ? 38 : 0,
                        Listening = level == "N5" ? 19 : 0
                    }
                },
                Sections = new List<SectionDto>
                {
                    new()
                    {
                        SectionId = "sec_01",
                        SectionName = "Imported Questions",
                        JpName = "PDF Import",
                        MondaiList = new List<MondaiDto>()
                    }
                }
            };

            var mondai = new MondaiDto
            {
                MondaiNumber = 1,
                Instruction = "Tự động trích xuất từ PDF (vui lòng rà soát đáp án).",
                VnInstruction = "Dữ liệu được parse tự động, hãy kiểm tra lại trước khi dùng chính thức."
            };

            var answerMap = ExtractAnswerMap(lines);
            var questionRegex = new Regex(@"^(?:[Qq]?\s*|問\s*)(\d{1,3})[\.．\)\-\s]+(.+)$");
            var optionRegex = new Regex(@"^([1-4])[\.．\)\-\s]+(.+)$");

            ImportQuestionDto? currentQuestion = null;
            var questionCount = 0;

            foreach (var line in lines)
            {
                var q = questionRegex.Match(line);
                if (q.Success)
                {
                    if (currentQuestion != null)
                    {
                        FinalizeQuestion(currentQuestion, questionCount, answerMap, warnings);
                        mondai.Questions.Add(currentQuestion);
                    }

                    var qNum = int.Parse(q.Groups[1].Value);
                    currentQuestion = new ImportQuestionDto
                    {
                        Content = q.Groups[2].Value.Trim(),
                        Options = new List<OptionDto>()
                    };
                    questionCount++;
                    continue;
                }

                if (currentQuestion == null) continue;

                var opt = optionRegex.Match(line);
                if (opt.Success)
                {
                    currentQuestion.Options.Add(new OptionDto
                    {
                        Id = int.Parse(opt.Groups[1].Value),
                        Text = opt.Groups[2].Value.Trim()
                    });
                }
                else
                {
                    if (currentQuestion.Options.Count == 0)
                    {
                        currentQuestion.Content = $"{currentQuestion.Content} {line}".Trim();
                    }
                }
            }

            if (currentQuestion != null)
            {
                questionCount++;
                FinalizeQuestion(currentQuestion, questionCount - 1, answerMap, warnings);
                mondai.Questions.Add(currentQuestion);
            }

            if (mondai.Questions.Count == 0)
            {
                warnings.Add("Không parse được câu hỏi theo mẫu số thứ tự. Hãy dùng JSON import hoặc PDF rõ text hơn.");
            }
            else
            {
                warnings.Add($"Đã parse tạm {mondai.Questions.Count} câu từ PDF.");
            }

            req.Sections[0].MondaiList.Add(mondai);
            return req;
        }

        private static string DetectLevel(string fileName, string text)
        {
            var blob = $"{fileName} {text}".ToUpperInvariant();
            foreach (var level in new[] { "N1", "N2", "N3", "N4", "N5" })
            {
                if (blob.Contains(level)) return level;
            }
            return "N5";
        }

        private static Dictionary<int, int> ExtractAnswerMap(List<string> lines)
        {
            var map = new Dictionary<int, int>();
            var regex = new Regex(@"^(\d{1,3})\s*[:：\-\)]\s*([1-4])$");
            foreach (var line in lines)
            {
                var m = regex.Match(line);
                if (!m.Success) continue;
                var q = int.Parse(m.Groups[1].Value);
                var ans = int.Parse(m.Groups[2].Value);
                map[q] = ans;
            }
            return map;
        }

        private static void FinalizeQuestion(ImportQuestionDto q, int questionNumber, Dictionary<int, int> answerMap, List<string> warnings)
        {
            while (q.Options.Count < 4)
            {
                q.Options.Add(new OptionDto
                {
                    Id = q.Options.Count + 1,
                    Text = $"(trống - option {q.Options.Count + 1})"
                });
            }

            if (answerMap.TryGetValue(questionNumber, out var ans))
            {
                q.CorrectOptionId = ans;
            }
            else
            {
                q.CorrectOptionId = 1; // Default to Option A
                warnings.Add($"Câu {questionNumber}: không tìm thấy đáp án trong PDF, tạm đặt option A.");
            }
        }

    }
}
