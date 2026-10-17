import { ConflictException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';
import { FirebaseProductService } from './firebase-product.service';

// Shared by account and billing controllers. Browser identity is always reverified.
export class ProductRequestAuthority {
  constructor(protected readonly service: FirebaseProductService, protected readonly config: ConfigService) {}
  protected settings() {
    const origin = this.config.get<string>('AUTH_PUBLIC_ORIGIN') || 'http://localhost:5173';
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new ServiceUnavailableException('Set the exact public application origin.');
    const secure = url.protocol === 'https:';
    if (!secure && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new ServiceUnavailableException('Live authentication requires HTTPS.');
    if (this.config.get('NODE_ENV') === 'production' && !secure) throw new ServiceUnavailableException('Production authentication requires HTTPS.');
    const prefix = secure ? '__Host-visionary-' : 'visionary-';
    return { origin, secure, session: `${prefix}session`, device: `${prefix}device`, csrf: `${prefix}csrf` };
  }
  protected options() { return { httpOnly: true, secure: this.settings().secure, sameSite: 'strict' as const, path: '/' }; }
  protected csrf(req: Request) {
    const settings = this.settings(), cookie = req.cookies?.[settings.csrf], header = req.get('X-CSRF-Token');
    if (req.get('Origin') !== settings.origin || typeof cookie !== 'string' || typeof header !== 'string' || !/^[a-f0-9]{64}$/.test(header) || cookie.length !== header.length || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) throw new ForbiddenException('Reload this page before continuing.');
  }
  protected current(req: Request, touch = true) { const settings = this.settings(); return this.service.authenticate(req.cookies?.[settings.session], req.cookies?.[settings.device], touch); }
  protected async commandAccount(req: Request, touch = true) {
    const current = await this.current(req, touch);
    if (req.get('X-Visionary-Account') !== current.uid) throw new ConflictException('The signed-in account changed. Reload your account before saving.');
    return current;
  }
}
