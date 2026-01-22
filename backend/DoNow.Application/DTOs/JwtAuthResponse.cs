namespace DoNow.Application.DTOs;

public class JwtAuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string TokenType { get; set; } = "Bearer";
    public long ExpiresIn { get; set; }
    public UserDto User { get; set; } = null!;
}
