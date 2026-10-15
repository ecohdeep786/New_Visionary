import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FirebaseAdminModule } from '../firebase/firebase-admin.module';
import { FirebaseProductController } from './firebase-product.controller';
import { FirebaseProductService } from './firebase-product.service';
import { BillingController } from '../../billing/billing.controller';
import { BillingService } from '../../billing/billing.service';
import { BillingRepository } from '../../billing/billing.repository';
import { RazorpayProvider } from '../../billing/razorpay.provider';
import { AccountController } from './account.controller';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), FirebaseAdminModule], controllers: [FirebaseProductController, BillingController, AccountController], providers: [FirebaseProductService, BillingService, BillingRepository, RazorpayProvider] })
export class FirebaseProductModule {}
