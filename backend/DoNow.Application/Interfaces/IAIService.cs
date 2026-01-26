using DoNow.Application.DTOs;

namespace DoNow.Application.Interfaces;

public interface IAIService
{
    Task<AIEnhanceResponse> EnhanceAsync(AIEnhanceRequest request);
}
