using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("LearningProgress")]
    public class LearningProgress
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int ProgressId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int ItemId { get; set; }

        [Required]
        [StringLength(50)]
        [Column(TypeName = "nvarchar(50)")]
        public string Status { get; set; }

        [Required]
        [Column(TypeName = "decimal(5,2)")]
        public decimal Score { get; set; }

        [Required]
        public DateTime LastAccessed { get; set; }
    }
}