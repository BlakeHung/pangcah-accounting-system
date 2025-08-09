# Frontend - React Application

React + TypeScript frontend for the Family Finance System.

## 🔧 Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **CSS Modules** - Component-scoped styling

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   ├── contexts/        # React contexts for state management
│   ├── pages/          # Page components
│   └── App.tsx         # Main application component
├── package.json        # Dependencies and scripts
└── vercel.json        # Deployment configuration
```

## 🚀 Development

### Prerequisites
- Node.js 16+
- npm or yarn

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
```

## 📱 Key Features

- **Responsive Design** - Mobile-first approach
- **User Authentication** - JWT-based login system
- **Dashboard** - Financial overview with charts
- **Expense Management** - Create and track expenses
- **Activity Management** - Group activities and events
- **Real-time Notifications** - Snackbar system for user feedback

## 🎨 UI Components

### Core Components
- `Layout.tsx` - Main application layout with navigation
- `Snackbar.tsx` - Toast notifications
- Page-specific components in `/pages`

### Styling Convention
- CSS modules for component styles
- Consistent color scheme and spacing
- Mobile-responsive breakpoints

## 🔗 API Integration

The frontend communicates with the Django backend via REST API:
- Base URL: `/api/`
- Authentication: Bearer JWT tokens
- Error handling with user-friendly messages

## 🚀 Deployment

Configured for deployment on Vercel:
- Automatic builds from Git push
- Environment variable management
- Production optimization