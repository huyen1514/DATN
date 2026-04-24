using Microsoft.EntityFrameworkCore;
using Models;

namespace Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users { get; set; }
        public DbSet<FlashCard> FlashCards { get; set; }
        public DbSet<Deck> Decks { get; set; }
        public DbSet<Folder> Folders { get; set; }
        public DbSet<Grammar> Grammars { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Level> Levels { get; set; }
        public DbSet<Kanji> Kanjis { get; set; }
        public DbSet<Listening> Listenings { get; set; }
        public DbSet<Reading> Readings { get; set; }
        public DbSet<Vocabulary> Vocabularies { get; set; }
        public DbSet<Exam> Exams { get; set; }
        public DbSet<ExamQuestion> ExamQuestions { get; set; }
        public DbSet<ExamResult> ExamResults { get; set; }
        public DbSet<UserExams> UserExams { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<LessonProgress> LessonProgresses { get; set; }
        public DbSet<ExamSession> ExamSessions { get; set; }
        public DbSet<ExamSessionAnswer> ExamSessionAnswers { get; set; }
        public DbSet<UserProgress> UserProgresses { get; set; }
        public DbSet<TestHistory> TestHistories { get; set; }
        public DbSet<Bookmark> Bookmarks { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<UserProgress>()
                .HasIndex(x => new { x.UserId, x.LessonId })
                .IsUnique();

            modelBuilder.Entity<Bookmark>()
                .HasIndex(x => new { x.UserId, x.ItemId, x.Type })
                .IsUnique();

            modelBuilder.Entity<TestHistory>()
                .HasIndex(x => new { x.UserId, x.Date });
        }
    }
}
