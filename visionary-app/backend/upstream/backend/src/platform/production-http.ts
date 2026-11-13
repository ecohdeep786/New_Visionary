import { existsSync } from 'node:fs';
import { isAbsolute, join, extname } from 'node:path';
import { static as serveStatic, json, raw } from 'express';
import type { Request, Response, NextFunction } from 'express';
import * as cookieParser from 'cookie-parser';
import { AUTH_SESSION_POLICY_VERSION } from '../auth/firebase-product/session-policy';

type RequestTelemetry = {
  event: 'product.api.request';
  route: string;
  status: number;
  latencyMs: number;
};

// Separate production composition; the local auth entrypoint and its callers
// retain their current behavior. Proxy depth is explicit: one managed Cloud Run
// edge now; two only for a separately verified load-balancer deployment.
export function configureProductionHttp(app: any, options: {
  publicRoot: string;
  origin: string;
  trustedProxyHops: number;
  firebaseAuthDomain: string;
  releaseCommit: string;
  globalLogoutEnabled?: boolean;
  requestTelemetry?: (event: RequestTelemetry) => void;
}) {
  const url = new URL(options.origin);
  if (url.origin !== options.origin || url.protocol !== 'https:' || url.username || url.password || !isAbsolute(options.publicRoot) || !existsSync(join(options.publicRoot, 'index.html')) ||
      ![1, 2].includes(options.trustedProxyHops) || !/^[a-f0-9]{40}$/.test(options.releaseCommit) || !/^[a-z0-9.-]+$/.test(options.firebaseAuthDomain) || options.firebaseAuthDomain.includes('..')) throw Error('Production HTTP configuration is incomplete.');
  app.getHttpAdapter().getInstance().set('trust proxy', options.trustedProxyHops);
  const emit = options.requestTelemetry;
  if (emit) {
    app.use('/api', (req: Request, res: Response, next: NextFunction) => {
      const start = performance.now();
      res.once('finish', () => {
        // Express assigns route.path from the registered server route. It is
        // separate from the raw URL and its parameter values.
        const template: unknown = req.route?.path;
        const route = typeof template === 'string' && /^\/api\/[A-Za-z0-9_:/-]{1,120}$/.test(template)
          ? template
          : 'unclassified';
        const latencyMs = Math.min(3_600_000, Math.round(performance.now() - start));
        try {
          emit({ event: 'product.api.request', route, status: res.statusCode, latencyMs });
        } catch {
          // A sink outage must never interrupt product traffic.
        }
      });
      next();
    });
  }
  const csp = ["default-src 'self'", "base-uri 'self'", "object-src 'none'", "frame-ancestors 'none'", "form-action 'self'", "manifest-src 'self'", "img-src 'self' data: https://storage.googleapis.com", "font-src 'self'", "style-src 'self' 'unsafe-inline'", "script-src 'self' https://apis.google.com https://checkout.razorpay.com https://cdn.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/", `frame-src https://${options.firebaseAuthDomain} https://api.razorpay.com https://checkout.razorpay.com https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/`, `connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://${options.firebaseAuthDomain} https://api.razorpay.com https://checkout.razorpay.com https://lumberjack.razorpay.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/`].join('; ');
  app.use((_req: any, res: any, next: any) => {
    res.setHeader('X-Visionary-Revision', options.releaseCommit);
    res.set({ 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'strict-origin-when-cross-origin', 'Permissions-Policy': 'camera=(), geolocation=(), microphone=()', 'Cross-Origin-Opener-Policy': 'same-origin-allow-popups', 'Cross-Origin-Resource-Policy': 'same-origin', 'Content-Security-Policy': csp, 'Strict-Transport-Security': 'max-age=31536000' }); next();
  });
  app.use('/api/billing/webhooks/razorpay', raw({ type: 'application/json', limit: '256kb' }));
  app.use(json({ limit: '24kb' })); app.use(cookieParser());
  const authPolicy = { version: AUTH_SESSION_POLICY_VERSION, globalSignOut: options.globalLogoutEnabled === true };
  const health = (req: any, res: any, next: any) => ['GET', 'HEAD'].includes(req.method) && req.path === '/' ? res.status(200).json({ status: 'ok', authPolicy }) : next();
  // Keep the container-local probe and expose an API probe for hosted checks.
  app.use('/healthz', health);
  app.use('/api/health', health);
  // The edge load balancer routes only this exact path to the candidate NEG.
  // Keeping a dedicated handler avoids rewriting arbitrary paths into health.
  app.getHttpAdapter().getInstance().get('/__deploy-check', (req: any, res: any) => {
    const forwardedFor = String(req.get('X-Forwarded-For') || '').split(',').map((value: string) => value.trim());
    // The external load balancer must overwrite this caller-controlled probe
    // value before the application trusts proxy metadata.
    res.status(200).json({ status: 'ok', authPolicy, forwardedForSanitized: !forwardedFor.includes('198.51.100.99') });
  });
  const files = serveStatic(options.publicRoot, { index: false, dotfiles: 'deny', fallthrough: true, setHeaders(res, file) { res.setHeader('Cache-Control', file.includes(`${join(options.publicRoot, 'assets')}`) ? 'public, max-age=31536000, immutable' : 'no-cache'); } });
  app.use((req: any, res: any, next: any) => {
    // Unknown /api paths must remain JSON errors, never the SPA HTML document.
    if (req.path === '/api' || req.path.startsWith('/api/') || !['GET', 'HEAD'].includes(req.method)) return next();
    // Dotfiles denied by static serving must not fall through into SPA success.
    let decodedPath: string;
    try { decodedPath = decodeURIComponent(req.path); } catch { return res.status(400).end(); }
    if (decodedPath.split('/').some(part => part.startsWith('.'))) return res.status(404).end();
    files(req, res, () => {
      if (extname(req.path)) return res.status(404).end();
      res.setHeader('Cache-Control', 'no-cache'); res.sendFile(join(options.publicRoot, 'index.html'));
    });
  });
  app.setGlobalPrefix('api');
}
