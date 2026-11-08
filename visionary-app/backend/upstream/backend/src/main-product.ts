import { globalLogoutEnabled } from './auth/firebase-product/session-policy';
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { FirebaseProductModule } from './auth/firebase-product/firebase-product.module';
import { configureProductionHttp } from './platform/production-http';
import { productionRuntimeSettings, boundProductionHttp } from './platform/production-runtime';

export async function bootstrapProduct() {
  const app = await NestFactory.create(FirebaseProductModule, { bodyParser: false, forceCloseConnections: true });
  const config = app.get(ConfigService);
  const runtime = productionRuntimeSettings(config);
  configureProductionHttp(app, { publicRoot: config.get('PUBLIC_ROOT') || '/app/public', origin: config.get('AUTH_PUBLIC_ORIGIN'), trustedProxyHops: Number(config.get('AUTH_TRUST_PROXY_HOPS')), firebaseAuthDomain: config.get('FIREBASE_AUTH_DOMAIN'), releaseCommit: config.get('VISIONARY_RELEASE_COMMIT'), globalLogoutEnabled: globalLogoutEnabled(config.get('AUTH_GLOBAL_LOGOUT_ENABLED')) });
  app.enableShutdownHooks();
  boundProductionHttp(app.getHttpServer());
  await app.listen(runtime.port, '0.0.0.0');
  return app;
}
if (require.main === module) bootstrapProduct().catch(() => { console.error('Product server could not start. Verify reviewed production configuration.'); process.exitCode = 1; });
