import { Controller, Get, Post, Patch, Req, Res, Body } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'node:crypto';
import { Request, Response } from 'express';
import { FirebaseProductService } from './firebase-product.service';
import { ProductRequestAuthority } from './request-authority';

@Controller('auth')
export class FirebaseProductController extends ProductRequestAuthority {
  constructor(service: FirebaseProductService, config: ConfigService) { super(service, config); }
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
