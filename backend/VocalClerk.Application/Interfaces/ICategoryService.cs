using VocalClerk.Application.DTOs;

namespace VocalClerk.Application.Interfaces;

public interface ICategoryService
{
    System.Threading.Tasks.Task<IEnumerable<CategoryDto>> GetAllCategoriesAsync();
    System.Threading.Tasks.Task<CategoryDto?> GetCategoryByIdAsync(long id);
    System.Threading.Tasks.Task<CategoryDto> CreateCategoryAsync(CreateCategoryDto createDto);
    System.Threading.Tasks.Task<CategoryDto?> UpdateCategoryAsync(long id, UpdateCategoryDto updateDto);
    System.Threading.Tasks.Task<bool> DeleteCategoryAsync(long id);
    System.Threading.Tasks.Task EnsureDefaultCategoryAsync();
}
