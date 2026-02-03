# Queen Hills Murree - Backend Documentation

## Overview

This is the backend API for Queen Hills Murree, a comprehensive CRM system for real estate plot sales and management. Built with NestJS, TypeScript, and PostgreSQL.

## 🚀 Quick Start

### Prerequisites
- Node.js v18.17.1 or higher
- PostgreSQL database
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Run database migrations
npm run migration:run

# Start development server
npm run start:dev
```

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/queenhills

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h

# Server
PORT=3001
NODE_ENV=development
```

## 📁 Project Structure

```
src/
├── analytics/          # Analytics and reporting
├── auth/               # Authentication & authorization
├── bookings/           # Booking management
├── communication/      # Notifications & messaging
├── construction/       # Construction project management
├── customers/          # Customer management
├── dashboard/          # Dashboard APIs
├── finance/           # Payment & financial management
├── leads/             # Lead management & CRM
├── plots/             # Plot management
├── tasks/             # Background tasks & scheduling
├── users/             # User management
└── main.ts            # Application entry point
```

## 🔧 Core Features

### 1. Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Permission-based guards
- User session management

**Roles:**
- `admin` - Full system access
- `sales_manager` - Sales team management
- `sales_person` - Lead management
- `accountant` - Financial management
- `investor` - Investment tracking
- `buyer` - Customer portal
- `auditor` - Audit access

### 2. Lead Management (CRM)
- Lead import from CSV
- Automatic lead assignment
- Lead status workflow automation
- Communication tracking
- Lead conversion to customers

**Lead Statuses:**
- `new` - Newly imported lead
- `contacted` - Initial contact made
- `qualified` - Lead qualified
- `interested` - Expressed interest
- `converted` - Converted to customer
- `lost` - Lead lost

### 3. Customer Management
- Customer profile management
- Booking creation
- Payment plan assignment
- Document management

### 4. Plot Management
- Plot inventory tracking
- Plot status management
- Plot pricing and details
- Plot map integration

**Plot Statuses:**
- `available` - Available for sale
- `reserved` - Reserved by customer
- `sold` - Sold
- `transferred` - Ownership transferred

### 5. Financial Management
- Payment plans
- Installment tracking
- Payment schedules
- Financial reporting
- Late fee calculation

### 6. Dashboard & Analytics
- Real-time dashboard statistics
- Sales performance metrics
- Team performance tracking
- Financial analytics
- Lead conversion analytics

### 7. Workflow Automation
- Automatic lead assignment
- Status progression automation
- Follow-up reminders
- Overdue notifications
- Daily reports

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `GET /api/v1/auth/profile` - Get user profile

### Leads
- `GET /api/v1/leads` - Get all leads
- `POST /api/v1/leads` - Create new lead
- `GET /api/v1/leads/:id` - Get lead by ID
- `PUT /api/v1/leads/:id` - Update lead
- `DELETE /api/v1/leads/:id` - Delete lead
- `POST /api/v1/leads/:id/convert` - Convert lead to customer
- `POST /api/v1/leads/import/csv` - Import leads from CSV
- `POST /api/v1/leads/workflow/process` - Process workflow automation

### Customers
- `GET /api/v1/customers` - Get all customers
- `POST /api/v1/customers` - Create new customer
- `GET /api/v1/customers/:id` - Get customer by ID
- `PUT /api/v1/customers/:id` - Update customer

### Plots
- `GET /api/v1/plots` - Get all plots
- `POST /api/v1/plots` - Create new plot
- `GET /api/v1/plots/:id` - Get plot by ID
- `PUT /api/v1/plots/:id` - Update plot

### Bookings
- `GET /api/v1/bookings` - Get all bookings
- `POST /api/v1/bookings` - Create new booking
- `GET /api/v1/bookings/:id` - Get booking by ID
- `PUT /api/v1/bookings/:id` - Update booking

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/sales-manager` - Get sales manager dashboard

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/sales` - Sales analytics
- `GET /api/v1/analytics/financial` - Financial analytics

## 🗄️ Database Schema

### Core Entities

**Users**
- User management with roles and permissions
- Workload tracking for sales agents
- Activity logging

**Leads**
- Lead information and status tracking
- Assignment to sales agents
- Communication history

**Customers**
- Customer profiles and contact information
- Booking history
- Payment records

**Plots**
- Plot details and specifications
- Pricing and availability
- Location information

**Bookings**
- Booking details and terms
- Payment plan assignment
- Status tracking

**Payments**
- Payment records and schedules
- Installment tracking
- Late fee management

## 🔄 Workflow Automation

### Lead Assignment
- Automatic assignment based on workload
- Round-robin distribution
- Workload balancing

### Status Progression
- Automated status transitions
- Follow-up scheduling
- Overdue detection

### Notifications
- Follow-up reminders
- Overdue alerts
- Status change notifications
- Daily reports

## 🚀 Deployment

### Production Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

### Docker Deployment

```bash
# Build Docker image
docker build -t queenhills-backend .

# Run container
docker run -p 3001:3001 queenhills-backend
```

### Environment Configuration

**Production Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://username:password@host:port/database
JWT_SECRET=production-secret-key
PORT=3001
```

## 🧪 Testing

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### API Testing

Use the provided Postman collection or test endpoints directly:

```bash
# Health check
curl http://localhost:3001/api/v1/health

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@queenhills.com","password":"admin123"}'
```

## 📊 Monitoring & Logging

### Health Checks
- `GET /api/v1/health` - Application health status
- Database connectivity check
- Service status monitoring

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Performance monitoring

## 🔒 Security

### Authentication
- JWT token-based authentication
- Token expiration handling
- Refresh token support

### Authorization
- Role-based access control
- Permission-based guards
- Route protection

### Data Protection
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

## 🛠️ Development

### Code Style
- TypeScript strict mode
- ESLint configuration
- Prettier formatting
- Husky pre-commit hooks

### Database Migrations

```bash
# Generate migration
npm run migration:generate -- -n MigrationName

# Run migrations
npm run migration:run

# Revert migration
npm run migration:revert
```

### Adding New Features

1. Create entity in appropriate module
2. Add service methods
3. Create controller endpoints
4. Add validation DTOs
5. Update documentation

## 📈 Performance

### Optimization
- Database query optimization
- Caching strategies
- Connection pooling
- Response compression

### Scaling
- Horizontal scaling support
- Load balancer compatibility
- Database replication
- Microservices architecture

## 🐛 Troubleshooting

### Common Issues

**Database Connection Issues:**
- Check DATABASE_URL format
- Verify database server is running
- Check network connectivity

**Authentication Issues:**
- Verify JWT_SECRET is set
- Check token expiration
- Validate user permissions

**Import Issues:**
- Check file format (CSV)
- Verify column headers
- Check file size limits

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run start:dev
```

## 📞 Support

For technical support or questions:
- Check the logs for error details
- Review API documentation
- Contact the development team

## 📝 Changelog

### Version 1.0.0
- Initial release
- Core CRM functionality
- Lead management
- Customer management
- Plot management
- Payment system
- Dashboard analytics
- Workflow automation

---

**Last Updated:** October 13, 2025
**Version:** 1.0.0
**Maintainer:** Queen Hills Development Team
