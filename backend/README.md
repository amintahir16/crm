# Queen Hills Murree - Backend API

A comprehensive backend API for Queen Hills Murree real estate project management system.

## 🚀 Quick Start

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

## 📚 Documentation

For complete documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔧 Features

- **Authentication & Authorization**: JWT-based auth with role-based access control
- **Lead Management**: Complete CRM functionality for lead tracking and conversion
- **Customer Management**: Customer profiles, bookings, and relationship management
- **Plot Management**: Plot inventory, pricing, and availability tracking
- **Financial Management**: Payment plans, installments, and financial reporting
- **Dashboard Analytics**: Real-time statistics and performance metrics
- **Workflow Automation**: Automated lead assignment and status progression
- **CSV Import**: Bulk lead import functionality

## 🛠️ Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT with role-based permissions
- **File Upload**: Multer for CSV and document handling
- **Validation**: Class-validator and class-transformer
- **Testing**: Jest for unit and integration tests

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

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/profile` - Get user profile

### Leads
- `GET /api/v1/leads` - Get all leads
- `POST /api/v1/leads` - Create new lead
- `POST /api/v1/leads/import/csv` - Import leads from CSV
- `POST /api/v1/leads/workflow/process` - Process workflow automation

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/sales-manager` - Get sales manager dashboard

### Analytics
- `GET /api/v1/analytics/dashboard` - Dashboard analytics
- `GET /api/v1/analytics/sales` - Sales analytics
- `GET /api/v1/analytics/financial` - Financial analytics

## 🚀 Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start:prod
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📞 Support

For technical support or questions, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** October 13, 2025  
**Maintainer:** Queen Hills Development Team