import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PlotsModule } from './plots/plots.module';
import { BookingsModule } from './bookings/bookings.module';
import { CustomersModule } from './customers/customers.module';
import { FinanceModule } from './finance/finance.module';
import { MarketingModule } from './marketing/marketing.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';
import { CrmModule } from './crm/crm.module';
import { ConstructionModule } from './construction/construction.module';
import { DocumentModule } from './documents/document.module';
import { CommunicationModule } from './communication/communication.module';
import { LeadsModule } from './leads/leads.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'development'
        ? ['.env.local', '.env']  // .env.local takes precedence if it exists
        : undefined,
    }),
    TypeOrmModule.forRoot({
      // Use SQLite for development, PostgreSQL for production
      // In development, always use SQLite regardless of DATABASE_URL
      // In production, use PostgreSQL if DATABASE_URL is set
      type: process.env.NODE_ENV === 'development'
        ? 'sqlite'
        : (process.env.DATABASE_URL &&
          (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'))
          ? 'postgres'
          : 'sqlite'),
      ...(process.env.NODE_ENV === 'development'
        ? {
          // Development: Always use SQLite
          database: 'queen-hills.db',
        }
        : (process.env.DATABASE_URL &&
          (process.env.DATABASE_URL.startsWith('postgresql://') || process.env.DATABASE_URL.startsWith('postgres://'))
          ? {
            // Production: Use PostgreSQL
            url: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false },
          }
          : {
            // Fallback: SQLite
            database: process.env.DATABASE_URL || 'queen-hills.db',
          })),
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development', // Enable in development to auto-create tables, disable in production
      logging: process.env.NODE_ENV === 'development',
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      migrationsRun: process.env.NODE_ENV === 'production',
    } as TypeOrmModuleOptions),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    AuthModule,
    UsersModule,
    PlotsModule,
    BookingsModule,
    CustomersModule,
    FinanceModule,
    MarketingModule,
    DashboardModule,
    HealthModule,
    AuditModule,
    CrmModule,
    ConstructionModule,
    DocumentModule,
    CommunicationModule,
    LeadsModule,
    AnalyticsModule,
    TasksModule,
  ],
})
export class AppModule { } 