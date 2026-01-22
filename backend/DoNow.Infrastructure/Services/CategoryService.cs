using Microsoft.EntityFrameworkCore;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using DoNow.Domain.Entities;
using DoNow.Infrastructure.Data;
using DoNow.Infrastructure.Security;
using TaskEntity = DoNow.Domain.Entities.Task;

namespace DoNow.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly DoNowDbContext _context;
    private readonly CurrentUserService _currentUserService;

    public CategoryService(DoNowDbContext context, CurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync()
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        var categories = await _context.Categories
            .Where(c => c.UserId == user.Id)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return categories.Select(c => new CategoryDto
        {
            Id = c.Id,
            Name = c.Name,
            Color = c.Color,
            Icon = c.Icon,
            IsDefault = c.IsDefault,
            CreatedAt = c.CreatedAt
        });
    }

    public async Task<CategoryDto?> GetCategoryByIdAsync(long id)
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);

        if (category == null)
            return null;

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Color = category.Color,
            Icon = category.Icon,
            IsDefault = category.IsDefault,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto)
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        // If this is set as default, unset other defaults
        if (createDto.IsDefault)
        {
            var existingDefaults = await _context.Categories
                .Where(c => c.UserId == user.Id && c.IsDefault)
                .ToListAsync();

            foreach (var cat in existingDefaults)
            {
                cat.IsDefault = false;
            }
        }

        var category = new Category
        {
            Name = createDto.Name,
            Color = createDto.Color,
            Icon = createDto.Icon,
            IsDefault = createDto.IsDefault,
            UserId = user.Id,
            CreatedAt = DateTime.UtcNow
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Color = category.Color,
            Icon = category.Icon,
            IsDefault = category.IsDefault,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<CategoryDto?> UpdateCategoryAsync(long id, UpdateCategoryDto updateDto)
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);

        if (category == null)
            return null;

        // If this is set as default, unset other defaults
        if (updateDto.IsDefault && !category.IsDefault)
        {
            var existingDefaults = await _context.Categories
                .Where(c => c.UserId == user.Id && c.IsDefault && c.Id != id)
                .ToListAsync();

            foreach (var cat in existingDefaults)
            {
                cat.IsDefault = false;
            }
        }

        category.Name = updateDto.Name;
        category.Color = updateDto.Color;
        category.Icon = updateDto.Icon;
        category.IsDefault = updateDto.IsDefault;

        await _context.SaveChangesAsync();

        return new CategoryDto
        {
            Id = category.Id,
            Name = category.Name,
            Color = category.Color,
            Icon = category.Icon,
            IsDefault = category.IsDefault,
            CreatedAt = category.CreatedAt
        };
    }

    public async Task<bool> DeleteCategoryAsync(long id)
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        var category = await _context.Categories
            .FirstOrDefaultAsync(c => c.Id == id && c.UserId == user.Id);

        if (category == null)
            return false;

        // Don't allow deleting the default category if it has tasks
        if (category.IsDefault)
        {
            var hasTasksWithCategory = await _context.Tasks
                .AnyAsync(t => t.CategoryId == id && t.UserId == user.Id);

            if (hasTasksWithCategory)
                throw new InvalidOperationException("Cannot delete default category with existing tasks");
        }

        // Set tasks' category to null before deleting
        var tasksWithCategory = await _context.Tasks
            .Where(t => t.CategoryId == id && t.UserId == user.Id)
            .ToListAsync();

        foreach (var task in tasksWithCategory)
        {
            task.CategoryId = null;
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return true;
    }

    public async System.Threading.Tasks.Task EnsureDefaultCategoryAsync()
    {
        var user = _currentUserService.GetCurrentUser();
        if (user == null)
            throw new UnauthorizedAccessException("User not authenticated");

        var hasDefaultCategory = await _context.Categories
            .AnyAsync(c => c.UserId == user.Id && c.IsDefault);

        if (!hasDefaultCategory)
        {
            var defaultCategories = new[]
            {
                new Category { Name = "工作", Color = "#4a90e2", Icon = "📁", IsDefault = true, UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new Category { Name = "个人", Color = "#34c759", Icon = "🏠", IsDefault = false, UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new Category { Name = "学习", Color = "#ff9500", Icon = "📚", IsDefault = false, UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new Category { Name = "健康", Color = "#ff3b30", Icon = "💪", IsDefault = false, UserId = user.Id, CreatedAt = DateTime.UtcNow },
                new Category { Name = "目标", Color = "#5856d6", Icon = "🎯", IsDefault = false, UserId = user.Id, CreatedAt = DateTime.UtcNow }
            };

            _context.Categories.AddRange(defaultCategories);
            await _context.SaveChangesAsync();
        }
    }
}
