using System.ComponentModel.DataAnnotations;
using VocalClerk.Domain.Entities;

namespace VocalClerk.Application.DTOs;

public class CreateEventDto
{
    [Required]
    [StringLength(200)]
    public string Title { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    public EventCategory Category { get; set; } = EventCategory.NORMAL;
    
    public DateTime? EventTime { get; set; }
    
    [RegularExpression("^(low|medium|high|critical)$")]
    public string? Severity { get; set; }
    
    public List<string>? Tags { get; set; }
}
