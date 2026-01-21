using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace VocalClerk.Infrastructure.AI;

public class OllamaAIProcessor : IAIProcessor
{
    private readonly HttpClient _httpClient;
    private readonly string _apiUrl;

    public OllamaAIProcessor(IConfiguration configuration, HttpClient httpClient)
    {
        _httpClient = httpClient;
        _apiUrl = configuration["AI:Ollama:Url"] ?? "http://localhost:11434/api/generate";
    }

    public async Task<List<Dictionary<string, object>>> ProcessInputAsync(string inputText)
    {
        try
        {
            var prompt = $@"Extract task information from the following text and return as JSON array:
Text: {inputText}

Return format:
[{{
  ""title"": ""task title"",
  ""description"": ""task description"",
  ""dueDate"": ""ISO date or null"",
  ""priority"": ""LOW/MEDIUM/HIGH/URGENT"",
  ""category"": ""category name""
}}]";

            var request = new
            {
                model = "llama2",
                prompt = prompt,
                stream = false
            };

            var content = new StringContent(
                JsonSerializer.Serialize(request),
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(_apiUrl, content);
            
            if (!response.IsSuccessStatusCode)
            {
                return GetDefaultTask(inputText);
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var result = JsonSerializer.Deserialize<JsonElement>(responseContent);
            
            // Parse the response and extract tasks
            // This is a simplified implementation
            return GetDefaultTask(inputText);
        }
        catch
        {
            return GetDefaultTask(inputText);
        }
    }

    public string GetModelName()
    {
        return "ollama";
    }

    private List<Dictionary<string, object>> GetDefaultTask(string inputText)
    {
        return new List<Dictionary<string, object>>
        {
            new Dictionary<string, object>
            {
                { "title", inputText.Length > 100 ? inputText.Substring(0, 100) : inputText },
                { "description", inputText },
                { "priority", "MEDIUM" },
                { "category", "General" }
            }
        };
    }
}
