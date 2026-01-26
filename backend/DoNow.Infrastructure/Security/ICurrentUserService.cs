using DoNow.Domain.Entities;

namespace DoNow.Infrastructure.Security;

public interface ICurrentUserService
{
    Task<User> GetUserAsync();
    string? GetUserId();
    string? GetUsername();
    User? GetCurrentUser();
}
