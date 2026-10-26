import { Body, Controller, HttpException, Post, Req, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { FirebaseProductService } from '../auth/firebase-product/firebase-product.service';
import { ProductRequestAuthority } from '../auth/firebase-product/request-authority';
import { PersonalWorkspaceService } from './personal-workspace.service';
import { ProvisionError } from './provision-types';

@Controller('account/workspace')
export class PersonalWorkspaceController extends ProductRequestAuthority {
  constructor(accounts: FirebaseProductService, config: ConfigService, private readonly personal: PersonalWorkspaceService) { super(accounts, config); }
  @Post('provision')
  async provision(@Req() req: Request, @Body() input: unknown) {
    this.csrf(req);
    const { uid } = await this.commandAccount(req);
    try { return await this.personal.provision(uid, input); }
    catch (error) {
      if (error instanceof ProvisionError) throw new HttpException({ code: error.code, message: 'Personal workspace could not be provisioned. Retry the same command after checking status.' }, error.status);
      // Never expose SQL URLs, query/error bodies, credential or account contents.
      throw new ServiceUnavailableException('Personal workspace provisioning is pending or unavailable. Retry the same command.');
    }
  }
}
