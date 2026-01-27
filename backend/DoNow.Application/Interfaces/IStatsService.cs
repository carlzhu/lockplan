using System.Threading.Tasks;
using DoNow.Application.DTOs;

namespace DoNow.Application.Interfaces
{
    public interface IStatsService
    {
        Task<StatsDto> GetStatsAsync(string userId);
    }
}
