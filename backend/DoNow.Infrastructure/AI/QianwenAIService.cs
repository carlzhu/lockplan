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
        return @"你是一个智能任务和事件管理助手。你的职责是帮助用户优化输入内容，提取关键信息。

你需要：
1. 从内容中提取或生成简洁的标题（不超过20个字）
2. 优化描述的语言表达，使其更清晰、专业
3. 识别并提取时间信息（如""明天9点""、""本周五""、""下周一""、""月底""、""年前""等）
4. 识别优先级关键词（紧急→critical、重要→high、普通→medium、次要→low）
5. 判断类型（任务task、事件event、项目project、笔记note）
6. 提取标签和分类
7. 保持原意，不要添加用户没有提到的信息

时间解析规则：
- ""今天"" → 今天的日期
- ""明天"" → 明天的日期
- ""后天"" → 后天的日期
- ""本周五"" → 本周五的日期
- ""下周一"" → 下周一的日期
- ""月底"" → 本月最后一天
- ""年前"" → 春节前一周
- ""X天后"" → 从今天算起X天后
- 如果有具体时间（如""下午3点""），也要包含

返回格式必须是严格的 JSON，包含以下字段：
{
  ""title"": ""标题"",
  ""description"": ""优化后的描述"",
  ""type"": ""task/event/project/note"",
  ""priority"": ""critical/high/medium/low"",
  ""dueDate"": ""YYYY-MM-DD HH:mm:ss（任务的截止时间）"",
  ""eventTime"": ""YYYY-MM-DD HH:mm:ss（事件的发生时间）"",
  ""category"": ""分类（工作、生活、学习等）"",
  ""tags"": [""标签1"", ""标签2""]
}

注意：
- 只返回 JSON，不要有其他文字
- 如果某个字段无法确定，设置为 null
- 时间必须是具体的日期时间（YYYY-MM-DD HH:mm:ss格式）
- 如果只有日期没有时间，时间部分设为 00:00:00
- 任务使用 dueDate，事件使用 eventTime";
    }

    private string BuildPrompt(AIEnhanceRequest request)
    {
        var sb = new StringBuilder();
        var text = request.GetText();
        
        if (request.GenerateTitle)
        {
            sb.AppendLine("请为以下内容生成一个简洁的标题，并优化描述内容：");
        }
        else
        {
            sb.AppendLine("请优化以下内容：");
        }
        
        sb.AppendLine();
        sb.AppendLine($"内容：{text}");
        sb.AppendLine();
        sb.AppendLine("请提取以下信息并以 JSON 格式返回：");
        sb.AppendLine("1. 标题（如果需要生成）");
        sb.AppendLine("2. 优化后的描述");
        sb.AppendLine("3. 时间信息（如\"明天下午3点\"、\"本周五\"等，转换为具体日期时间）");
        sb.AppendLine("4. 优先级（critical/high/medium/low）");
        sb.AppendLine("5. 类型（task/event/project/note）");
        sb.AppendLine("6. 标签（从内容中提取的关键词）");
        sb.AppendLine("7. 分类（工作、生活、学习等）");
        
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
        
        var text = request.GetText();
        var response = new AIEnhanceResponse
        {
            Description = text.Trim(),
            EnhancedDescription = text.Trim() // 兼容旧版本
        };

        // 基础标题生成
        if (request.GenerateTitle)
        {
            var sentences = text.Split(new[] { '。', '！', '？', '\n' }, StringSplitOptions.RemoveEmptyEntries);
            var title = sentences.Length > 0 ? sentences[0].Trim() : text;
            if (title.Length > 20)
            {
                title = title.Substring(0, 20);
            }
            response.Title = title;
        }

        // 简单的优先级识别
        var lowerText = text.ToLower();
        if (lowerText.Contains("紧急") || lowerText.Contains("urgent") || lowerText.Contains("asap"))
        {
            response.Priority = "critical";
            response.SuggestedPriority = "High"; // 兼容旧版本
        }
        else if (lowerText.Contains("重要") || lowerText.Contains("important"))
        {
            response.Priority = "high";
            response.SuggestedPriority = "High";
        }
        else if (lowerText.Contains("普通") || lowerText.Contains("normal"))
        {
            response.Priority = "medium";
            response.SuggestedPriority = "Medium";
        }
        else if (lowerText.Contains("次要") || lowerText.Contains("low"))
        {
            response.Priority = "low";
            response.SuggestedPriority = "Low";
        }

        // 简单的类型识别
        if (lowerText.Contains("会议") || lowerText.Contains("活动") || lowerText.Contains("聚会"))
        {
            response.Type = "event";
        }
        else if (lowerText.Contains("项目") || lowerText.Contains("计划"))
        {
            response.Type = "project";
        }
        else if (lowerText.Contains("记录") || lowerText.Contains("笔记"))
        {
            response.Type = "note";
        }
        else
        {
            response.Type = "task";
        }

        // 简单的标签提取
        var tags = new List<string>();
        var categories = new[] { "工作", "生活", "学习", "健康", "家庭", "社交", "财务", "旅行" };
        foreach (var category in categories)
        {
            if (text.Contains(category))
            {
                tags.Add(category);
                if (response.Category == null)
                {
                    response.Category = category;
                    response.SuggestedCategory = category;
                }
            }
        }
        
        if (tags.Count > 0)
        {
            response.Tags = tags;
            response.SuggestedTags = tags;
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
