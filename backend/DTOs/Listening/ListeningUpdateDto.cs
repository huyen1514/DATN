using System.ComponentModel.DataAnnotations;

namespace DTOs.Listening
{
    public class ListeningUpdateDto : ListeningCreateDto
    {
        [Required]
        public int ListeningId { get; set; }
    }
}