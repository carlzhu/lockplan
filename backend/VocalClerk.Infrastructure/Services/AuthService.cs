using Microsoft.EntityFrameworkCore;
using VocalClerk.Application.DTOs;
using VocalClerk.Application.Interfaces;
using VocalClerk.Domain.Entities;
using VocalClerk.Infrastructure.Data;
using VocalClerk.Infrastructure.Security;
using BCrypt.Net;

namespace VocalClerk.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly VocalClerkDbContext _context;
    private readonly JwtTokenProvider _tokenProvider;
    private readonly long _jwtExpirationMs;

    public AuthService(VocalClerkDbContext context, JwtTokenProvider tokenProvider, Microsoft.Extensions.Configuration.IConfiguration configuration)
    {
        _context = context;
        _tokenProvider = tokenProvider;
        _jwtExpirationMs = long.Parse(configuration["Jwt:ExpirationMs"] ?? "86400000");
    }

    public async Task<UserDto> RegisterAsync(RegisterRequest registerRequest)
    {
        if (await _context.Users.AnyAsync(u => u.Username == registerRequest.Username))
        {
            throw new ArgumentException("Username is already taken");
        }

        if (await _context.Users.AnyAsync(u => u.Email == registerRequest.Email))
        {
            throw new ArgumentException("Email is already taken");
        }

        var user = new User
        {
            Username = registerRequest.Username,
            Email = registerRequest.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerRequest.Password),
            CreatedAt = DateTime.UtcNow,
            LastLoginAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var settings = new UserSettings
        {
            UserId = user.Id,
            Username = user.Username,
            DarkMode = false,
            NotificationsEnabled = true,
            PreferredLanguage = "en",
            AiModel = "ollama",
            BiometricAuthEnabled = false,
            DataBackupEnabled = true,
            ReminderLeadTime = 15
        };

        _context.UserSettings.Add(settings);
        await _context.SaveChangesAsync();

        user.Settings = settings;

        return ConvertToDto(user);
    }

    public async Task<JwtAuthResponse> LoginAsync(LoginRequest loginRequest)
    {
        var user = await _context.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Username == loginRequest.Username || u.Email == loginRequest.Username);

        if (user == null || !BCrypt.Net.BCrypt.Verify(loginRequest.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid username or password");
        }

        if (user.IsAccountLocked())
        {
            throw new UnauthorizedAccessException($"Account is locked. Try again in {user.GetRemainingLockTimeMinutes()} minutes");
        }

        user.ResetFailedLoginAttempts();
        user.LastLoginAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        var token = _tokenProvider.GenerateToken(user.Username, user.Id);

        return new JwtAuthResponse
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresIn = _jwtExpirationMs / 1000,
            User = ConvertToDto(user)
        };
    }

    public async Task<JwtAuthResponse> RefreshTokenAsync(string refreshToken)
    {
        var principal = _tokenProvider.ValidateToken(refreshToken);
        if (principal == null)
        {
            throw new UnauthorizedAccessException("Invalid refresh token");
        }

        var username = principal.Identity?.Name;
        if (string.IsNullOrEmpty(username))
        {
            throw new UnauthorizedAccessException("Invalid token");
        }

        var user = await _context.Users
            .Include(u => u.Settings)
            .FirstOrDefaultAsync(u => u.Username == username);

        if (user == null)
        {
            throw new UnauthorizedAccessException("User not found");
        }

        var newToken = _tokenProvider.GenerateToken(user.Username, user.Id);

        return new JwtAuthResponse
        {
            AccessToken = newToken,
            TokenType = "Bearer",
            ExpiresIn = _jwtExpirationMs / 1000,
            User = ConvertToDto(user)
        };
    }

    private UserDto ConvertToDto(User user)
    {
        var userDto = new UserDto
        {
            Id = user.Id,
            Username = user.Username,
            Email = user.Email,
            CreatedAt = user.CreatedAt,
            LastLoginAt = user.LastLoginAt
        };

        if (user.Settings != null)
        {
            userDto.Settings = new UserSettingsDto
            {
                Id = user.Settings.Id,
                DarkMode = user.Settings.DarkMode,
                NotificationsEnabled = user.Settings.NotificationsEnabled,
                PreferredLanguage = user.Settings.PreferredLanguage,
                AiModel = user.Settings.AiModel,
                BiometricAuthEnabled = user.Settings.BiometricAuthEnabled,
                DataBackupEnabled = user.Settings.DataBackupEnabled,
                ReminderLeadTime = user.Settings.ReminderLeadTime
            };
        }

        return userDto;
    }
}
