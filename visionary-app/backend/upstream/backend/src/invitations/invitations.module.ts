import { Module } from '@nestjs/common';
import { InvitationsController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InMemoryInvitationStore } from './invitation-store';

/**
 * DATA-04 invitation module. The in-memory store stands in for the Cloud SQL
 * adapter (Prisma over the DATA-01 DDL invitation/workspace_membership tables);
 * swapping the provider is the only change at integration cutover.
 */
@Module({
  controllers: [InvitationsController],
  providers: [
    InMemoryInvitationStore,
    {
      provide: InvitationService,
      useFactory: (store: InMemoryInvitationStore) => new InvitationService(store),
      inject: [InMemoryInvitationStore],
    },
  ],
  exports: [InvitationService],
})
export class InvitationsModule {}
