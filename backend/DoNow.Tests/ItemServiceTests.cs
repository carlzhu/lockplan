using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Moq;
using DoNow.Domain.Entities;
using DoNow.Infrastructure.Data;
using DoNow.Infrastructure.Services;
using DoNow.Application.DTOs;
using DoNow.Infrastructure.Security;
using DoNow.Application.Interfaces;
using DoNow.Domain;
using Xunit;
using DoNow.Api.Controllers; // not needed but to ensure namespace mapping if exist

namespace DoNow.Tests.Infrastructure
{
    public class ItemServiceTests
    {
        private static DoNowDbContext CreateContext()
        {
            var options = new DbContextOptionsBuilder<DoNowDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;
            var context = new DoNowDbContext(options);
            return context;
        }

        [Fact]
        public async Task CreateAsync_CreatesItemAndTags()
        {
            var context = CreateContext();
            var userService = new Mock<ICurrentUserService>();
            userService.Setup(s => s.GetUserId()).Returns("user-1");
            var svc = new ItemService(context, userService.Object);

            var dto = new CreateItemDto
            {
                Title = "Test Item",
                Description = "desc",
                Type = "Task",
                Tags = new List<string> { "tag1" }
            };

            var created = await svc.CreateAsync(dto);
            Assert.NotNull(created);
            var items = await context.Items.ToListAsync();
            Assert.Single(items);
            // verify tag creation
            var tags = await context.Tags.ToListAsync();
            Assert.Single(tags);
        }

        [Fact]
        public async Task AddSubItemAsync_SetsParent()
        {
            var context = CreateContext();
            var userService = new Mock<ICurrentUserService>();
            userService.Setup(s => s.GetUserId()).Returns("user-1");
            var svc = new ItemService(context, userService.Object);

            // create parent
            var parent = new Item { Title = "Parent", UserId = "user-1" };
            context.Items.Add(parent);
            await context.SaveChangesAsync();

            var dto = new CreateItemDto { Title = "Child", Type = "Task" };
            var result = await svc.AddSubItemAsync(parent.Id, dto);
            Assert.Equal(parent.Id, result.ParentId);
        }

        [Fact]
        public async Task GetAllAsync_FilterByType()
        {
            var context = CreateContext();
            var userService = new Mock<ICurrentUserService>();
            userService.Setup(s => s.GetUserId()).Returns("user-1");
            var svc = new ItemService(context, userService.Object);

            context.Items.AddRange(
                new Item { Title = "t1", Type = DoNow.Domain.Entities.ItemType.Task, UserId = "user-1" },
                new Item { Title = "e1", Type = DoNow.Domain.Entities.ItemType.Event, UserId = "user-1" }
            );
            await context.SaveChangesAsync();

            var list = await svc.GetAllAsync(type: "Task", includeSubItems: false, topLevelOnly: false);
            Assert.Single(list);
            Assert.Equal("task", list.First().Type);
        }
    }
}
