import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspaceRepository } from './workspace.repository';

@Module({
  controllers: [WorkspacesController],
  providers: [WorkspaceRepository],
  exports: [WorkspaceRepository],
})
export class WorkspacesModule {}
