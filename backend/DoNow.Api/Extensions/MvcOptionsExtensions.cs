using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ApplicationModels;
using Microsoft.AspNetCore.Mvc.Routing;

namespace DoNow.Api.Extensions;

/// <summary>
/// MVC 选项扩展方法
/// </summary>
public static class MvcOptionsExtensions
{
    /// <summary>
    /// 为所有控制器添加统一的路由前缀
    /// </summary>
    /// <param name="opts">MVC 选项</param>
    /// <param name="routePrefix">路由前缀，例如 "api/donow"</param>
    public static void UseGeneralRoutePrefix(this MvcOptions opts, string routePrefix)
    {
        opts.Conventions.Add(new RoutePrefixConvention(new RouteAttribute(routePrefix)));
    }

    /// <summary>
    /// 为所有控制器添加统一的路由前缀（使用 IRouteTemplateProvider）
    /// </summary>
    /// <param name="opts">MVC 选项</param>
    /// <param name="routeAttribute">路由属性</param>
    public static void UseGeneralRoutePrefix(this MvcOptions opts, IRouteTemplateProvider routeAttribute)
    {
        opts.Conventions.Add(new RoutePrefixConvention(routeAttribute));
    }
}

/// <summary>
/// 路由前缀约定
/// </summary>
public class RoutePrefixConvention : IApplicationModelConvention
{
    private readonly AttributeRouteModel _routePrefix;

    public RoutePrefixConvention(IRouteTemplateProvider routeTemplateProvider)
    {
        _routePrefix = new AttributeRouteModel(routeTemplateProvider);
    }

    public void Apply(ApplicationModel application)
    {
        foreach (var controller in application.Controllers)
        {
            // 只对 API 控制器应用路由前缀（排除 Swagger 等其他控制器）
            // 检查控制器是否有 ApiController 特性
            var hasApiControllerAttribute = controller.Attributes.Any(a => 
                a.GetType().Name == "ApiControllerAttribute");
            
            if (!hasApiControllerAttribute)
            {
                continue; // 跳过非 API 控制器
            }

            // 已经有路由前缀的控制器
            var matchedSelectors = controller.Selectors.Where(x => x.AttributeRouteModel != null).ToList();
            if (matchedSelectors.Any())
            {
                foreach (var selectorModel in matchedSelectors)
                {
                    // 合并路由前缀
                    selectorModel.AttributeRouteModel = AttributeRouteModel.CombineAttributeRouteModel(
                        _routePrefix,
                        selectorModel.AttributeRouteModel);
                }
            }

            // 没有路由前缀的控制器
            var unmatchedSelectors = controller.Selectors.Where(x => x.AttributeRouteModel == null).ToList();
            if (unmatchedSelectors.Any())
            {
                foreach (var selectorModel in unmatchedSelectors)
                {
                    // 添加路由前缀
                    selectorModel.AttributeRouteModel = _routePrefix;
                }
            }
        }
    }
}
