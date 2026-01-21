namespace VocalClerk.Domain.Entities;

public class User
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public string Username { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public int FailedLoginAttempts { get; set; } = 0;
    public DateTime? LockedUntil { get; set; }
    public bool AccountLocked { get; set; } = false;

    public ICollection<Task> Tasks { get; set; } = new List<Task>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public UserSettings? Settings { get; set; }

    public bool RegisterFailedLogin(int maxAttempts, int lockDurationMinutes)
    {
        FailedLoginAttempts++;
        
        if (FailedLoginAttempts >= maxAttempts)
        {
            AccountLocked = true;
            LockedUntil = DateTime.UtcNow.AddMinutes(lockDurationMinutes);
            return true;
        }
        
        return false;
    }

    public void ResetFailedLoginAttempts()
    {
        FailedLoginAttempts = 0;
    }

    public bool IsAccountLocked()
    {
        if (AccountLocked && LockedUntil.HasValue)
        {
            if (DateTime.UtcNow > LockedUntil.Value)
            {
                AccountLocked = false;
                LockedUntil = null;
                return false;
            }
            return true;
        }
        return false;
    }

    public long GetRemainingLockTimeMinutes()
    {
        if (!AccountLocked || !LockedUntil.HasValue)
            return 0;
        
        var now = DateTime.UtcNow;
        if (now > LockedUntil.Value)
            return 0;
        
        return (long)(LockedUntil.Value - now).TotalMinutes;
    }
}
