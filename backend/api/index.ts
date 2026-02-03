import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';

export default async function handler(req: any, res: any) {
  const app = await NestFactory.create(AppModule);
  await app.init();
  
  // Handle the request
  app.getHttpAdapter().getInstance()(req, res);
}
