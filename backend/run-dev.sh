#!/bin/bash

# VocalClerk Backend Development Runner
# This script runs the .NET 8 backend in development mode

echo "Starting VocalClerk Backend (.NET 8)..."

# Check if .NET 8 is installed
if ! command -v dotnet &> /dev/null; then
    echo "Error: .NET SDK is not installed"
    echo "Please install .NET 8 SDK from: https://dotnet.microsoft.com/download/dotnet/8.0"
    exit 1
fi

# Check .NET version
DOTNET_VERSION=$(dotnet --version)
echo "Using .NET SDK version: $DOTNET_VERSION"

# Navigate to API project
cd VocalClerk.Api

# Restore dependencies if needed
if [ ! -d "bin" ]; then
    echo "Restoring dependencies..."
    dotnet restore
fi

# Run the application
echo "Starting API server..."
dotnet run --environment Development

# The API will be available at:
# - HTTP: http://localhost:5000
# - HTTPS: https://localhost:5001
# - Swagger: http://localhost:5000/swagger
