using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using DoNow.Domain.Entities;
using DoNow.Infrastructure.Data;
using DoNow.Infrastructure.Security;
using Microsoft.Extensions.Logging;

namespace DoNow.Infrastructure.Services;

public class StatsService : IStatsService
{
    private readonly DoNowDbContext _context;
    private readonly ICurrentUserService _currentUserService;
    private readonly Microsoft.Extensions.Logging.ILogger<StatsService> _logger;
    public StatsService(DoNowDbContext context, ICurrentUserService currentUserService, Microsoft.Extensions.Logging.ILogger<StatsService> logger)
    {
        _context = context;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    public async Task<StatsDto> GetStatsAsync(string userId)
    {
        // If userId not provided, attempt to fetch from current user service
        var uid = string.IsNullOrEmpty(userId) ? _currentUserService.GetUserId() : userId;
        if (string.IsNullOrEmpty(uid))
        {
            // In development or misconfig, can't compute stats without a user context
            _logger?.LogWarning("Stats requested without authenticated user; returning zeros.");
        }
        var items = _context.Items.Where(i => i.UserId == uid);
        _logger?.LogInformation("Computing stats for userId={UserId}", uid);

        var now = DateTime.UtcNow;
        var startOfWeek = StartOfWeek(now);
        var startOfMonth = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var stats = new StatsDto
        {
            GeneratedAt = now,
            TaskTotal = await items.CountAsync(i => i.Type == ItemType.Task),
            TaskCompleted = await items.CountAsync(i => i.Type == ItemType.Task && i.IsCompleted),
            EventTotal = await items.CountAsync(i => i.Type == ItemType.Event),
            EventThisWeek = await items.CountAsync(i => i.Type == ItemType.Event && i.EventTime != null && i.EventTime >= startOfWeek && i.EventTime <= now),
            EventThisMonth = await items.CountAsync(i => i.Type == ItemType.Event && i.EventTime != null && i.EventTime >= startOfMonth),
            ItemTotal = await items.CountAsync(),
            ItemCompleted = await items.CountAsync(i => i.IsCompleted)
        };

        _logger?.LogInformation("Stats computed: TaskTotal={t}, TaskCompleted={tc}, EventTotal={e}, EventThisWeek={ew}, EventThisMonth={em}, ItemTotal={it}, ItemCompleted={ic}", stats.TaskTotal, stats.TaskCompleted, stats.EventTotal, stats.EventThisWeek, stats.EventThisMonth, stats.ItemTotal, stats.ItemCompleted);

        return stats;
    }

    private static DateTime StartOfWeek(DateTime dt)
    {
        // Assuming week starts on Monday
        int diff = (7 + (dt.DayOfWeek - DayOfWeek.Monday)) % 7;
        var start = dt.Date.AddDays(-diff);
        return new DateTime(start.Ticks, DateTimeKind.Utc);
    }
}
