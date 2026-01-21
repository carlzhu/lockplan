using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VocalClerk.Application.DTOs;
using VocalClerk.Application.Interfaces;

namespace VocalClerk.Api.Controllers;

[ApiController]
[Route("events")]
[Authorize]
public class EventsController : ControllerBase
{
    private readonly IEventService _eventService;

    public EventsController(IEventService eventService)
    {
        _eventService = eventService;
    }

    [HttpGet]
    public async Task<ActionResult<List<EventDto>>> GetAllEvents([FromQuery] string? category)
    {
        try
        {
            var events = string.IsNullOrEmpty(category)
                ? await _eventService.GetAllEventsAsync()
                : await _eventService.GetEventsByCategoryAsync(category);
            return Ok(events);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("recent")]
    public async Task<ActionResult<List<EventDto>>> GetRecentEvents([FromQuery] int count = 10)
    {
        try
        {
            var events = await _eventService.GetRecentEventsAsync(count);
            return Ok(events);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("{eventId}")]
    public async Task<ActionResult<EventDto>> GetEventById(long eventId)
    {
        try
        {
            var eventDto = await _eventService.GetEventByIdAsync(eventId);
            return Ok(eventDto);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost]
    public async Task<ActionResult<EventDto>> CreateEvent([FromBody] CreateEventDto createEventDto)
    {
        try
        {
            var eventDto = await _eventService.CreateEventAsync(createEventDto);
            return CreatedAtAction(nameof(GetEventById), new { eventId = eventDto.Id }, eventDto);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{eventId}")]
    public async Task<ActionResult<EventDto>> UpdateEvent(long eventId, [FromBody] UpdateEventDto updateEventDto)
    {
        try
        {
            var eventDto = await _eventService.UpdateEventAsync(eventId, updateEventDto);
            return Ok(eventDto);
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpDelete("{eventId}")]
    public async Task<ActionResult> DeleteEvent(long eventId)
    {
        try
        {
            await _eventService.DeleteEventAsync(eventId);
            return NoContent();
        }
        catch (ArgumentException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }
}
