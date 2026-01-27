using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoNow.Application.Interfaces;
using DoNow.Application.DTOs;
using System.Threading.Tasks;

namespace DoNow.Api.Controllers;

[ApiController]
[Route("stats")]
[Authorize]
public class StatsController : ControllerBase
{
    private readonly IStatsService _statsService;
    public StatsController(IStatsService statsService)
    {
        _statsService = statsService;
    }

    [HttpGet]
    public async Task<ActionResult<StatsDto>> Get()
    {
        // attempts to use current user context internally if needed
        var result = await _statsService.GetStatsAsync(null);
        return Ok(result);
    }
}
