import { PrivacyPolicyController } from '../../privacycore/privacy-policy.controller';
import { PrivacyPolicyService } from '../../privacycore/privacy-policy.service';
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
import { FeedbackController } from '../../feedback/feedback.controller';
import { FeedbackService } from '../../feedback/feedback.service';
import { LearningController } from '../../learning/learning.controller';
import { LearningService } from '../../learning/learning.service';
import { KnowledgeProjectionController } from '../../learning/knowledge-projection.controller';
import { KnowledgeProjectionService } from '../../learning/knowledge-projection.service';
import { PersonalWorkspaceController } from '../../workspaces/personal-workspace.controller';
import { PersonalWorkspaceService } from '../../workspaces/personal-workspace.service';

import { ProductInvitationController } from '../../invitations/product-invitation.controller';
import { ProductInvitationService } from '../../invitations/product-invitation.service';
import { ProductConsentController } from '../../consent/product-consent.controller';
import { ProductConsentService } from '../../consent/product-consent.service';
import { OverviewController } from '../../overview/overview.controller';
import { OverviewService } from '../../overview/overview.service';
import { ProductOverviewStore } from '../../overview/product-overview.store';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), FirebaseAdminModule], controllers: [OverviewController, ProductConsentController, ProductInvitationController, PrivacyPolicyController, FirebaseProductController, BillingController, AccountController, FeedbackController, KnowledgeProjectionController, LearningController, PersonalWorkspaceController], providers: [ProductOverviewStore, { provide: OverviewService, useFactory: (store: ProductOverviewStore) => new OverviewService(store), inject: [ProductOverviewStore] }, ProductConsentService, ProductInvitationService, PrivacyPolicyService, FirebaseProductService, BillingService, BillingRepository, RazorpayProvider, FeedbackService, KnowledgeProjectionService, LearningService, PersonalWorkspaceService] })
export class FirebaseProductModule {}
