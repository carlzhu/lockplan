using VocalClerk.Application.DTOs;

namespace VocalClerk.Application.Interfaces;

public interface IAuthService
{
    Task<UserDto> RegisterAsync(RegisterRequest registerRequest);
    Task<JwtAuthResponse> LoginAsync(LoginRequest loginRequest);
    Task<JwtAuthResponse> RefreshTokenAsync(string refreshToken);
}
