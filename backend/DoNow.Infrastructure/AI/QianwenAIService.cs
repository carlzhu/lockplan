using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace DoNow.Infrastructure.AI;

public class QianwenAIService : IAIService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<QianwenAIService> _logger;
    private readonly string _apiUrl;
    private readonly string _apiKey;

    public QianwenAIService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<QianwenAIService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
        
        _apiUrl = configuration["AI:Qianwen:Url"] ?? throw new InvalidOperationException("Qianwen API URL not configured");
        _apiKey = configuration["AI:Qianwen:ApiKey"] ?? throw new InvalidOperationException("Qianwen API Key not configured");
    }

    public async Task<AIEnhanceResponse> EnhanceAsync(AIEnhanceRequest request)
    {
        try
        {
            _logger.LogInformation("Processing AI enhance request for type: {Type}", request.Type);
            
            // 构建提示词
            var prompt = BuildPrompt(request);
            
            // 调用通义千问 API
            var qianwenRequest = new QianwenRequest
            {
                Model = "qwen-plus",
                Input = new QianwenInput
                {
                    Messages = new List<QianwenMessage>
                    {
                        new QianwenMessage
                        {
                            Role = "system",
                            Content = GetSystemPrompt(request.Type)
                        },
                        new QianwenMessage
                        {
                            Role = "user",
                            Content = prompt
                        }
                    }
                },
                Parameters = new QianwenParameters
                {
                    ResultFormat = "message"
                }
            };

            var requestJson = JsonSerializer.Serialize(qianwenRequest, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
            });

            _logger.LogDebug("Qianwen request: {Request}", requestJson);

            var httpRequest = new HttpRequestMessage(HttpMethod.Post, _apiUrl)
            {
                Content = new StringContent(requestJson, Encoding.UTF8, "application/json")
            };
            httpRequest.Headers.Add("Authorization", $"Bearer {_apiKey}");

            var response = await _httpClient.SendAsync(httpRequest);
            var responseContent = await response.Content.ReadAsStringAsync();

            _logger.LogDebug("Qianwen response: {Response}", responseContent);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogError("Qianwen API error: {StatusCode} - {Content}", response.StatusCode, responseContent);
                return FallbackEnhance(request);
            }

            var qianwenResponse = JsonSerializer.Deserialize<QianwenResponse>(responseContent, new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            });

            if (qianwenResponse?.Output?.Choices == null || qianwenResponse.Output.Choices.Count == 0)
            {
                _logger.LogWarning("No response from Qianwen API");
                return FallbackEnhance(request);
            }

            var aiResponse = qianwenResponse.Output.Choices[0].Message.Content;
            _logger.LogInformation("AI response received: {Response}", aiResponse);

            // 解析 AI 响应
            return ParseAIResponse(aiResponse, request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calling Qianwen API");
            return FallbackEnhance(request);
        }
    }

    private string GetSystemPrompt(string type)
    {
        if (type == "task")
        {
            return @"你是一个智能任务管理助手。你的职责是帮助用户优化任务描述，提取关键信息。

你需要：
1. 如果用户要求生成标题，从描述中提取关键信息生成简洁的标题（不超过20个字）
2. 优化描述的语言表达，使其更清晰、专业
3. 识别并提取时间信息（如""明天9点""、""下周三""等）
4. 识别优先级关键词（紧急、重要、一般等）
5. 保持原意，不要添加用户没有提到的信息

返回格式必须是严格的 JSON，包含以下字段：
{
  ""title"": ""任务标题（如果需要生成）"",
  ""enhancedDescription"": ""优化后的描述"",
  ""suggestedDateTime"": ""YYYY-MM-DD HH:mm:ss 格式的时间（如果识别到）"",
  ""suggestedPriority"": ""Low/Medium/High（如果识别到）""
}

注意：
- 只返回 JSON，不要有其他文字
- 如果某个字段无法确定，设置为 null
- 时间必须是具体的日期时间，不能是相对时间";
        }
        else
        {
            return @"你是一个智能事件记录助手。你的职责是帮助用户优化事件描述，提取关键信息。

你需要：
1. 如果用户要求生成标题，从描述中提取关键信息生成简洁的标题（不超过20个字）
2. 优化描述的语言表达，使其更清晰、专业
3. 识别并提取时间信息
4. 识别事件类别（工作、会议、生活、娱乐等）
5. 提取可能的标签
6. 保持原意，不要添加用户没有提到的信息

返回格式必须是严格的 JSON，包含以下字段：
{
  ""title"": ""事件标题（如果需要生成）"",
  ""enhancedDescription"": ""优化后的描述"",
  ""suggestedDateTime"": ""YYYY-MM-DD HH:mm:ss 格式的时间（如果识别到）"",
  ""suggestedCategory"": ""事件类别（如果识别到）"",
  ""suggestedTags"": [""标签1"", ""标签2""]
}

注意：
- 只返回 JSON，不要有其他文字
- 如果某个字段无法确定，设置为 null
- 时间必须是具体的日期时间，不能是相对时间";
        }
    }

    private string BuildPrompt(AIEnhanceRequest request)
    {
        var sb = new StringBuilder();
        
        if (request.GenerateTitle)
        {
            sb.AppendLine("请为以下描述生成一个简洁的标题，并优化描述内容：");
        }
        else
        {
            sb.AppendLine("请优化以下描述内容：");
        }
        
        sb.AppendLine();
        sb.AppendLine($"描述：{request.Description}");
        sb.AppendLine();
        sb.AppendLine("请提取时间、优先级等关键信息，并以 JSON 格式返回。");
        
        return sb.ToString();
    }

    private AIEnhanceResponse ParseAIResponse(string aiResponse, AIEnhanceRequest request)
    {
        try
        {
            // 尝试提取 JSON（AI 可能返回带有额外文字的响应）
            var jsonStart = aiResponse.IndexOf('{');
            var jsonEnd = aiResponse.LastIndexOf('}');
            
            if (jsonStart >= 0 && jsonEnd > jsonStart)
            {
                var jsonStr = aiResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
                var response = JsonSerializer.Deserialize<AIEnhanceResponse>(jsonStr, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                
                if (response != null)
                {
                    _logger.LogInformation("Successfully parsed AI response");
                    return response;
                }
            }
            
            _logger.LogWarning("Failed to parse AI response as JSON, using fallback");
            return FallbackEnhance(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error parsing AI response");
            return FallbackEnhance(request);
        }
    }

    private AIEnhanceResponse FallbackEnhance(AIEnhanceRequest request)
    {
        _logger.LogInformation("Using fallback enhancement");
        
        var response = new AIEnhanceResponse
        {
            EnhancedDescription = request.Description.Trim()
        };

        // 基础标题生成
        if (request.GenerateTitle)
        {
            var words = request.Description.Trim().Split(new[] { ' ', '，', '。', '、' }, StringSplitOptions.RemoveEmptyEntries);
            var title = string.Join("", words.Take(5));
            if (title.Length > 20)
            {
                title = title.Substring(0, 20);
            }
            response.Title = title;
        }

        // 简单的优先级识别
        var lowerDesc = request.Description.ToLower();
        if (lowerDesc.Contains("紧急") || lowerDesc.Contains("重要") || lowerDesc.Contains("急"))
        {
            response.SuggestedPriority = "High";
        }
        else if (lowerDesc.Contains("一般") || lowerDesc.Contains("普通"))
        {
            response.SuggestedPriority = "Medium";
        }
        else
        {
            response.SuggestedPriority = "Low";
        }

        return response;
    }
}

// 通义千问 API 请求/响应模型
internal class QianwenRequest
{
    [JsonPropertyName("model")]
    public string Model { get; set; } = string.Empty;
    
    [JsonPropertyName("input")]
    public QianwenInput Input { get; set; } = new();
    
    [JsonPropertyName("parameters")]
    public QianwenParameters Parameters { get; set; } = new();
}

internal class QianwenInput
{
    [JsonPropertyName("messages")]
    public List<QianwenMessage> Messages { get; set; } = new();
}

internal class QianwenMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;
    
    [JsonPropertyName("content")]
    public string Content { get; set; } = string.Empty;
}

internal class QianwenParameters
{
    [JsonPropertyName("result_format")]
    public string ResultFormat { get; set; } = "message";
}

internal class QianwenResponse
{
    [JsonPropertyName("output")]
    public QianwenOutput Output { get; set; } = new();
    
    [JsonPropertyName("usage")]
    public QianwenUsage? Usage { get; set; }
    
    [JsonPropertyName("request_id")]
    public string? RequestId { get; set; }
}

internal class QianwenOutput
{
    [JsonPropertyName("choices")]
    public List<QianwenChoice> Choices { get; set; } = new();
}

internal class QianwenChoice
{
    [JsonPropertyName("finish_reason")]
    public string? FinishReason { get; set; }
    
    [JsonPropertyName("message")]
    public QianwenMessage Message { get; set; } = new();
}

internal class QianwenUsage
{
    [JsonPropertyName("input_tokens")]
    public int InputTokens { get; set; }
    
    [JsonPropertyName("output_tokens")]
    public int OutputTokens { get; set; }
    
    [JsonPropertyName("total_tokens")]
    public int TotalTokens { get; set; }
}
