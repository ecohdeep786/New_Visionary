import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { json, raw } from 'express';
import { FirebaseProductModule } from './auth/firebase-product/firebase-product.module';

async function bootstrap() {
  // Connected identity + test billing server; no legacy JWT/Prisma/model startup.
  const app = await NestFactory.create(FirebaseProductModule, { bodyParser: false });
  app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' }));
  app.use(json({ limit: '24kb' }));
  app.use(cookieParser());
  app.use((_req, res, next) => { res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  // Cloud Run supplies PORT; local development remains loopback-only.
  const managed = !!process.env.PORT;
  await app.listen(Number(process.env.PORT || process.env.AUTH_PORT || 3001), managed ? '0.0.0.0' : '127.0.0.1');
}
bootstrap().catch(() => { console.error('Authentication server could not start. Check the local configuration.'); process.exitCode = 1; });
