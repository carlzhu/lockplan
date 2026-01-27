using System;

namespace DoNow.Application.DTOs;
 
public class StatsDto
{
    public int TaskTotal { get; set; }
    public int TaskCompleted { get; set; }
    public int EventTotal { get; set; }
    public int EventThisWeek { get; set; }
    public int EventThisMonth { get; set; }
    public int ItemTotal { get; set; }
    public int ItemCompleted { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
