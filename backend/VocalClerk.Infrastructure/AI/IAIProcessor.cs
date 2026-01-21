namespace VocalClerk.Infrastructure.AI;

public interface IAIProcessor
{
    Task<List<Dictionary<string, object>>> ProcessInputAsync(string inputText);
    string GetModelName();
}
