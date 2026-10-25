import { Module } from '@nestjs/common';
import { ConsentController } from './consent.controller';
import { ConsentService } from './consent.service';
import { InMemoryConsentStore } from './consent-store';

/**
 * DATA-05 consent/share module. The in-memory store stands in for the Cloud
 * SQL adapter (Prisma over the DATA-01 consent_grants / share_grants tables);
 * swapping the provider is the only change at integration cutover.
 */
@Module({
  controllers: [ConsentController],
  providers: [
    InMemoryConsentStore,
    { provide: ConsentService, useFactory: (store: InMemoryConsentStore) => new ConsentService(store), inject: [InMemoryConsentStore] },
  ],
  exports: [ConsentService],
})
export class ConsentModule {}
