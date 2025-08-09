# Backend - Django REST API

Django REST Framework backend for the Family Finance System.

## 🔧 Technology Stack

- **Django 4.2** - Web framework
- **Django REST Framework** - API development
- **SQLite** - Development database
- **PostgreSQL** - Production database (Railway)
- **JWT Authentication** - Secure user authentication

## 📁 Project Structure

```
backend-django/
├── apps/                 # Django applications
│   ├── users/           # User management and authentication
│   ├── groups/          # Group management 
│   ├── events/          # Activity/event management
│   ├── expenses/        # Expense tracking and splitting
│   └── categories/      # Expense categories
├── family_finance/      # Main Django project
│   ├── settings/        # Environment-specific settings
│   ├── urls.py         # URL routing
│   └── wsgi.py         # WSGI configuration
├── requirements.txt     # Python dependencies
├── railway.json        # Railway deployment config
└── Dockerfile          # Docker containerization
```

## 🚀 Development

### Prerequisites
- Python 3.9+
- pip
- Virtual environment (recommended)

### Setup
```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start development server
python manage.py runserver
```

## 🏗️ Architecture

### Apps Overview

#### Users (`apps/users/`)
- User authentication and profiles
- JWT token management
- User preferences (theme, currency)
- Role-based permissions (USER, GROUP_MANAGER, ADMIN)

#### Groups (`apps/groups/`)
- Group creation and management
- Member management with roles
- Group-based permissions

#### Events (`apps/events/`)
- Activity/event creation
- Participant management
- Event lifecycle (active/closed)
- Cross-group event support

#### Expenses (`apps/expenses/`)
- Expense tracking
- Automatic and manual expense splitting
- Settlement calculations
- Integration with events

#### Categories (`apps/categories/`)
- Expense categorization
- Budget tracking by category

### Database Models

Key relationships:
- Users belong to Groups with specific roles
- Events can have participants from multiple groups
- Expenses are linked to Events and can be split among participants
- Categories organize expenses for reporting

## 🔐 Authentication & Permissions

### JWT Authentication
- Login: `POST /api/auth/login/`
- Token refresh: `POST /api/auth/refresh/`
- User info: `GET /api/users/me/`

### Permission Levels
- **USER** - Basic member permissions
- **GROUP_MANAGER** - Can manage group and create events
- **ADMIN** - System-wide administrative access

## 📊 API Endpoints

### Core Resources
- `/api/users/` - User management
- `/api/groups/` - Group operations
- `/api/events/` - Event/activity management
- `/api/expenses/` - Expense tracking
- `/api/categories/` - Category management

### Advanced Features
- Expense splitting algorithms
- Activity participant management
- Financial reporting and statistics
- User preference management

## 🚀 Deployment

### Production (Railway)
- PostgreSQL database
- Automatic deployments from Git
- Environment variable configuration
- Static file serving

### Docker Support
```bash
docker build -t family-finance-backend .
docker run -p 8000:8000 family-finance-backend
```

## 🧪 Testing

```bash
# Run all tests
python manage.py test

# Run specific app tests
python manage.py test apps.users
```

## 📈 Performance

- Database query optimization
- Pagination for large datasets
- Efficient serialization
- Caching strategies for frequent queries

## 🔧 Configuration

### Environment Variables
- `DEBUG` - Development mode
- `SECRET_KEY` - Django secret key
- `DATABASE_URL` - Production database
- `ALLOWED_HOSTS` - Permitted hosts

### Settings Structure
- `base.py` - Common settings
- `development.py` - Development-specific
- `production.py` - Production-specific