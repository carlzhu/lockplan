FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
USER root
WORKDIR /app
EXPOSE 8080

# 设置环境变量
ENV TZ=Asia/Shanghai \
    LANG=en_US.UTF-8 \
    LC_ALL=en_US.UTF-8
    
# 设置时区
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["DoNow.Api/DoNow.Api.csproj", "DoNow.Api/"]
COPY ["DoNow.Application/DoNow.Application.csproj", "DoNow.Application/"]
COPY ["DoNow.Domain/DoNow.Domain.csproj", "DoNow.Domain/"]
COPY ["DoNow.Infrastructure/DoNow.Infrastructure.csproj", "DoNow.Infrastructure/"]
RUN dotnet restore "DoNow.Api/DoNow.Api.csproj"
COPY . .
COPY nuget.config .
WORKDIR "/src/DoNow.Api"
RUN dotnet build "./DoNow.Api.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DoNow.Api.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DoNow.Api.dll"]
