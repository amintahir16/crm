# Queen Hills Murree - Frontend Documentation

## Overview

This is the frontend application for Queen Hills Murree, a comprehensive CRM system for real estate plot sales and management. Built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites
- Node.js v18.17.1 or higher
- npm or yarn
- Backend API running on port 3001

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1

# App Configuration
NEXT_PUBLIC_APP_NAME=Queen Hills Murree
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## 📁 Project Structure

```
app/
├── auth/                    # Authentication pages
│   └── login/
├── dashboard/               # Dashboard pages
│   ├── analytics/          # Analytics dashboard
│   ├── bookings/           # Booking management
│   ├── construction/       # Construction management
│   ├── customers/          # Customer management
│   ├── documents/          # Document management
│   ├── finance/            # Financial management
│   ├── lead-automation/    # Lead automation
│   ├── plots/              # Plot management
│   ├── sales/              # Sales dashboard
│   └── team/               # Team management
├── test-crm/               # CRM testing page
├── globals.css             # Global styles
├── layout.tsx              # Root layout
└── page.tsx                # Home page

components/
├── auth/                   # Authentication components
├── dashboard/              # Dashboard components
├── BookingForm.tsx         # Booking form
├── CSVUpload.tsx           # CSV upload component
├── InteractivePlotMap.tsx  # Plot map component
└── PaymentPlans.tsx        # Payment plans component

contexts/
└── AuthContext.tsx         # Authentication context

utils/
└── currency.ts             # Currency formatting utilities
```

## 🎨 UI Components

### Authentication Components

**AuthLayout**
- Layout wrapper for authentication pages
- Responsive design
- Branding integration

**Login Form**
- Email/password authentication
- Form validation
- Error handling
- Remember me functionality

### Dashboard Components

**DashboardLayout**
- Main dashboard layout
- Sidebar navigation
- Header with user info
- Responsive design

**DashboardSidebar**
- Navigation menu
- Role-based menu items
- Active state indicators
- Collapsible design

**DashboardHeader**
- User profile dropdown
- Notifications
- Quick actions
- Search functionality

### Business Components

**BookingForm**
- Booking creation form
- Plot selection
- Payment plan selection
- Form validation

**CSVUpload**
- File upload component
- CSV validation
- Progress indicator
- Error handling

**InteractivePlotMap**
- Interactive plot map
- Plot selection
- Status indicators
- Zoom controls

**PaymentPlans**
- Payment plan display
- Installment breakdown
- Terms and conditions
- Calculator

## 🔐 Authentication System

### AuthContext

The authentication system uses React Context for state management:

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isSalesManager: () => boolean;
  isSalesPerson: () => boolean;
  canAccessCRM: () => boolean;
  getDefaultDashboard: () => string;
}
```

### User Roles

- `admin` - Full system access
- `sales_manager` - Sales team management
- `sales_person` - Lead management
- `accountant` - Financial management
- `investor` - Investment tracking
- `buyer` - Customer portal
- `auditor` - Audit access

### Route Protection

Routes are protected based on user roles:

```typescript
// Example: Sales manager only route
if (!user || !hasRole('sales_manager')) {
  router.push('/auth/login');
  return;
}
```

## 📊 Dashboard Pages

### Main Dashboard (`/dashboard`)
- Overview statistics
- Recent activities
- Quick actions
- Performance metrics

### Analytics Dashboard (`/dashboard/analytics`)
- Sales analytics
- Lead conversion rates
- Team performance
- Financial metrics

### Lead Management (`/dashboard/customers/leads`)
- Lead list and filtering
- Lead details and editing
- Communication history
- Status management

### Customer Management (`/dashboard/customers`)
- Customer list and search
- Customer profiles
- Booking history
- Payment records

### Plot Management (`/dashboard/plots`)
- Plot inventory
- Plot details and editing
- Availability status
- Interactive map

### Booking Management (`/dashboard/bookings`)
- Booking list and status
- Booking creation
- Payment tracking
- Document management

### Financial Management (`/dashboard/finance`)
- Payment tracking
- Financial reports
- Expense management
- Revenue analytics

### Team Management (`/dashboard/team`)
- Team member list
- Performance tracking
- Activity monitoring
- Workload distribution

## 🎯 Key Features

### 1. Responsive Design
- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interfaces
- Adaptive layouts

### 2. Real-time Updates
- Live dashboard statistics
- Real-time notifications
- Status updates
- Activity feeds

### 3. Data Visualization
- Charts and graphs
- Interactive maps
- Progress indicators
- Performance metrics

### 4. Form Management
- Comprehensive form validation
- Error handling
- Success feedback
- Auto-save functionality

### 5. File Management
- CSV import/export
- Document upload
- Image handling
- File validation

## 🔧 Configuration

### Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  images: {
    domains: ['localhost', 'vercel.app', 'railway.app'],
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
  output: 'standalone',
  compress: true,
};

module.exports = nextConfig;
```

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
    },
  },
  plugins: [],
};
```

## 🚀 Deployment

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

### Production Deployment

**Vercel Deployment:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Docker Deployment:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Configuration

**Production Environment Variables:**
```env
NEXT_PUBLIC_API_URL=https://api.queenhillsmurree.com/api/v1
NEXT_PUBLIC_APP_NAME=Queen Hills Murree
NEXT_PUBLIC_APP_URL=https://queenhillsmurree.com
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

### Manual Testing

Use the test CRM page (`/test-crm`) for:
- Backend connection testing
- Authentication testing
- API endpoint testing
- Feature validation

## 📱 Mobile Support

### Responsive Breakpoints
- Mobile: < 768px
- Tablet: 768px - 1024px
- Desktop: > 1024px

### Mobile Features
- Touch-friendly interfaces
- Swipe gestures
- Mobile-optimized forms
- Responsive navigation

## 🎨 Styling

### Design System
- Consistent color palette
- Typography scale
- Spacing system
- Component library

### CSS Architecture
- Tailwind CSS for utility classes
- CSS Modules for component styles
- Global styles for base elements
- Responsive design patterns

## 🔒 Security

### Client-side Security
- Input validation
- XSS prevention
- CSRF protection
- Secure token storage

### API Security
- JWT token authentication
- Role-based access control
- Request validation
- Error handling

## 🐛 Troubleshooting

### Common Issues

**Build Issues:**
- Check Node.js version compatibility
- Clear node_modules and reinstall
- Verify environment variables

**Runtime Issues:**
- Check browser console for errors
- Verify API connectivity
- Check authentication status

**Performance Issues:**
- Enable Next.js optimizations
- Use dynamic imports
- Optimize images and assets

### Debug Mode

```bash
# Enable debug logging
DEBUG=* npm run dev
```

## 📈 Performance

### Optimization Strategies
- Code splitting
- Image optimization
- Lazy loading
- Caching strategies

### Performance Monitoring
- Core Web Vitals
- Bundle size analysis
- Runtime performance
- User experience metrics

## 🔄 State Management

### Context API
- Authentication state
- User preferences
- Theme settings
- Global notifications

### Local State
- Form state
- Component state
- UI state
- Temporary data

## 📞 Support

For technical support or questions:
- Check the browser console for errors
- Review the API documentation
- Contact the development team

## 📝 Changelog

### Version 1.0.0
- Initial release
- Complete dashboard system
- Authentication system
- Lead management interface
- Customer management interface
- Plot management interface
- Booking management interface
- Financial management interface
- Team management interface
- Responsive design
- Mobile support

---

**Last Updated:** October 13, 2025
**Version:** 1.0.0
**Maintainer:** Queen Hills Development Team
