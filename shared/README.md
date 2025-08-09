# Shared Resources

Common types, utilities, and configurations shared between frontend and backend.

## 📁 Structure

```
shared/
└── types/          # TypeScript type definitions
```

## 🔧 Purpose

This directory contains resources that are used by multiple parts of the application:

### Types (`types/`)
- **API Response Types** - Standardized response formats
- **Data Models** - Common data structures
- **Utility Types** - Reusable TypeScript types

### Usage Examples

```typescript
// Example API response type
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Example shared data model
interface User {
  id: number;
  username: string;
  role: 'USER' | 'GROUP_MANAGER' | 'ADMIN';
}
```

## 🔗 Integration

### Frontend Usage
```typescript
import { User, ApiResponse } from '../shared/types';
```

### Backend Usage
Types serve as documentation for API contracts and response formats.

## 🚀 Future Enhancements

- Validation schemas
- Common utilities
- Configuration constants
- Shared business logic helpers