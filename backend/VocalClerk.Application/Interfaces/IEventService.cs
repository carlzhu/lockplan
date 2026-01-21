using VocalClerk.Application.DTOs;

namespace VocalClerk.Application.Interfaces;

public interface IEventService
{
    Task<List<EventDto>> GetAllEventsAsync();
    Task<List<EventDto>> GetEventsByCategoryAsync(string category);
    Task<EventDto> GetEventByIdAsync(long eventId);
    Task<EventDto> CreateEventAsync(CreateEventDto createEventDto);
    Task<EventDto> UpdateEventAsync(long eventId, UpdateEventDto updateEventDto);
    Task DeleteEventAsync(long eventId);
    Task<List<EventDto>> GetRecentEventsAsync(int count = 10);
}
