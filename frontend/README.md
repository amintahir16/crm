# Queen Hills Murree - Frontend

A comprehensive frontend application for Queen Hills Murree real estate project management system.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API URL

# Start development server
npm run dev
```

## 📚 Documentation

For complete documentation, see [DOCUMENTATION.md](./DOCUMENTATION.md)

## 🔧 Features

- **Responsive Design**: Mobile-first approach with tablet and desktop optimization
- **Authentication System**: JWT-based authentication with role-based access control
- **Dashboard System**: Comprehensive dashboard with real-time statistics
- **Lead Management**: Complete CRM interface for lead tracking and conversion
- **Customer Management**: Customer profiles, bookings, and relationship management
- **Plot Management**: Plot inventory, pricing, and interactive map
- **Financial Management**: Payment tracking, financial reports, and analytics
- **Team Management**: Team performance tracking and workload distribution
- **CSV Import**: Bulk lead import functionality
- **Real-time Updates**: Live dashboard statistics and notifications

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Context API
- **Authentication**: JWT token-based
- **Forms**: React Hook Form with validation
- **Charts**: Chart.js for data visualization
- **Maps**: Interactive plot map integration

## 📁 Project Structure

```
app/
├── auth/                    # Authentication pages
├── dashboard/               # Dashboard pages
│   ├── analytics/          # Analytics dashboard
│   ├── bookings/           # Booking management
│   ├── customers/          # Customer management
│   ├── finance/            # Financial management
│   ├── plots/              # Plot management
│   └── team/               # Team management
├── test-crm/               # CRM testing page
└── layout.tsx              # Root layout

components/
├── auth/                   # Authentication components
├── dashboard/              # Dashboard components
├── BookingForm.tsx         # Booking form
├── CSVUpload.tsx           # CSV upload component
└── InteractivePlotMap.tsx  # Plot map component

contexts/
└── AuthContext.tsx         # Authentication context

utils/
└── currency.ts             # Currency formatting utilities
```

## 🎨 Key Components

### Authentication
- **AuthLayout**: Layout wrapper for authentication pages
- **Login Form**: Email/password authentication with validation

### Dashboard
- **DashboardLayout**: Main dashboard layout with sidebar navigation
- **DashboardSidebar**: Navigation menu with role-based items
- **DashboardHeader**: User profile dropdown and notifications

### Business Components
- **BookingForm**: Booking creation form with plot selection
- **CSVUpload**: File upload component with validation
- **InteractivePlotMap**: Interactive plot map with selection
- **PaymentPlans**: Payment plan display with calculator

## 🔐 Authentication System

The authentication system uses React Context for state management:

```typescript
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (role: UserRole) => boolean;
  // ... other methods
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

## 📊 Dashboard Pages

### Main Dashboard (`/dashboard`)
- Overview statistics and recent activities
- Quick actions and performance metrics

### Analytics Dashboard (`/dashboard/analytics`)
- Sales analytics and lead conversion rates
- Team performance and financial metrics

### Lead Management (`/dashboard/customers/leads`)
- Lead list with filtering and search
- Lead details, editing, and communication history

### Customer Management (`/dashboard/customers`)
- Customer list with search functionality
- Customer profiles and booking history

### Plot Management (`/dashboard/plots`)
- Plot inventory with availability status
- Plot details, editing, and interactive map

### Financial Management (`/dashboard/finance`)
- Payment tracking and financial reports
- Expense management and revenue analytics

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm run start
```

### Vercel Deployment
```bash
npm i -g vercel
vercel --prod
```

## 🧪 Testing

### Manual Testing
Use the test CRM page (`/test-crm`) for:
- Backend connection testing
- Authentication testing
- API endpoint testing
- Feature validation

## 📱 Mobile Support

- **Responsive Breakpoints**: Mobile (< 768px), Tablet (768px - 1024px), Desktop (> 1024px)
- **Touch-friendly Interfaces**: Swipe gestures and mobile-optimized forms
- **Responsive Navigation**: Collapsible sidebar and mobile menu

## 🎨 Styling

- **Design System**: Consistent color palette and typography
- **Tailwind CSS**: Utility-first CSS framework
- **Responsive Design**: Mobile-first approach with adaptive layouts
- **Component Library**: Reusable UI components

## 🔒 Security

- **Client-side Security**: Input validation and XSS prevention
- **API Security**: JWT token authentication and role-based access
- **Secure Storage**: Token storage and session management

## 📞 Support

For technical support or questions, please contact the development team.

---

**Version:** 1.0.0  
**Last Updated:** October 13, 2025  
**Maintainer:** Queen Hills Development Team