using Microsoft.EntityFrameworkCore;
using VocalClerk.Application.DTOs;
using VocalClerk.Application.Interfaces;
using VocalClerk.Domain.Entities;
using VocalClerk.Infrastructure.Data;
using VocalClerk.Infrastructure.Security;

namespace VocalClerk.Infrastructure.Services;

public class EventService : IEventService
{
    private readonly VocalClerkDbContext _context;
    private readonly CurrentUserService _currentUserService;

    public EventService(VocalClerkDbContext context, CurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<List<EventDto>> GetAllEventsAsync()
    {
        var user = await _currentUserService.GetUserAsync();
        var events = await _context.Events
            .Include(e => e.Tags).ThenInclude(et => et.Tag)
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.EventTime ?? e.CreatedAt)
            .ToListAsync();

        return events.Select(ConvertToDto).ToList();
    }

    public async Task<List<EventDto>> GetEventsByCategoryAsync(string category)
    {
        var user = await _currentUserService.GetUserAsync();
        
        if (!Enum.TryParse<EventCategory>(category, true, out var eventCategory))
        {
            throw new ArgumentException($"Invalid category: {category}");
        }

        var events = await _context.Events
            .Include(e => e.Tags).ThenInclude(et => et.Tag)
            .Where(e => e.UserId == user.Id && e.Category == eventCategory)
            .OrderByDescending(e => e.EventTime ?? e.CreatedAt)
            .ToListAsync();

        return events.Select(ConvertToDto).ToList();
    }

    public async Task<EventDto> GetEventByIdAsync(long eventId)
    {
        var user = await _currentUserService.GetUserAsync();
        var eventEntity = await _context.Events
            .Include(e => e.Tags).ThenInclude(et => et.Tag)
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == user.Id);

        if (eventEntity == null)
        {
            throw new ArgumentException("Event not found");
        }

        return ConvertToDto(eventEntity);
    }

    public async Task<EventDto> CreateEventAsync(CreateEventDto createEventDto)
    {
        var user = await _currentUserService.GetUserAsync();

        var eventEntity = new Event
        {
            Title = createEventDto.Title,
            Description = createEventDto.Description,
            Category = createEventDto.Category,
            EventTime = createEventDto.EventTime,
            Severity = createEventDto.Severity,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.Events.Add(eventEntity);
        await _context.SaveChangesAsync();

        if (createEventDto.Tags != null && createEventDto.Tags.Any())
        {
            await ProcessTagsAsync(eventEntity, createEventDto.Tags, user.Id);
        }

        return await GetEventByIdAsync(eventEntity.Id);
    }

    public async Task<EventDto> UpdateEventAsync(long eventId, UpdateEventDto updateEventDto)
    {
        var user = await _currentUserService.GetUserAsync();
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == user.Id);

        if (eventEntity == null)
        {
            throw new ArgumentException("Event not found");
        }

        if (updateEventDto.Title != null)
            eventEntity.Title = updateEventDto.Title;

        if (updateEventDto.Description != null)
            eventEntity.Description = updateEventDto.Description;

        if (updateEventDto.Category.HasValue)
            eventEntity.Category = updateEventDto.Category.Value;

        if (updateEventDto.EventTime.HasValue)
            eventEntity.EventTime = updateEventDto.EventTime;

        if (updateEventDto.Severity != null)
            eventEntity.Severity = updateEventDto.Severity;

        eventEntity.UpdatedAt = DateTime.UtcNow;

        if (updateEventDto.Tags != null)
        {
            var existingTags = await _context.EventTags.Where(et => et.EventId == eventId).ToListAsync();
            _context.EventTags.RemoveRange(existingTags);
            await ProcessTagsAsync(eventEntity, updateEventDto.Tags, user.Id);
        }

        await _context.SaveChangesAsync();

        return await GetEventByIdAsync(eventId);
    }

    public async System.Threading.Tasks.Task DeleteEventAsync(long eventId)
    {
        var user = await _currentUserService.GetUserAsync();
        var eventEntity = await _context.Events
            .FirstOrDefaultAsync(e => e.Id == eventId && e.UserId == user.Id);

        if (eventEntity == null)
        {
            throw new ArgumentException("Event not found");
        }

        _context.Events.Remove(eventEntity);
        await _context.SaveChangesAsync();
    }

    public async Task<List<EventDto>> GetRecentEventsAsync(int count = 10)
    {
        var user = await _currentUserService.GetUserAsync();
        var events = await _context.Events
            .Include(e => e.Tags).ThenInclude(et => et.Tag)
            .Where(e => e.UserId == user.Id)
            .OrderByDescending(e => e.CreatedAt)
            .Take(count)
            .ToListAsync();

        return events.Select(ConvertToDto).ToList();
    }

    private async System.Threading.Tasks.Task ProcessTagsAsync(Event eventEntity, List<string> tagNames, string userId)
    {
        foreach (var tagName in tagNames)
        {
            var tag = await _context.Tags
                .FirstOrDefaultAsync(t => t.Name == tagName && t.UserId == userId);

            if (tag == null)
            {
                tag = new Tag
                {
                    Name = tagName,
                    UserId = userId,
                    CreatedAt = DateTime.UtcNow
                };
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync();
            }

            var eventTag = new EventTag
            {
                EventId = eventEntity.Id,
                TagId = tag.Id
            };
            _context.EventTags.Add(eventTag);
        }

        await _context.SaveChangesAsync();
    }

    private EventDto ConvertToDto(Event eventEntity)
    {
        return new EventDto
        {
            Id = eventEntity.Id,
            Title = eventEntity.Title,
            Description = eventEntity.Description,
            Category = eventEntity.Category,
            EventTime = eventEntity.EventTime,
            Severity = eventEntity.Severity,
            CreatedAt = eventEntity.CreatedAt,
            UpdatedAt = eventEntity.UpdatedAt,
            Tags = eventEntity.Tags?.Select(et => et.Tag?.Name ?? "").Where(n => !string.IsNullOrEmpty(n)).ToList() ?? new List<string>()
        };
    }
}
