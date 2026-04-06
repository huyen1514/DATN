using Microsoft.EntityFrameworkCore;
using Models;

namespace Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) {}

        public DbSet<User> Users { get; set; }
        public DbSet<Folder> Folders { get; set; }
public DbSet<Deck> Decks { get; set; }
public DbSet<FlashCard> FlashCards { get; set; }
        
    }
}