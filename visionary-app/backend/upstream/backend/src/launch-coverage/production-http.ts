import { existsSync } from 'node:fs';
import { isAbsolute, join, extname } from 'node:path';
import { static as serveStatic, json, raw } from 'express';
import * as cookieParser from 'cookie-parser';

// Separate production composition; the local auth entrypoint and its callers
// retain their current behavior. Proxy depth is explicit: one managed Cloud Run
// edge now; two only for a separately verified load-balancer deployment.
export function configureProductionHttp(app: any, options: { publicRoot: string; origin: string; trustedProxyHops: number; firebaseAuthDomain: string }) {
  const url = new URL(options.origin);
  if (url.origin !== options.origin || url.protocol !== 'https:' || url.username || url.password || !isAbsolute(options.publicRoot) || !existsSync(join(options.publicRoot, 'index.html')) ||
      ![1, 2].includes(options.trustedProxyHops) || !/^[a-z0-9.-]+$/.test(options.firebaseAuthDomain) || options.firebaseAuthDomain.includes('..')) throw Error('Production HTTP configuration is incomplete.');
  app.getHttpAdapter().getInstance().set('trust proxy', options.trustedProxyHops);
  app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' }));
  app.use(json({ limit: '24kb' })); app.use(cookieParser());
  const csp = ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'", "manifest-src 'self'", "img-src 'self' data: https://storage.googleapis.com", "font-src 'self'", "style-src 'self' 'unsafe-inline'", "script-src 'self' https://apis.google.com https://checkout.razorpay.com https://cdn.razorpay.com", `frame-src https://${options.firebaseAuthDomain} https://api.razorpay.com https://checkout.razorpay.com`, `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://${options.firebaseAuthDomain} https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com`].join('; ');
  app.use((_req: any, res: any, next: any) => {
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), geolocation=(), microphone=()', 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': csp, 'Strict-Transport-Security': 'max-age=31536000' }); next();
  });
  const health = (req: any, res: any, next: any) => ['GET', 'HEAD'].includes(req.method) && req.path === '/' ? res.status(200).json({ status: 'ok' }) : next();
  // Keep the container-local probe and expose an API probe for hosted checks.
  app.use('/healthz', health);
  app.use('/api/health', health);
  const files = serveStatic(options.publicRoot, { index: false, dotfiles: 'deny', fallthrough: true, setHeaders(res, file) { res.setHeader('Cache-Control', file.includes(`${join(options.publicRoot, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache'); } });
  app.use((req: any, res: any, next: any) => {
    // Unknown /api paths must remain JSON errors, never the SPA HTML document.
    if (req.path === '/api' || req.path.startsWith('/api/') || !['GET', 'HEAD'].includes(req.method)) return next();
    files(req, res, () => {
      if (extname(req.path)) return res.status(404).end();
      res.setHeader('Cache-Control', 'no-cache'); res.sendFile(join(options.publicRoot, 'index.html'));
    });
  });
  app.setGlobalPrefix('api');
}
