FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["DoNow.Api/DoNow.Api.csproj", "DoNow.Api/"]
COPY ["DoNow.Application/DoNow.Application.csproj", "DoNow.Application/"]
COPY ["DoNow.Domain/DoNow.Domain.csproj", "DoNow.Domain/"]
COPY ["DoNow.Infrastructure/DoNow.Infrastructure.csproj", "DoNow.Infrastructure/"]
RUN dotnet restore "DoNow.Api/DoNow.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/DoNow.Api"
RUN dotnet build "DoNow.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "DoNow.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DoNow.Api.dll"]
