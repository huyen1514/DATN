using Microsoft.EntityFrameworkCore;
using Models;

namespace Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        // --- CÁC MODULE HỌC TẬP CƠ BẢN ---
        public DbSet<User> Users { get; set; }
        public DbSet<FlashCard> FlashCards { get; set; }
        public DbSet<Deck> Decks { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<Grammar> Grammars { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Level> Levels { get; set; }
        public DbSet<Kanji> Kanjis { get; set; }
        public DbSet<Listening> Listenings { get; set; }
        public DbSet<ReadingPassage> ReadingPassages { get; set; }
        public DbSet<ReadingQuestion> ReadingQuestions { get; set; }
        public DbSet<Vocabulary> Vocabularies { get; set; }

        // --- MODULE THI JLPT (ĐÃ CẬP NHẬT) ---
        public DbSet<Exam> Exams { get; set; }
        public DbSet<QuestionGroup> QuestionGroups { get; set; } // [CẬP NHẬT] Bảng mới cho nhóm câu hỏi
        public DbSet<ExamQuestion> ExamQuestions { get; set; }
        public DbSet<ExamSession> ExamSessions { get; set; }
        public DbSet<ExamSessionAnswer> ExamSessionAnswers { get; set; }
        public DbSet<ExamResult> ExamResults { get; set; }

        // --- MODULE THANH TOÁN & QUYỀN TRUY CẬP (ĐÃ CẬP NHẬT) ---
        public DbSet<UserExam> UserExams { get; set; }
        public DbSet<Payment> Payments { get; set; }

        // --- MODULE TIẾN ĐỘ & TƯƠNG TÁC ---
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<UserProgress> UserProgresses { get; set; }
        public DbSet<Bookmark> Bookmarks { get; set; }
        // [CẬP NHẬT] Đã xóa DbSet<TestHistory>

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserProgress>()
                .HasIndex(x => new { x.UserId, x.LessonId })
                .IsUnique();

            modelBuilder.Entity<Bookmark>()
                .HasIndex(x => new { x.UserId, x.ItemId, x.Type })
                .IsUnique();

            // --- ExamQuestion ---
            modelBuilder.Entity<ExamQuestion>()
                .HasOne(q => q.QuestionGroup)
                .WithMany(g => g.Questions) 
                .HasForeignKey(q => q.QuestionGroupId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ExamQuestion>()
                .HasOne(q => q.CreatedByUser)
                .WithMany()
                .HasForeignKey(q => q.CreatedByUserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ExamQuestion>()
                .HasOne(q => q.Exam)
                .WithMany(e => e.Questions)
                .HasForeignKey(q => q.ExamId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- ExamSession ---
            modelBuilder.Entity<ExamSession>()
                .HasOne(s => s.User)
                .WithMany()
                .HasForeignKey(s => s.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ExamSession>()
                .HasOne(s => s.Exam)
                .WithMany()
                .HasForeignKey(s => s.ExamId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- ExamSessionAnswer ---
            modelBuilder.Entity<ExamSessionAnswer>()
                .HasOne(a => a.Session)
                .WithMany(s => s.Answers)
                .HasForeignKey(a => a.SessionId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ExamSessionAnswer>()
                .HasOne(a => a.Question)
                .WithMany()
                .HasForeignKey(a => a.QuestionId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- ExamResult ---
            modelBuilder.Entity<ExamResult>()
                .HasOne(r => r.User)
                .WithMany()
                .HasForeignKey(r => r.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<ExamResult>()
                .HasOne(r => r.Exam)
                .WithMany()
                .HasForeignKey(r => r.ExamId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- UserExam ---
            modelBuilder.Entity<UserExam>()
                .HasOne(ue => ue.User)
                .WithMany()
                .HasForeignKey(ue => ue.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<UserExam>()
                .HasOne(ue => ue.Exam)
                .WithMany(e => e.UserExams)
                .HasForeignKey(ue => ue.ExamId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- QuestionGroup ---
            modelBuilder.Entity<QuestionGroup>()
                .HasOne(g => g.Exam)
                .WithMany()
                .HasForeignKey(g => g.ExamId)
                .OnDelete(DeleteBehavior.NoAction);

            // --- Payment ---
            modelBuilder.Entity<Payment>()
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.NoAction);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Exam)
                .WithMany()
                .HasForeignKey(p => p.ExamId)
                .OnDelete(DeleteBehavior.NoAction);
        }
    }
}