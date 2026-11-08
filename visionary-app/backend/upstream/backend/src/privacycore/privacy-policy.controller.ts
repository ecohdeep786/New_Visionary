import { BadRequestException, Controller, Get, Req } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { PrivacyPolicyService } from './privacy-policy.service';
@Controller('account/privacy')
export class PrivacyPolicyController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly privacy: PrivacyPolicyService) { super(accounts, config); }
  @Get('policy')
  async policy(@Req() req: Request) {
    const { uid } = await this.commandAccount(req, false);
    if (Object.keys(req.query ?? {}).length) throw new BadRequestException('Privacy policy does not accept account or workspace selectors.');
    return this.privacy.view(uid);
  }
}
