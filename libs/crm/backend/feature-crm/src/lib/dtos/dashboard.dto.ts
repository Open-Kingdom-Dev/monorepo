import { ApiProperty } from '@nestjs/swagger';

export class StageSummaryDto {
  @ApiProperty()
  stage!: string;

  @ApiProperty()
  count!: number;

  @ApiProperty()
  totalValue!: number;

  @ApiProperty()
  weightedValue!: number;
}

export class DashboardSnapshotDto {
  @ApiProperty({ type: [StageSummaryDto] })
  pipeline!: StageSummaryDto[];

  @ApiProperty()
  tasksOpen!: number;

  @ApiProperty()
  tasksOverdue!: number;
}
