namespace VocalClerk.Domain.Entities;

public class UserSettings
{
    public long Id { get; set; }
    public string UserId { get; set; } = string.Empty;
    public User? User { get; set; }
    public string Username { get; set; } = string.Empty;
    public bool DarkMode { get; set; } = false;
    public bool NotificationsEnabled { get; set; } = true;
    public string PreferredLanguage { get; set; } = "en";
    public string AiModel { get; set; } = "ollama";
    public bool BiometricAuthEnabled { get; set; } = false;
    public bool DataBackupEnabled { get; set; } = true;
    public int ReminderLeadTime { get; set; } = 15;
}
