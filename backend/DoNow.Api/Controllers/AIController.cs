using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using Microsoft.Extensions.Logging;
using System;
using System.Threading.Tasks;

namespace DoNow.Api.Controllers
{
    [ApiController]
    [Route("ai")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        private readonly ILogger<AIController> _logger;

        public AIController(IAIService aiService, ILogger<AIController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        [HttpPost("enhance")]
        public async Task<ActionResult<AIEnhanceResponse>> Enhance([FromBody] AIEnhanceRequest request)
        {
            try
            {
                var response = await _aiService.EnhanceAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "AI enhance request failed");
                return StatusCode(500, new { message = "Failed to process AI request" });
            }
        }

        [HttpGet("test")]
        [AllowAnonymous]
        public IActionResult Test()
        {
            return Ok(new { message = "AI service is available", timestamp = DateTime.UtcNow });
        }
    }
}
