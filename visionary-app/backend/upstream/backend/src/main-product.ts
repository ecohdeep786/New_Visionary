import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FirebaseProductModule } from './auth/firebase-product/firebase-product.module';
import { configureProductionHttp } from './platform/production-http';

export async function bootstrapProduct() {
  const app = await NestFactory.create(FirebaseProductModule, { bodyParser: false });
  const config = app.get(ConfigService);
  if (config.get('NODE_ENV') !== 'production' || typeof config.get('AUTH_RATE_LIMIT_KEY') !== 'string' || config.get<string>('AUTH_RATE_LIMIT_KEY').length < 32 || !config.get('FIREBASE_PROJECT_ID') || !config.get('FIRESTORE_DATABASE_ID')) throw Error('Production account configuration is incomplete.');
  configureProductionHttp(app, { publicRoot: config.get('PUBLIC_ROOT') || '/app/public', origin: config.get('AUTH_PUBLIC_ORIGIN'), trustedProxyHops: Number(config.get('AUTH_TRUST_PROXY_HOPS')), firebaseAuthDomain: config.get('FIREBASE_AUTH_DOMAIN'), releaseCommit: config.get('VISIONARY_RELEASE_COMMIT') });
  app.enableShutdownHooks();
  await app.listen(Number(config.get('PORT') || 8080), '0.0.0.0');
  return app;
}
if (require.main === module) bootstrapProduct().catch(() => { console.error('Product server could not start. Verify reviewed production configuration.'); process.exitCode = 1; });
