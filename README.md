# Queen Hills Murree - Real Estate Management Platform

A comprehensive real estate management platform with a marketing site and internal accounting & finance suite.

## 🏗️ Project Structure

```
queen-hills-murree/
├── backend/                 # NestJS API
│   ├── src/
│   │   ├── auth/           # Authentication module
│   │   ├── users/          # User management
│   │   ├── plots/          # Plot inventory
│   │   ├── bookings/       # Booking system
│   │   ├── customers/      # Customer management
│   │   ├── finance/        # Financial operations
│   │   ├── marketing/      # Marketing assets
│   │   └── common/         # Shared entities
│   └── package.json
├── frontend/               # Next.js Marketing Site
│   ├── app/               # App router pages
│   ├── components/        # React components
│   └── package.json
├── marketing_assets/       # Marketing materials
│   ├── logos/            # Logo variations
│   ├── videos/           # Marketing videos
│   └── images/           # Site photos
└── package.json           # Root package.json
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd queen-hills-murree
```

2. **Install all dependencies**
```bash
npm run install:all
```

3. **Setup the database**
```bash
npm run setup:db
```

4. **Start development servers**
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- API Documentation: http://localhost:3001/api/docs

## 🛠️ Development

### Backend Development
```bash
cd backend
npm run start:dev
```

### Frontend Development
```bash
cd frontend
npm run dev
```

### Database Management
```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Reset database
npm run db:reset
```

## 📊 Features

### Marketing Site
- ✅ Hero section with video background
- ✅ Interactive plot map
- ✅ Payment plans display
- ✅ Booking form
- ✅ Gallery & testimonials
- ✅ Mobile-responsive design

### Backend API
- ✅ User authentication & authorization
- ✅ Plot management
- ✅ Booking system
- ✅ Customer management
- ✅ Financial operations
- ✅ Marketing assets API

### Database
- ✅ SQLite for development
- ✅ PostgreSQL ready for production
- ✅ Entity relationships
- ✅ Audit logging

## 🎨 Marketing Assets

The project includes marketing assets in the `marketing_assets/` directory:

- **Videos**: Marketing video with background music
- **Images**: Site views and landscape photos
- **Logos**: Multiple logo variations (pending finalization)
- **Pricing**: Payment plan information

## 🔧 Configuration

### Environment Variables

Create `.env` files in both `backend/` and `frontend/` directories:

**Backend (.env)**
```env
NODE_ENV=development
PORT=3001
DATABASE_URL=queen-hills.db
JWT_SECRET=your-jwt-secret
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## 📝 API Documentation

Once the backend is running, visit:
- Swagger UI: http://localhost:3001/api/docs
- API Base URL: http://localhost:3001/api/v1

## 🧪 Testing

```bash
# Run all tests
npm run test

# Run backend tests
npm run test:backend

# Run frontend tests
npm run test:frontend
```

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm run start
```

## 📋 Roadmap

### Phase 1: MVP (90 Days) ✅
- [x] Project setup
- [x] Basic API structure
- [x] Marketing site components
- [x] Database entities
- [ ] Authentication system
- [ ] Plot management
- [ ] Booking system
- [ ] Payment integration

### Phase 2: Beta (6 Months)
- [ ] Advanced features
- [ ] Mobile app
- [ ] Enterprise features

### Phase 3: General Availability
- [ ] Performance optimization
- [ ] Advanced monitoring
- [ ] Market expansion

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Email: support@queenhills.com
- Phone: +92 XXX XXX XXXX

---

**Queen Hills Murree** - Your Dream Home in the Hills 🏔️ 