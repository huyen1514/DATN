using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Models
{
    [Table("ExamSessions")]
    public class ExamSession
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int SessionId { get; set; }

        [Required]
        public int UserId { get; set; }

        [Required]
        public int ExamId { get; set; }

        [Required]
        public DateTime StartTime { get; set; }

        [Required]
        [StringLength(50)]
        public string Status { get; set; } // InProgress, Submitted

        public int TimeRemainingSeconds { get; set; }
    }
}
