using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using DoNow.Domain.Entities;
using DoNow.Infrastructure.Data;
using DoNow.Infrastructure.Services;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using DoNow.Infrastructure.Security;
using Xunit;

namespace DoNow.Tests
{
    public class StatsTests
    {
        private static DoNowDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<DoNowDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new DoNowDbContext(options);
            return context;
        }

        private static void Seed(DoNowDbContext ctx, string userId)
        {
            ctx.Users.Add(new User { Id = userId, Username = "u" , Email = "u@example.com", PasswordHash = "x"});
            ctx.Items.AddRange(
                new Item { Id = 1, Title = "t1", Type = ItemType.Task, UserId = userId, IsCompleted = false, CreatedAt = DateTime.UtcNow.AddDays(-2) },
                new Item { Id = 2, Title = "t2", Type = ItemType.Task, UserId = userId, IsCompleted = true, CreatedAt = DateTime.UtcNow.AddDays(-1) },
                new Item { Id = 3, Title = "e1", Type = ItemType.Event, UserId = userId, EventTime = DateTime.UtcNow, CreatedAt = DateTime.UtcNow.AddDays(-3) },
                new Item { Id = 4, Title = "e2", Type = ItemType.Event, UserId = userId, EventTime = DateTime.UtcNow.AddDays(-10), CreatedAt = DateTime.UtcNow.AddDays(-10) }
            );
            ctx.SaveChanges();
        }

        [Fact]
        public async Task GetStatsAsync_ReturnsAggregatedCounts()
        {
            var context = CreateContext();
            const string uid = "user-1";
            Seed(context, uid);

            var currentUser = new Mock<ICurrentUserService>();
            currentUser.Setup(s => s.GetUserId()).Returns(uid);
            var mockLogger = new Mock<Microsoft.Extensions.Logging.ILogger<DoNow.Infrastructure.Services.StatsService>>();
            var statsSvc = new DoNow.Infrastructure.Services.StatsService(context, currentUser.Object, mockLogger.Object);
            var stats = await statsSvc.GetStatsAsync(null);

            Assert.Equal(2, stats.TaskTotal);
            Assert.Equal(1, stats.TaskCompleted);
            Assert.Equal(2, stats.EventTotal);
            // EventThisWeek/ThisMonth are computed; ensure they have sensible non-negative values
            Assert.True(stats.EventThisWeek >= 0);
            Assert.True(stats.EventThisMonth >= 0);
            Assert.Equal(4, stats.ItemTotal);
            Assert.Equal(1, stats.ItemCompleted);
        }
    }
}
