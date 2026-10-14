import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { json } from 'express';
import { FirebaseProductModule } from './auth/firebase-product/firebase-product.module';

async function bootstrap() {
  // Dedicated auth server: no legacy JWT routes, Prisma, Redis or model startup.
  const app = await NestFactory.create(FirebaseProductModule, { bodyParser: false });
  app.use(json({ limit: '24kb' }));
  app.use(cookieParser());
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  await app.listen(Number(process.env.AUTH_PORT || 3001), '127.0.0.1');
}
bootstrap().catch(() => { console.error('Authentication server could not start. Check the local configuration.'); process.exitCode = 1; });
