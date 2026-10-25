import { Module } from '@nestjs/common';
import { OverviewController } from './overview.controller';
import { OverviewService } from './overview.service';
import { InMemoryOverviewStore } from './overview-store';

/**
 * DATA-07 overview module. The in-memory store stands in for the Cloud SQL
 * adapter (Prisma over the DATA-01 projections); swapping the provider is the
 * only change at integration cutover.
 */
@Module({
  controllers: [OverviewController],
  providers: [
    InMemoryOverviewStore,
    { provide: OverviewService, useFactory: (store: InMemoryOverviewStore) => new OverviewService(store), inject: [InMemoryOverviewStore] },
  ],
  exports: [OverviewService],
})
export class OverviewModule {}
