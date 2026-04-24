using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("Users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int UserId { get; set; }

        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string UserName { get; set; } = string.Empty;

        [Required]
        public string FullName {get; set;} = string.Empty;
        public string Email { get; set; } = string.Empty;

        [Required]
        [Column(TypeName = "varchar(255)")]
        public string PassWord {get; set;} = string.Empty;

        [Required]
        public string Role { get; set; } = "Student";

        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public bool IsActive { get; set; } = true;
    }
}
