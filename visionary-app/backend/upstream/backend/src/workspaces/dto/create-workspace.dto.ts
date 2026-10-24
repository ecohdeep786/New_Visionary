import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean;

  @IsOptional()
  @IsUUID()
  commandId?: string;

  @IsOptional()
  payload?: unknown;
}
