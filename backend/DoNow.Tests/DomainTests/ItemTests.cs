using System;
using DoNow.Domain.Entities;
using Xunit;

namespace DoNow.Tests.Domain
{
    public class ItemTests
    {
        [Fact]
        public void MarkAsCompleted_SetsFlags()
        {
            var item = new Item { Id = 1, Title = "test" };
            item.MarkAsCompleted();
            Assert.True(item.IsCompleted);
            Assert.NotNull(item.CompletedAt);
        }

        [Fact]
        public void MarkAsNotCompleted_ResetsCompleted()
        {
            var item = new Item { Id = 2, Title = "test" };
            item.MarkAsCompleted();
            item.MarkAsNotCompleted();
            Assert.False(item.IsCompleted);
            Assert.Null(item.CompletedAt);
        }

        [Fact]
        public void AddSubItem_SetsParentRelation()
        {
            var parent = new Item { Id = 10, Title = "parent" };
            var child = new Item { Id = 11, Title = "child" };
            parent.AddSubItem(child);
            Assert.Equal(parent.Id, child.ParentId);
            Assert.Contains(child, parent.SubItems);
        }

        [Fact]
        public void GetEffectiveTime_PrioritizesDueDate()
        {
            var item = new Item { Id = 1, Title = "t", DueDate = DateTime.UtcNow.AddDays(1) };
            Assert.True(item.GetEffectiveTime().HasValue);
        }
        [Fact]
        public void IsTopLevel_Tests()
        {
            var item = new Item { Id = 1 };
            Assert.True(item.IsTopLevel());
            item.ParentId = 5;
            Assert.False(item.IsTopLevel());
        }
        [Fact]
        public void HasSubItems_Tests()
        {
            var item = new Item { Id = 1 };
            Assert.False(item.HasSubItems());
            item.SubItems.Add(new Item { Id=2, Title="sub" });
            Assert.True(item.HasSubItems());
        }
    }
}
