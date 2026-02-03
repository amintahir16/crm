import { registerAs } from '@nestjs/config';

export default registerAs('production', () => ({
  // Database configuration
  database: {
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: false, // Never use true in production
    migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
    migrationsRun: true,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    logging: false,
    maxQueryExecutionTime: 1000,
    cache: {
      type: 'redis',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD,
    },
  },

  // JWT configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },

  // CORS configuration
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },

  // Rate limiting
  throttling: {
    ttl: parseInt(process.env.THROTTLE_TTL) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT) || 100,
  },

  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
    uploadPath: process.env.UPLOAD_PATH || './uploads',
  },

  // Email configuration
  email: {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },

  // SMS configuration
  sms: {
    apiKey: process.env.SMS_API_KEY,
    senderId: process.env.SMS_SENDER_ID,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/app.log',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
    sessionSecret: process.env.SESSION_SECRET,
  },

  // Monitoring
  monitoring: {
    enabled: process.env.ENABLE_METRICS === 'true',
    port: parseInt(process.env.METRICS_PORT) || 9090,
  },
}));
