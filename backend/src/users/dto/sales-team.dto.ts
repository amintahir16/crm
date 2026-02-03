import { IsEmail, IsString, IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';

export class CreateTeamMemberDto {
  @IsString()
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  address?: string;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsOptional()
  @IsString()
  department?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  workloadScore?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class AssignLeadDto {
  @IsString()
  teamMemberId: string;

  @IsString()
  leadId: string;
}

export class TeamPerformanceFiltersDto {
  @IsOptional()
  startDate?: Date;

  @IsOptional()
  endDate?: Date;

  @IsOptional()
  @IsString()
  memberId?: string;
}
