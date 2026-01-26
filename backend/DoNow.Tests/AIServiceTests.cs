using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Moq;
using DoNow.Application.DTOs;
using DoNow.Application.Interfaces;
using DoNow.Infrastructure.AI;
using DoNow.Infrastructure.Data;
using Xunit;

namespace DoNow.Tests.Infrastructure
{
    // Simple HttpMessageHandler that returns predefined content
    internal class SuccessHttpMessageHandler : HttpMessageHandler
    {
        private readonly string _responseContent;
        public SuccessHttpMessageHandler(string responseContent)
        {
            _responseContent = responseContent;
        }
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var resp = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(_responseContent, Encoding.UTF8, "application/json")
            };
            return Task.FromResult(resp);
        }
    }

    // Fail path handler
    internal class FailureHttpMessageHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            var resp = new HttpResponseMessage(HttpStatusCode.InternalServerError);
            return Task.FromResult(resp);
        }
    }

    public class AIServiceTests
    {
        private static Mock<IConfiguration> CreateMockConfig(string url = "https://fake-ai-url", string apiKey = "fake-key")
        {
            var configMock = new Mock<IConfiguration>();
            configMock.Setup(x => x[It.Is<string>(s => s == "AI:Qianwen:Url")] ).Returns(url);
            configMock.Setup(x => x[It.Is<string>(s => s == "AI:Qianwen:ApiKey")] ).Returns(apiKey);
            return configMock;
        }

        [Fact]
        public async Task EnhanceAsync_ReturnsParsedAIEnhanceResponse_OnSuccess()
        {
            // Arrange
            var aiPayload = new AIEnhanceRequest { Description = "测试描述任务", Type = "task", GenerateTitle = true };
            var aiJson = new AIEnhanceResponseData
            {
                Title = "Weekly Plan",
                EnhancedDescription = "This is a polished description.",
                SuggestedDateTime = "2026-01-26 10:00:00",
                SuggestedPriority = "High"
            };
            var aiWrapperContent = new { output = new { choices = new[] { new { message = new { content = JsonSerializer.Serialize(aiJson) } } } }, usage = new { }, request_id = "req-1" };
            var httpContent = System.Text.Json.JsonSerializer.Serialize(aiWrapperContent);
            var httpHandler = new SuccessHttpMessageHandler(httpContent);

            var httpClient = new HttpClient(httpHandler);
            var config = CreateMockConfig().Object;
            var logger = Mock.Of<ILogger<QianwenAIService>>();

            // Act
            var service = new QianwenAIService(httpClient, CreateMockConfig().Object, logger);
            var result = await service.EnhanceAsync(aiPayload);

            // Assert
            Assert.NotNull(result);
            Assert.Equal("Weekly Plan", result.Title);
            Assert.Equal("This is a polished description.", result.EnhancedDescription);
            Assert.Equal("2026-01-26 10:00:00", result.SuggestedDateTime);
            Assert.Equal("High", result.SuggestedPriority);
        }

        [Fact]
        public async Task EnhanceAsync_OnApiFailure_UsesFallback()
        {
            // Arrange
            var aiPayload = new AIEnhanceRequest { Description = "紧急事项需要处理", Type = "task", GenerateTitle = true };
            var httpHandler = new FailureHttpMessageHandler();
            var httpClient = new HttpClient(httpHandler);
            var mockConfig = CreateMockConfig();
            var logger = Mock.Of<ILogger<QianwenAIService>>();
            var service = new QianwenAIService(httpClient, mockConfig.Object, logger);

            // Act
            var result = await service.EnhanceAsync(aiPayload);

            // Assert: fallback should set a non-null EnhancedDescription and High priority
            Assert.NotNull(result);
            Assert.NotNull(result.EnhancedDescription);
            // Since description contains "紧急", expect High priority as per fallback logic
            Assert.Equal("High", result.SuggestedPriority);
        }
    }

    // Helper data contract matching AIEnhanceResponse in DoNow.Application.DTOs
    internal class AIEnhanceResponseData
    {
        public string? Title { get; set; }
        public string? EnhancedDescription { get; set; }
        public string? SuggestedDateTime { get; set; }
        public string? SuggestedPriority { get; set; }
        public string? SuggestedCategory { get; set; }
        public List<string>? SuggestedTags { get; set; }
    }
}
