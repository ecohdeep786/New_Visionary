import { IsString, IsOptional, IsBoolean, Length, Matches, MaxLength } from 'class-validator';

export class CreateWorkspaceDto {
  @IsString()
  @Length(1, 120)
  name: string;

  @IsString()
  @Matches(/^[a-z0-9][a-z0-9-]{0,79}$/)
  slug: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsBoolean()
  isPersonal?: boolean;

  @IsString()
  @Matches(/^[A-Za-z0-9_:-]{1,128}$/)
  commandId: string;
}
