import { Controller, Get, Post, Patch, Req, Res, Body, ForbiddenException, ServiceUnavailableException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Request, Response } from 'express';
import { FirebaseProductService } from './firebase-product.service';

@Controller('auth')
export class FirebaseProductController {
  constructor(private readonly service: FirebaseProductService, private readonly config: ConfigService) {}
  private settings() {
    const origin = this.config.get<string>('AUTH_PUBLIC_ORIGIN') || 'http://localhost:5173';
    const url = new URL(origin);
    if (url.origin !== origin || !['http:', 'https:'].includes(url.protocol)) throw new ServiceUnavailableException('Set the exact public application origin.');
    const secure = url.protocol === 'https:';
    if (!secure && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new ServiceUnavailableException('Live authentication requires HTTPS.');
    if (this.config.get('NODE_ENV') === 'production' && !secure) throw new ServiceUnavailableException('Production authentication requires HTTPS.');
    const prefix = secure ? '__Host-visionary-' : 'visionary-';
    return { origin, secure, session: `${prefix}session`, device: `${prefix}device`, csrf: `${prefix}csrf` };
  }
  private options() { return { httpOnly: true, secure: this.settings().secure, sameSite: 'strict' as const, path: '/' }; }
  private csrf(req: Request) {
    const settings = this.settings(), cookie = req.cookies?.[settings.csrf], header = req.get('X-CSRF-Token');
    if (req.get('Origin') !== settings.origin || typeof cookie !== 'string' || typeof header !== 'string' || !/^[a-f0-9]{64}$/.test(header) || cookie.length !== header.length || !timingSafeEqual(Buffer.from(cookie), Buffer.from(header))) throw new ForbiddenException('Reload this page before continuing.');
  }
  private current(req: Request) { const settings = this.settings(); return this.service.authenticate(req.cookies?.[settings.session], req.cookies?.[settings.device]); }
  private async commandAccount(req: Request) {
    const current = await this.current(req);
    if (req.get('X-Visionary-Account') !== current.uid) throw new ConflictException('The signed-in account changed. Reload your account before saving.');
    return current;
  }
  @Get('csrf')
  getCsrf(@Res({ passthrough: true }) res: Response) {
    const token = randomBytes(32).toString('hex');
    res.cookie(this.settings().csrf, token, { ...this.options(), maxAge: 3600000 }); return { token };
  }
  @Post('session')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() body: any) {
    this.csrf(req);
    // Express does not trust client-supplied forwarded headers in this local server.
    await this.service.rateLimit('session-ip', req.ip || req.socket.remoteAddress || 'unknown', 20);
    const settings = this.settings();
    const result = await this.service.signIn(body?.idToken, { ip: req.ip || req.socket.remoteAddress || 'unknown', userAgent: req.get('User-Agent') || '' }, { cookie: req.cookies?.[settings.session], device: req.cookies?.[settings.device] });
    res.cookie(settings.session, result.cookie, { ...this.options(), maxAge: result.expiresIn });
    res.cookie(settings.device, result.device, { ...this.options(), maxAge: result.expiresIn });
    return result.profile;
  }
  @Get('me') async me(@Req() req: Request) { return this.service.me((await this.current(req)).uid); }
  @Post('onboarding') async onboarding(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req); const { uid } = await this.commandAccount(req); await this.service.rateLimit('profile', uid, 20); return this.service.completeOnboarding(uid, body);
  }
  @Patch('profile') async profile(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req); const { uid } = await this.commandAccount(req); await this.service.rateLimit('profile', uid, 20); return this.service.updateProfile(uid, body);
  }
  @Post('onboarding/introduction') async introduction(@Req() req: Request, @Body() body: unknown) {
    this.csrf(req); const { uid } = await this.commandAccount(req); await this.service.rateLimit('profile', uid, 20); return this.service.completeIntroduction(uid, body);
  }
  @Post('logout') async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    this.csrf(req); const settings = this.settings();
    await this.service.logout(req.cookies?.[settings.device], req.get('X-Visionary-Account'), req.cookies?.[settings.session], { ip: req.ip || req.socket.remoteAddress || 'unknown', userAgent: req.get('User-Agent') || '' });
    for (const name of [settings.session, settings.device, settings.csrf]) res.clearCookie(name, this.options()); return { ok: true };
  }
}
