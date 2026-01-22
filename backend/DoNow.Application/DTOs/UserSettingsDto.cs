namespace DoNow.Application.DTOs;

public class UserSettingsDto
{
    public long Id { get; set; }
    public bool DarkMode { get; set; }
    public bool NotificationsEnabled { get; set; }
    public string PreferredLanguage { get; set; } = "en";
    public string AiModel { get; set; } = "ollama";
    public bool BiometricAuthEnabled { get; set; }
    public bool DataBackupEnabled { get; set; }
    public int ReminderLeadTime { get; set; }
}
