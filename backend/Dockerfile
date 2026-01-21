FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files and restore dependencies
COPY ["VocalClerk.Api/VocalClerk.Api.csproj", "VocalClerk.Api/"]
COPY ["VocalClerk.Application/VocalClerk.Application.csproj", "VocalClerk.Application/"]
COPY ["VocalClerk.Domain/VocalClerk.Domain.csproj", "VocalClerk.Domain/"]
COPY ["VocalClerk.Infrastructure/VocalClerk.Infrastructure.csproj", "VocalClerk.Infrastructure/"]
RUN dotnet restore "VocalClerk.Api/VocalClerk.Api.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/VocalClerk.Api"
RUN dotnet build "VocalClerk.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "VocalClerk.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "VocalClerk.Api.dll"]
