namespace VocalClerk.Application.DTOs;

public class CategoryDto
{
    public long Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#808080";
    public string Icon { get; set; } = "📁";
    public bool IsDefault { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#808080";
    public string Icon { get; set; } = "📁";
    public bool IsDefault { get; set; } = false;
}

public class UpdateCategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#808080";
    public string Icon { get; set; } = "📁";
    public bool IsDefault { get; set; } = false;
}
