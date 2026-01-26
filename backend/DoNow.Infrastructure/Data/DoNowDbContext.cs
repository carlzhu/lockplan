using Microsoft.EntityFrameworkCore;
using DoNow.Domain.Entities;

namespace DoNow.Infrastructure.Data;

public class DoNowDbContext : DbContext
{
    public DoNowDbContext(DbContextOptions<DoNowDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users { get; set; } = null!;
    public DbSet<Domain.Entities.Task> Tasks { get; set; } = null!;
    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Tag> Tags { get; set; } = null!;
    public DbSet<TaskTag> TaskTags { get; set; } = null!;
    public DbSet<UserSettings> UserSettings { get; set; } = null!;
    public DbSet<RawInput> RawInputs { get; set; } = null!;
    public DbSet<AIProcessingResult> AIProcessingResults { get; set; } = null!;
    public DbSet<Event> Events { get; set; } = null!;
    public DbSet<EventTag> EventTags { get; set; } = null!;
    
    // 新增：统一的 Item 表
    public DbSet<Item> Items { get; set; } = null!;
    public DbSet<ItemTag> ItemTags { get; set; } = null!;
    public DbSet<ItemStatusHistory> ItemStatusHistories { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Username).HasColumnName("username").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Email).HasColumnName("email").IsRequired().HasMaxLength(100);
            entity.Property(e => e.PasswordHash).HasColumnName("password_hash").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.LastLoginAt).HasColumnName("last_login_at");
            entity.Property(e => e.FailedLoginAttempts).HasColumnName("failed_login_attempts");
            entity.Property(e => e.LockedUntil).HasColumnName("locked_until");
            entity.Property(e => e.AccountLocked).HasColumnName("account_locked");
            
            entity.HasIndex(e => e.Username).IsUnique();
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Task configuration
        modelBuilder.Entity<Domain.Entities.Task>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.ReminderTime).HasColumnName("reminder_time");
            entity.Property(e => e.IsCompleted).HasColumnName("is_completed");
            entity.Property(e => e.Priority).HasColumnName("priority").HasConversion<string>();
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.RawInputId).HasColumnName("raw_input_id");
            entity.Property(e => e.OriginalInput).HasColumnName("original_input");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Tasks)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Category)
                .WithMany(c => c.Tasks)
                .HasForeignKey(e => e.CategoryId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(50);
            entity.Property(e => e.Color).HasColumnName("color").HasMaxLength(7);
            entity.Property(e => e.Icon).HasColumnName("icon").HasMaxLength(50);
            entity.Property(e => e.IsDefault).HasColumnName("is_default");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.User)
                .WithMany(u => u.Categories)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Tag configuration
        modelBuilder.Entity<Tag>(entity =>
        {
            entity.ToTable("tags");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(50);
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // TaskTag configuration (many-to-many)
        modelBuilder.Entity<TaskTag>(entity =>
        {
            entity.ToTable("task_tags");
            entity.HasKey(e => new { e.TaskId, e.TagId });
            entity.Property(e => e.TaskId).HasColumnName("task_id");
            entity.Property(e => e.TagId).HasColumnName("tag_id");

            entity.HasOne(e => e.Task)
                .WithMany(t => t.Tags)
                .HasForeignKey(e => e.TaskId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany(t => t.TaskTags)
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // UserSettings configuration
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.ToTable("user_settings");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Username).HasColumnName("username").IsRequired();
            entity.Property(e => e.DarkMode).HasColumnName("dark_mode");
            entity.Property(e => e.NotificationsEnabled).HasColumnName("notifications_enabled");
            entity.Property(e => e.PreferredLanguage).HasColumnName("preferred_language").HasMaxLength(10);
            entity.Property(e => e.AiModel).HasColumnName("ai_model").HasMaxLength(50);
            entity.Property(e => e.BiometricAuthEnabled).HasColumnName("biometric_auth_enabled");
            entity.Property(e => e.DataBackupEnabled).HasColumnName("data_backup_enabled");
            entity.Property(e => e.ReminderLeadTime).HasColumnName("reminder_lead_time");

            entity.HasOne(e => e.User)
                .WithOne(u => u.Settings)
                .HasForeignKey<UserSettings>(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId).IsUnique();
        });

        // RawInput configuration
        modelBuilder.Entity<RawInput>(entity =>
        {
            entity.ToTable("raw_inputs");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content").IsRequired();
            entity.Property(e => e.InputType).HasColumnName("input_type").HasConversion<string>();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.Processed).HasColumnName("processed");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // AIProcessingResult configuration
        modelBuilder.Entity<AIProcessingResult>(entity =>
        {
            entity.ToTable("ai_processing_results");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RawInputId).HasColumnName("raw_input_id").IsRequired();
            entity.Property(e => e.ProcessedContent).HasColumnName("processed_content").IsRequired();
            entity.Property(e => e.ModelUsed).HasColumnName("model_used").HasMaxLength(50);
            entity.Property(e => e.ProcessedAt).HasColumnName("processed_at");
            entity.Property(e => e.ConfidenceScore).HasColumnName("confidence_score");

            entity.HasOne(e => e.RawInput)
                .WithOne(r => r.ProcessingResult)
                .HasForeignKey<AIProcessingResult>(e => e.RawInputId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Event configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Category).HasColumnName("category").HasConversion<string>();
            entity.Property(e => e.EventTime).HasColumnName("event_time");
            entity.Property(e => e.Severity).HasColumnName("severity").HasMaxLength(20);
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // EventTag configuration (many-to-many)
        modelBuilder.Entity<EventTag>(entity =>
        {
            entity.ToTable("event_tags");
            entity.HasKey(e => new { e.EventId, e.TagId });
            entity.Property(e => e.EventId).HasColumnName("event_id");
            entity.Property(e => e.TagId).HasColumnName("tag_id");

            entity.HasOne(e => e.Event)
                .WithMany(ev => ev.Tags)
                .HasForeignKey(e => e.EventId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany()
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Item configuration (统一的项目表)
        modelBuilder.Entity<Item>(entity =>
        {
            entity.ToTable("items");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Title).HasColumnName("title").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Description).HasColumnName("description");
            entity.Property(e => e.Type).HasColumnName("type").HasConversion<string>().IsRequired();
            
            // 时间字段
            entity.Property(e => e.DueDate).HasColumnName("due_date");
            entity.Property(e => e.EventTime).HasColumnName("event_time");
            entity.Property(e => e.ReminderTime).HasColumnName("reminder_time");
            
            // 状态字段
            entity.Property(e => e.Status).HasColumnName("status").HasConversion<string>().IsRequired();
            entity.Property(e => e.StatusChangedAt).HasColumnName("status_changed_at");
            entity.Property(e => e.IsCompleted).HasColumnName("is_completed");
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");
            
            // 优先级/严重程度
            entity.Property(e => e.Priority).HasColumnName("priority").HasMaxLength(20);
            
            // 分类
            entity.Property(e => e.Category).HasColumnName("category").HasMaxLength(50);
            
            // 父子关系
            entity.Property(e => e.ParentId).HasColumnName("parent_id");
            
            // 用户关联
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            
            // 原始输入
            entity.Property(e => e.RawInputId).HasColumnName("raw_input_id");
            entity.Property(e => e.OriginalInput).HasColumnName("original_input");
            
            // 时间戳
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            // 关系配置
            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Parent)
                .WithMany(p => p.SubItems)
                .HasForeignKey(e => e.ParentId)
                .OnDelete(DeleteBehavior.Restrict); // 防止级联删除导致的问题

            // 索引
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.Type);
            entity.HasIndex(e => e.ParentId);
            entity.HasIndex(e => new { e.UserId, e.Type });
        });

        // ItemTag configuration (many-to-many)
        modelBuilder.Entity<ItemTag>(entity =>
        {
            entity.ToTable("item_tags");
            entity.HasKey(e => new { e.ItemId, e.TagId });
            entity.Property(e => e.ItemId).HasColumnName("item_id");
            entity.Property(e => e.TagId).HasColumnName("tag_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(e => e.Item)
                .WithMany(i => i.Tags)
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Tag)
                .WithMany()
                .HasForeignKey(e => e.TagId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ItemStatusHistory configuration (状态变更历史)
        modelBuilder.Entity<ItemStatusHistory>(entity =>
        {
            entity.ToTable("item_status_histories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ItemId).HasColumnName("item_id").IsRequired();
            entity.Property(e => e.OldStatus).HasColumnName("old_status").HasConversion<string>();
            entity.Property(e => e.NewStatus).HasColumnName("new_status").HasConversion<string>().IsRequired();
            entity.Property(e => e.Comment).HasColumnName("comment");
            entity.Property(e => e.ChangedAt).HasColumnName("changed_at");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();

            entity.HasOne(e => e.Item)
                .WithMany(i => i.StatusHistory)
                .HasForeignKey(e => e.ItemId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            // 索引
            entity.HasIndex(e => e.ItemId);
            entity.HasIndex(e => e.ChangedAt);
        });
    }
}
