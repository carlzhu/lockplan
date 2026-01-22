using DoNow.Application.DTOs;

namespace DoNow.Application.Interfaces;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterRequest registerRequest);
    Task<JwtAuthResponse> LoginAsync(LoginRequest loginRequest);
    Task<JwtAuthResponse> RefreshTokenAsync(string refreshToken);
}
