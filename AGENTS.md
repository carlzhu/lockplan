# AGENTS.md - Development Guidelines for DoNow Project

This file contains guidelines and commands for agentic coding agents working in this repository.

## Project Overview

DoNow is a task management application with AI-powered features. It uses a clean architecture with:
- **Backend**: .NET 8 Web API with MySQL database
- **Frontend**: React Native (Expo) mobile application
- **Architecture**: Clean Architecture pattern with clear separation of concerns

## Development Commands

### Backend (.NET 8)
```bash
# Navigate to backend directory
cd backend

# Run the API in development mode
./run-dev.sh

# Run all tests
dotnet test

# Run specific test file
dotnet test --filter "ClassName=TestClassName"

# Run tests with coverage
dotnet test --collect:"XPlat Code Coverage"

# Build the solution
dotnet build

# Run database migrations (auto-applied on startup)
dotnet ef database update

# Create new migration
dotnet ef migrations add MigrationName -p DoNow.Infrastructure -s DoNow.Api
```

### Frontend (React Native/Expo)
```bash
# Navigate to frontend directory
cd frontend

# Start development server
npm start
# or
expo start

# Run tests
npm test

# Run specific test file
npm test -- --testNamePattern="TestName"
# or
npm test path/to/test.test.ts

# Run tests in watch mode
npm test -- --watch

# Build for iOS
npm run build:ios

# Build for Android
npm run build:android

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Full Stack Development
```bash
# Start both frontend and backend
./start-dev.sh

# Push to remote repository
./push-to-remote.sh
```

## Code Style Guidelines

### C# (.NET Backend)

#### Naming Conventions
- **Classes**: PascalCase (e.g., `TaskService`, `TasksController`)
- **Interfaces**: PascalCase with `I` prefix (e.g., `ITaskRepository`)
- **Methods**: PascalCase (e.g., `GetTasksById`, `CreateTask`)
- **Properties**: PascalCase (e.g., `TaskId`, `TaskName`)
- **Parameters/Variables**: camelCase (e.g., `taskId`, `taskService`)
- **Constants**: PascalCase (e.g., `MaxTaskNameLength`)
- **Private fields**: `_camelCase` prefix (e.g., `_taskRepository`)

#### Code Organization
- Follow Clean Architecture layers: Domain → Application → Infrastructure → API
- Controllers in `DoNow.Api/Controllers/`
- Services in `DoNow.Application/Services/`
- DTOs in `DoNow.Application/DTOs/`
- Entities in `DoNow.Domain/Entities/`
- Repository implementations in `DoNow.Infrastructure/Repositories/`

#### Import Style
```csharp
// System namespaces first
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

// Microsoft namespaces second
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// Third-party namespaces third
using Swashbuckle.AspNetCore.Annotations;

// Project namespaces last (alphabetical)
using DoNow.Application.DTOs;
using DoNow.Application.Services;
using DoNow.Domain.Entities;
```

#### Error Handling
- Use HTTP status codes appropriately in controllers
- Implement global exception handling middleware
- Use try-catch blocks for external service calls
- Log errors with appropriate severity levels
- Return meaningful error messages to clients

#### Async/Await Pattern
```csharp
public async Task<ActionResult<TaskDto>> GetTask(int id)
{
    var task = await _taskService.GetTaskByIdAsync(id);
    if (task == null)
        return NotFound();
    
    return Ok(task);
}
```

### TypeScript (React Native Frontend)

#### Naming Conventions
- **Components**: PascalCase (e.g., `WeeklyAgendaScreen`, `TaskItem`)
- **Interfaces/Types**: PascalCase (e.g., `Task`, `ApiResponse`)
- **Functions**: camelCase (e.g., `getTasks`, `createTask`)
- **Variables**: camelCase (e.g., `taskList`, `isLoading`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `API_BASE_URL`)
- **Files**: kebab-case for components (e.g., `task-item.tsx`)

#### Import Style
```typescript
// React and React Native first
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Third-party libraries second
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

// Local imports third (relative paths)
import { Task } from '../types/task';
import { TaskService } from '../services/task-service';
import { LoadingSpinner } from '../components/loading-spinner';
```

#### Component Structure
```typescript
interface TaskItemProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Component logic
  }, []);

  const handlePress = async () => {
    // Event handlers
  };

  return (
    <View style={styles.container}>
      {/* JSX content */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Style definitions
  },
});
```

#### Error Handling
- Use try-catch blocks for API calls
- Implement error boundaries for component errors
- Show user-friendly error messages
- Log errors for debugging purposes
- Handle network errors gracefully

#### Service Layer Pattern
```typescript
export class TaskService {
  private apiClient = axios.create({
    baseURL: API_BASE_URL,
  });

  async getTasks(): Promise<Task[]> {
    try {
      const response = await this.apiClient.get<Task[]>('/tasks');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw new Error('Unable to load tasks. Please try again.');
    }
  }
}
```

## Testing Guidelines

### Backend Testing (xUnit)
- Use Arrange-Act-Assert pattern
- Mock dependencies using Moq
- Test both happy path and error scenarios
- Use descriptive test names
- Test one thing per test

```csharp
[Fact]
public async Task GetTaskById_WithValidId_ReturnsTask()
{
    // Arrange
    var taskId = 1;
    var expectedTask = new Task { Id = taskId, Name = "Test Task" };
    _mockTaskService.Setup(x => x.GetTaskByIdAsync(taskId))
                   .ReturnsAsync(expectedTask);

    // Act
    var result = await _controller.GetTask(taskId);

    // Assert
    var okResult = Assert.IsType<OkObjectResult>(result.Result);
    var actualTask = Assert.IsType<TaskDto>(okResult.Value);
    Assert.Equal(expectedTask.Id, actualTask.Id);
}
```

### Frontend Testing (Jest)
- Test component rendering and behavior
- Mock API calls and external dependencies
- Test user interactions
- Use React Testing Library for component tests
- Test async operations properly

```typescript
describe('TaskItem', () => {
  it('renders task information correctly', () => {
    const mockTask = { id: 1, name: 'Test Task', completed: false };
    const mockOnUpdate = jest.fn();

    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('Test Task')).toBeTruthy();
  });

  it('calls onUpdate when task is pressed', async () => {
    const mockTask = { id: 1, name: 'Test Task', completed: false };
    const mockOnUpdate = jest.fn();

    render(<TaskItem task={mockTask} onUpdate={mockOnUpdate} />);
    
    fireEvent.press(screen.getByText('Test Task'));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(mockTask);
    });
  });
});
```

## Database Guidelines

### Entity Framework Core
- Use code-first migrations
- Define entities in Domain layer
- Use appropriate data types and constraints
- Implement proper relationships (one-to-many, many-to-many)
- Use Fluent API for complex configurations

### Migration Best Practices
- Create descriptive migration names
- Review generated migration code
- Test migrations on development database
- Keep migrations backward-compatible when possible

## API Design Guidelines

### RESTful Conventions
- Use HTTP methods correctly (GET, POST, PUT, DELETE)
- Use appropriate status codes (200, 201, 400, 404, 500)
- Implement proper error responses
- Use Swagger/OpenAPI documentation
- Version APIs when needed

### Response Format
```csharp
// Success response
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T Data { get; set; }
    public string Message { get; set; }
}

// Error response
public class ErrorResponse
{
    public bool Success { get; set; } = false;
    public string Message { get; set; }
    public string ErrorCode { get; set; }
    public List<string> Errors { get; set; }
}
```

## Security Guidelines

### Authentication & Authorization
- Use JWT Bearer tokens for authentication
- Implement proper token expiration and refresh
- Validate user permissions for sensitive operations
- Never expose sensitive information in API responses

### Data Protection
- Hash passwords using proper algorithms
- Validate all input data
- Use parameterized queries to prevent SQL injection
- Implement proper CORS policies

## Performance Guidelines

### Backend Optimization
- Use async/await for I/O operations
- Implement proper caching strategies
- Use pagination for large datasets
- Optimize database queries with proper indexes
- Monitor application performance

### Frontend Optimization
- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use flat lists for large datasets
- Implement proper state management

## Git Workflow

### Branch Naming
- `feature/task-name` for new features
- `bugfix/issue-description` for bug fixes
- `hotfix/critical-fix` for urgent fixes
- `refactor/code-improvement` for refactoring

### Commit Messages
- Use present tense ("Add feature" not "Added feature")
- Be descriptive but concise
- Include issue number when applicable
- Format: `type(scope): description`

## Development Environment Setup

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+
- Expo CLI
- MySQL Server
- Git

### Environment Variables
Backend (appsettings.json):
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DoNow;Uid=username;Pwd=password;"
  },
  "JwtSettings": {
    "SecretKey": "your-secret-key",
    "ExpiryHours": 24
  }
}
```

Frontend (environment variables):
- Create `.env` file in frontend root
- Add API base URL and other configuration

## Common Issues and Solutions

### Backend
- **Migration Issues**: Drop and recreate database for development
- **JWT Problems**: Verify secret key and token configuration
- **CORS Issues**: Check allowed origins in startup configuration

### Frontend
- **Metro Bundler**: Clear cache with `expo start -c`
- **iOS Build**: Clean build folder and reinstall pods
- **Android Build**: Clean Gradle cache and rebuild

## Additional Resources

### Documentation
- [.NET Documentation](https://docs.microsoft.com/en-us/dotnet/)
- [React Native Documentation](https://reactnative.dev/)
- [Expo Documentation](https://docs.expo.dev/)
- [Entity Framework Core](https://docs.microsoft.com/en-us/ef/core/)

### Tools
- Visual Studio Code for frontend development
- Visual Studio or Rider for backend development
- Postman/Insomnia for API testing
- MySQL Workbench for database management